const { IgApiClient } = require("instagram-private-api");
const fs = require("fs-extra");

async function uploadReel(videoPath) {
  const username = process.env.INSTAGRAM_USERNAME;
  const password = process.env.INSTAGRAM_PASSWORD;
  if (!username || !password) {
    throw new Error("Missing INSTAGRAM_USERNAME or INSTAGRAM_PASSWORD in environment.");
  }

  const ig = new IgApiClient();

  ig.state.generateDevice(username);

  await ig.account.login(username, password);

  await ig.publish.video({
    video: await fs.readFile(videoPath),
    caption: "Follow for more clips"
  });

}

module.exports = uploadReel;
