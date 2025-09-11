const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "love", // Command হবে /love
    version: "2.0",
    author: "Rahat Premium",
    countDown: 5,
    role: 0, // সবাই ব্যবহার করতে পারবে
    shortDescription: { en: "Couple frame with perfect circle DPs (premium)" },
    category: "generator",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event }) {
    try {
      const mention = Object.keys(event.mentions || {})[0];
      if (!mention)
        return api.sendMessage("❌ভালোবাসার মানুষকে mention দিয়ে আবার চেষ্টা করো🐸", event.threadID, event.messageID);

      const mentionName = event.mentions[mention];
      const senderID = event.senderID;

      // Google Drive frame
      const FILE_ID = "179iM_fpUoO-HLa6BzbQWeU_gBvWaDtC8";
      const frameUrl = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

      const mentionUrl = `https://graph.facebook.com/${mention}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const senderUrl  = `https://graph.facebook.com/${senderID}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      const [frameImg, mentionImg, senderImg] = await Promise.all([
        loadImage(frameUrl),
        loadImage(mentionUrl),
        loadImage(senderUrl)
      ]);

      const W = frameImg.width, H = frameImg.height;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // Draw frame
      ctx.drawImage(frameImg, 0, 0, W, H);

      // --- Final circle positions ---
      const left  = { cx: 330, cy: 370, r: 153 };   // Mention profile
      const right = { cx: 956, cy: 357, r: 153 };   // Sender profile (moved 1px more left)

      // Left (mention)
      ctx.save();
      ctx.beginPath();
      ctx.arc(left.cx, left.cy, left.r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(mentionImg, left.cx - left.r, left.cy - left.r, left.r * 2, left.r * 2);
      ctx.restore();

      // Right (sender)
      ctx.save();
      ctx.beginPath();
      ctx.arc(right.cx, right.cy, right.r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(senderImg, right.cx - right.r, right.cy - right.r, right.r * 2, right.r * 2);
      ctx.restore();

      // Save & send
      const outPath = path.join(__dirname, "love_result.png");
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: `💚 ${mentionName}➕You🙃`,
        mentions: [{ tag: mentionName, id: mention }],
        attachment: fs.createReadStream(outPath)
      }, event.threadID, event.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("⚠️ Error generating love frame.", event.threadID, event.messageID);
    }
  }
};
