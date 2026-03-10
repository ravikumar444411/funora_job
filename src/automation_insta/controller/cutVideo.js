const ffmpeg = require("fluent-ffmpeg");

function cutVideo(input, start, duration, output) {
  return new Promise((resolve, reject) => {

    ffmpeg(input)
      .setStartTime(start)
      .setDuration(duration)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run();

  });
}

module.exports = cutVideo;