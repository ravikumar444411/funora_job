const { execFile } = require("child_process");

function addOutro(video, outro, output) {
  return new Promise((resolve, reject) => {
    const targetWidth = Number.parseInt(process.env.INSTA_WIDTH || "1080", 10);
    const targetHeight = Number.parseInt(process.env.INSTA_HEIGHT || "1920", 10);
    const targetFps = Number.parseInt(process.env.INSTA_FPS || "30", 10);
    const args = [
      "-y",
      "-i",
      video,
      "-i",
      outro,
      "-filter_complex",
      [
        `[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,`,
        `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,`,
        `setsar=1,fps=${targetFps}[v0];`,
        `[1:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,`,
        `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,`,
        `setsar=1,fps=${targetFps}[v1];`,
        "[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];",
        "[1:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];",
        "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]"
      ].join(""),
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(targetFps),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      output
    ];

    execFile("ffmpeg", args, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve(output);
    });
  });
}

module.exports = addOutro;
