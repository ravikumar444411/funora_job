const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

function generateCaptions(videoPath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(videoPath);
    const baseArgs = `"${videoPath}" --model base --output_format srt --output_dir "${outputDir}"`;
    const commands = [
      `whisper ${baseArgs}`,
      `python3 -m whisper ${baseArgs}`,
      `"${path.resolve(".venv/bin/python3")}" -m whisper ${baseArgs}`
    ];
    const subtitlePath = path.join(
      outputDir,
      `${path.basename(videoPath, path.extname(videoPath))}.srt`
    );

    const handleFailure = (errors) => {
      const error = new Error(
        [
          "Whisper CLI is not available.",
          "Homebrew Python blocks global pip installs (PEP 668).",
          "Use a local venv:",
          "python3 -m venv .venv",
          "source .venv/bin/activate",
          "python3 -m pip install -U pip openai-whisper",
          "",
          "Or without activation:",
          ".venv/bin/python3 -m pip install -U pip openai-whisper",
          "",
          "Tried commands:",
          ...commands.map((cmd, i) => `${i + 1}. ${cmd}`)
        ].join("\n")
      );
      error.commandErrors = errors;
      reject(error);
    };

    const runSequentially = (index, errors) => {
      if (index >= commands.length) {
        return handleFailure(errors);
      }

      exec(commands[index], (error) => {
        if (!error) {
          return resolve(subtitlePath);
        }

        const isMissingWhisper =
          error.code === 127 ||
          /command not found/i.test(error.message || "") ||
          /no module named whisper/i.test(error.message || "") ||
          /no module named whisper/i.test(error.stderr || "");

        if (!isMissingWhisper) {
          return reject(error);
        }

        errors.push(error);
        runSequentially(index + 1, errors);
      });
    };

    fs.ensureDir(outputDir)
      .then(() => {
        runSequentially(0, []);
      })
      .catch(reject);
  });
}

module.exports = generateCaptions;
