const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "emojiVoice",
    eventType: ["message"],
    version: "1.1",
    author: "Rahat",
    description: "Emoji দিলে Voice পাঠাবে (বট নিজের মেসেজ ধরবে না)"
  },

  onStart: async function () {},

  onEvent: async function ({ event, api }) {
    if (!event.body) return;

    // 👉 বট নিজের মেসেজ স্কিপ করবে
    if (event.senderID == api.getCurrentUserID()) return;

    // 👉 ইমোজি ↔ ভয়েস ফাইল লিস্ট
    const emojiVoiceMap = {
      "😁": "laugh.mp3",
      "🤣": "laugh.mp3",
      "🤭": "funny.mp3",
      "😭": "cry.mp3",
      "😍": "love.mp3",
      "😡": "angry.mp3",
      "😎": "cool.mp3",
      "👋": "hello.mp3"
      // চাইলে আরো যোগ করো
    };

    for (let emoji in emojiVoiceMap) {
      if (event.body.includes(emoji)) {
        const filePath = path.join(__dirname, "../voices", emojiVoiceMap[emoji]);

        if (fs.existsSync(filePath)) {
          api.sendMessage(
            { attachment: fs.createReadStream(filePath) },
            event.threadID,
            event.messageID
          );
        } else {
          console.log("❌ Voice file not found:", filePath);
        }

        break; // একবার পেলে আর খুঁজবে না
      }
    }
  }
};
