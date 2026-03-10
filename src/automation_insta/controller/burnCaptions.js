const ffmpeg = require("fluent-ffmpeg");

function burnCaptions(video, subtitles, output) {

  return new Promise((resolve, reject) => {

    ffmpeg(video)
      .videoFilters(`subtitles=${subtitles}`)
      .output(output)
      .on("end", () => resolve(output))
      .on("error", reject)
      .run();

  });
}

module.exports = burnCaptions;