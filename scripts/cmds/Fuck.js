// loveAdmin.js — Admin-only couple frame (v1.1, swapped DPs)
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "fuck",
    version: "1.1",
    author: "Rahat Premium",
    countDown: 5,
    role: 2, // 🔒 Only bot admins can use
    shortDescription: { en: "Admin-only couple frame (swapped profiles)" },
    category: "FUN",
    guide: { en: "{pn} @mention" }
  },

  onStart: async function ({ api, event, config }) {
    try {
      // ✅ Allow special UID bypass
      const allowedUID = "61561511477968";
      if (
        event.senderID !== allowedUID &&
        config.role === 2 &&
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
        return api.sendMessage("❌কাকে করতে চাও তাকে mention কর🤧😁", event.threadID, event.messageID);

      const mentionName = event.mentions[mention];
      const senderID = event.senderID;

      // --- Google Drive Frame (your PNG)
      const FILE_ID = "1zLvEkABeFdVkLa3zHJLLaGFGKlkj6dVX";
      const frameUrl = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

      // Profile pics (FB)
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

      // --- Positions (same as your spec)
      // Small slot: (20,300) size 100x100 → mask center (70,350) r=50
      const small = { x: 20, y: 300, w: 100, h: 100, cx: 70, cy: 350, r: 50 };
      // Big slot: (100,20) size 150x150 → mask center (175,95) r=75
      const big   = { x: 100, y: 20, w: 150, h: 150, cx: 175, cy: 95, r: 75 };

      // ✅ SWAP: mention goes to BIG slot, sender goes to SMALL slot

      // Mention profile (BIG)
      ctx.save();
      ctx.beginPath();
      ctx.arc(big.cx, big.cy, big.r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(mentionImg, big.x, big.y, big.w, big.h);
      ctx.restore();

      // Sender profile (SMALL)
      ctx.save();
      ctx.beginPath();
      ctx.arc(small.cx, small.cy, small.r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(senderImg, small.x, small.y, small.w, small.h);
      ctx.restore();

      // Save & send
      const outPath = path.join(__dirname, "loveadmin_swapped_result.png");
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      return api.sendMessage({
        body: ` ${mentionName}➕🔰𝗥𝗮𝗵𝗮𝘁🔰বস সেই লাগছে😛🐸`,
        mentions: [{ tag: mentionName, id: mention }],
        attachment: fs.createReadStream(outPath)
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("⚠️ Error generating admin-only love frame.", event.threadID, event.messageID);
    }
  }
};
