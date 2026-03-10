const youtubedl = require("yt-dlp-exec");
const fs = require("fs-extra");
const path = require("path");

async function downloadVideo(url, output = "input/video.mp4") {

  await fs.ensureDir("input");

  // remove tracking params like ?si=
  const cleanUrl = url.split("?")[0];

  const cookiesPath = path.join(
    "/home/ec2-user/funora_job",
    "www.youtube.com_cookies.txt"
  );

  await youtubedl(cleanUrl, {
    output: output,
    format: "bv*+ba/b",
    cookies: cookiesPath,
    "sleep-interval": 2,
    "max-sleep-interval": 5,
    "js-runtimes": "node"
  });

  return output;
}

module.exports = downloadVideo;