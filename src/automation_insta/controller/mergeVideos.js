const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "'\\''");
}

function mergeVideos(videoPaths, outputPath) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(videoPaths) || videoPaths.length === 0) {
      return reject(new Error("mergeVideos requires at least one video path."));
    }

    const tempDir = path.join("output", "tmp");
    const concatFile = path.join(tempDir, "concat-list.txt");
    const absOutput = path.resolve(outputPath);

    fs.ensureDir(tempDir)
      .then(() => {
        const listContent = videoPaths
          .map((videoPath) => `file '${escapeSingleQuotes(path.resolve(videoPath))}'`)
          .join("\n");
        return fs.writeFile(concatFile, listContent, "utf8");
      })
      .then(() => {
        const command = [
          "ffmpeg -y",
          `-f concat -safe 0 -i "${concatFile}"`,
          "-c:v libx264 -c:a aac -pix_fmt yuv420p",
          `"${absOutput}"`
        ].join(" ");

        exec(command, (error) => {
          if (error) {
            return reject(error);
          }
          resolve(outputPath);
        });
      })
      .catch(reject);
  });
}

module.exports = mergeVideos;
