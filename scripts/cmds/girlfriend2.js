// girlfriend2.js — Couple Frame (Auto-delete 2 min)
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "girlfriend2",
    version: "2.0",
    author: "Rahat Premium",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Couple frame (girlfriend auto-delete 2 min)" },
    category: "generator",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event, config }) {
    try {
      // ✅ Allow special UID bypass (future-proof)
      const allowedUID = "61561511477968";
      if (
        config.role === 2 && // যদি কখনো role 2 করে দেওয়া হয়
        event.senderID !== allowedUID &&
        !global.GoatBot.config.adminBot.includes(event.senderID)
      ) {
        return api.sendMessage(
          "❌ এই কমান্ড শুধু এডমিন আর Rahat বস-এর জন্য 🔒",
          event.threadID,
          event.messageID
        );
      }

      const mention = Object.keys(event.mentions || {})[0];
      if (!mention)
        return api.sendMessage("❌ কাকে ভালোবাসা দিতে চাও তাকে mention করো🐸", event.threadID, event.messageID);

      const mentionName = event.mentions[mention];
      const senderID = event.senderID;

      // Google Drive frame link
      const FILE_ID = "1FQbM_ldg2EN-MRT0io4A33iIt3rZ7hjt";
      const frameUrl = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

      // Profile URLs
      const mentionUrl = `https://graph.facebook.com/${mention}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const senderUrl  = `https://graph.facebook.com/${senderID}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      // Load images
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

      // --- Updated Profile sizes & positions ---
      // Boy (sender)
      const sizeSender = 250 + 3 + 8; // 261px
      const rSender = sizeSender / 2;
      const boy = { x: (880 + 2 - rSender), y: (140 + 1 - rSender) };

      // Girl (mention)
      const sizeMention = 230 + 8 + 8; // 246px
      const rMention = sizeMention / 2;
      const girl = { x: (490 + 5 - rMention), y: (290 - rMention) };

      // Draw boy (sender)
      ctx.save();
      ctx.beginPath();
      ctx.arc(880 + 2, 140 + 1, rSender, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(senderImg, boy.x, boy.y, sizeSender, sizeSender);
      ctx.restore();

      // Draw girl (mention)
      ctx.save();
      ctx.beginPath();
      ctx.arc(490 + 5, 290, rMention, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(mentionImg, girl.x, girl.y, sizeMention, sizeMention);
      ctx.restore();

      // Save image
      const outPath = path.join(__dirname, `girlfriend2_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      // Send image
      const messageInfo = await api.sendMessage({
        body: `${mentionName} ➕ You = স্কুল জীবনে না পাওয়া আরেকটা দৃশ্য🐸🙂 `,
        mentions: [{ tag: mentionName, id: mention }],
        attachment: fs.createReadStream(outPath)
      }, event.threadID, event.messageID);

      // Auto delete after 2 minutes (120000 ms)
      setTimeout(async () => {
        try {
          await api.unsendMessage(messageInfo.messageID);
          fs.unlinkSync(outPath); // remove file from server
        } catch (err) {
          console.error("Error deleting message or file:", err);
        }
      }, 120000); // 2 minutes

    } catch (e) {
      console.error(e);
      return api.sendMessage("⚠️ Error generating girlfriend2 frame.", event.threadID, event.messageID);
    }
  }
};
