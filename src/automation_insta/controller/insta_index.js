require('dotenv').config();

const fs = require('fs-extra');
const path = require('path');
const downloadVideo = require('./downloadVideo');
const cutVideo = require('./cutVideo');
const mergeVideos = require('./mergeVideos');
const generateCaptions = require('./generateCaptions');
const burnCaptions = require('./burnCaptions');
const addOutro = require('./addOutro');
const uploadReel = require('./uploadInstagram');
const { uploadLocalFileToS3 } = require('../../utils/s3Upload');

const DEFAULT_CLIP_START = process.env.CLIP_START || '00:00:30';
const DEFAULT_CLIP_DURATION = process.env.CLIP_DURATION || '20';
const OUTRO_PATH = process.env.OUTRO_PATH || 'assets/outro.mp4';
const S3_LINK_TTL_SECONDS = 24 * 60 * 60;
const LOCAL_MEDIA_TTL_HOURS = Number.parseInt(process.env.LOCAL_MEDIA_TTL_HOURS || '24', 10);
const LOCAL_MEDIA_TTL_MS = LOCAL_MEDIA_TTL_HOURS * 60 * 60 * 1000;
const LOCAL_MEDIA_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function cleanupExpiredRunFolders(baseDir, ttlMs) {
  await fs.ensureDir(baseDir);

  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const now = Date.now();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderPath = path.join(baseDir, entry.name);
    const runIdTs = Number.parseInt(entry.name, 10);
    let createdAtMs = Number.isNaN(runIdTs) ? 0 : runIdTs;

    if (!createdAtMs) {
      const stats = await fs.stat(folderPath);
      createdAtMs = stats.mtimeMs;
    }

    if (now - createdAtMs >= ttlMs) {
      await fs.remove(folderPath);
    }
  }
}

async function cleanupLocalMediaDirs() {
  await cleanupExpiredRunFolders('input', LOCAL_MEDIA_TTL_MS);
  await cleanupExpiredRunFolders('output', LOCAL_MEDIA_TTL_MS);
}

const cleanupTimer = setInterval(() => {
  cleanupLocalMediaDirs().catch((error) => {
    console.error('Local media cleanup failed:', error.message);
  });
}, LOCAL_MEDIA_CLEANUP_INTERVAL_MS);

cleanupTimer.unref();

function parseYoutubeUrls(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((url) => String(url).trim()).filter(Boolean);
  }

  const rawValue = String(input).trim();
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.map((url) => String(url).trim()).filter(Boolean);
    }
  } catch (error) {
    // Fallback to CSV/single URL parsing.
  }

  if (rawValue.includes(',')) {
    return rawValue
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
  }

  return [rawValue];
}

async function runInstaPipeline({
  youtubeUrls,
  startTime = DEFAULT_CLIP_START,
  duration = DEFAULT_CLIP_DURATION,
  shouldUpload = false
}) {
  const runId = Date.now();
  const inputDir = path.join('input', String(runId));
  const outputDir = path.join('output', String(runId));
  const mergedClipPath = path.join(outputDir, `merged-${runId}.mp4`);
  const captionedPath = path.join(outputDir, `captioned-${runId}.mp4`);
  const finalVideoPath = path.join(outputDir, `final-${runId}.mp4`);

  await fs.ensureDir(inputDir);
  await fs.ensureDir(outputDir);

  const clips = [];

  for (let index = 0; index < youtubeUrls.length; index += 1) {
    const url = youtubeUrls[index];
    const downloadedVideo = await downloadVideo(url, path.join(inputDir, `video-${index + 1}.mp4`));
    const clip = await cutVideo(
      downloadedVideo,
      startTime,
      duration,
      path.join(outputDir, `clip-${index + 1}.mp4`)
    );

    clips.push(clip);
  }

  const mergedClip = await mergeVideos(clips, mergedClipPath);
  let videoForOutro = mergedClip;
  let captionsApplied = false;
  let captionsWarning = null;

  try {
    const subtitles = await generateCaptions(mergedClip);
    videoForOutro = await burnCaptions(mergedClip, subtitles, captionedPath);
    captionsApplied = true;
  } catch (error) {
    const isMissingWhisper = /Whisper CLI is not available/i.test(error.message || '');
    if (!isMissingWhisper) {
      throw error;
    }

    captionsWarning = error.message;
    console.warn('Caption generation skipped:', captionsWarning);
  }

  const finalVideo = await addOutro(videoForOutro, OUTRO_PATH, finalVideoPath);

  if (shouldUpload) {
    await uploadReel(finalVideo);
  }

  return {
    runId,
    inputDir: path.resolve(inputDir),
    outputDir: path.resolve(outputDir),
    captionsApplied,
    captionsWarning,
    finalVideo: path.resolve(finalVideo),
    mergedClip: path.resolve(mergedClip)
  };
}

const createAndUpdateInstaPostQueue = async (req, res) => {
  try {
    await cleanupLocalMediaDirs();

    const youtubeUrls = parseYoutubeUrls(req.body.youtubeUrls || req.body.youtubeUrl);

    if (!youtubeUrls.length) {
      return res.status(400).json({
        message: 'Missing YouTube URL(s). Send youtubeUrls as an array or string.'
      });
    }

    const pipelineResult = await runInstaPipeline({
      youtubeUrls,
      startTime: req.body.clipStart || DEFAULT_CLIP_START,
      duration: req.body.clipDuration || DEFAULT_CLIP_DURATION,
      shouldUpload: req.body.uploadToInstagram === true
    });

    const s3Video = await uploadLocalFileToS3(pipelineResult.finalVideo, {
      keyPrefix: 'insta/final-videos',
      expiresInSeconds: S3_LINK_TTL_SECONDS,
      contentType: 'video/mp4'
    });

    await fs.remove(pipelineResult.inputDir);
    await fs.remove(pipelineResult.outputDir);

    const response = {
      message: 'Automation complete.',
      totalSources: youtubeUrls.length,
      captionsApplied: pipelineResult.captionsApplied,
      video: {
        key: s3Video.key,
        expiresAt: s3Video.expiresAt,
        viewUrl: s3Video.viewUrl,
        downloadUrl: s3Video.downloadUrl
      }
    };

    if (pipelineResult.captionsWarning) {
      response.captionsWarning = pipelineResult.captionsWarning;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Insta pipeline failed:', error);
    return res.status(500).json({
      message: 'Insta pipeline failed.',
      error: error.message
    });
  }
};

exports.createAndUpdateInstaPostQueue = createAndUpdateInstaPostQueue;
exports.runInstaPipeline = runInstaPipeline;
