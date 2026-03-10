const youtubedl = require("yt-dlp-exec");
const fs = require("fs-extra");
const path = require("path");

async function downloadVideo(url, output = "input/video.mp4") {

  await fs.ensureDir("input");

  const cleanUrl = url.split("?")[0];

  const cookiesPath = path.join(
    "/home/ec2-user/funora_job",
    "www.youtube.com_cookies.txt"
  );

  await youtubedl(cleanUrl, {
    output: output,
    format: "bv*[height<=1080]+ba/b[height<=1080]",
    cookies: cookiesPath,
    extractorArgs: "youtube:player_client=android",
    sleepInterval: 2,
    maxSleepInterval: 5
  });

  return output;
}

module.exports = downloadVideo;