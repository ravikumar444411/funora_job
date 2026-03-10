const youtubedl = require("yt-dlp-exec");
const fs = require("fs-extra");

async function downloadVideo(url, output = "input/video.mp4") {
  await fs.ensureDir("input");

  await youtubedl(url, {
    output: output,
    format: "mp4"
  });

  return output;
}

module.exports = downloadVideo;
