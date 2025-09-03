const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const Canvas = require("canvas"); // npm install canvas
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Nayan + Rahat (Modified)",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (threadData?.settings?.sendWelcomeMessage === false) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const threadName = threadInfo.threadName || "এই গ্রুপ";

    for (const user of event.logMessageData.addedParticipants) {
      try {
        const userId = user.userFbId;
        const userName = user.fullName;

        // 🖼 কার্ড বানানোর ফাংশন
        const createWelcomeCard = async () => {
          // Background (তুমি চাইলে এখানে নিজের লিংক বসাতে পারো)
          const bgLinks = [
            "https://i.imgur.com/dDSh0wc.jpeg",
            "https://i.imgur.com/UucSRWJ.jpeg",
            "https://i.imgur.com/V5L9dPi.jpeg",
            "https://i.imgur.com/M7HEAMA.jpeg"
          ];
          const bg = await Canvas.loadImage(
            bgLinks[Math.floor(Math.random() * bgLinks.length)]
          );

          // User avatar
          const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512`;
          const avatar = await Canvas.loadImage(avatarUrl);

          // Canvas create
          const canvas = Canvas.createCanvas(bg.width, bg.height);
          const ctx = canvas.getContext("2d");

          // Background draw
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

          // Circle avatar
          ctx.save();
          ctx.beginPath();
          ctx.arc(250, 250, 200, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatar, 50, 50, 400, 400);
          ctx.restore();

          // Text
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.font = "bold 80px Sans";
          ctx.fillText(`স্বাগতম ${userName}`, canvas.width / 2, 600);

          ctx.font = "bold 60px Sans";
          ctx.fillText(`গ্রুপে: ${threadName}`, canvas.width / 2, 700);

          const filePath = path.join(__dirname, "cache", `welcome_${userId}.png`);
          fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
          return filePath;
        };

        // কার্ড বানাও
        const cardPath = await createWelcomeCard();

        // সময় বের করা
        const timeNow = moment.tz("Asia/Dhaka").format("HH:mm:ss - DD/MM/YYYY (dddd)");

        // ফাইনাল মেসেজ
        const msg = {
          body: `✨ স্বাগতম ${userName} 🎉\n\nআপনি এখন ${threadName} এর সদস্য!\n\n⏰ যোগ দেওয়ার সময়: ${timeNow}`,
          attachment: fs.createReadStream(cardPath)
        };

        // Send
        message.send(msg, threadID, () => {
          fs.unlinkSync(cardPath); // পাঠানোর পর ছবি ডিলিট
        });

      } catch (err) {
        console.error("WELCOME ERROR:", err);
      }
    }
  }
};
