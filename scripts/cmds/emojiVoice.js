// scripts/cmds/emojiVoice.js
const fs = require("fs");
const path = require("path");

// এখানে যত খুশি ইমোজি ↔ ফাইল যোগ করো
const EMOJI_VOICE_MAP = {
  "😁": "laugh.mp3",
  "🤣": "laugh.mp3",
  "🤭": "funny.mp3",
  // উদাহরণ:
  // "😍": "love.mp3",
  // "😡": "angry.mp3",
  // "😭": "cry.mp3"
};

// সবার জন্য সাধারণ হ্যান্ডলার (ভিন্ন বটেও কাজ করবে)
async function handleEmojiVoice({ event, api }) {
  const text = event?.body || "";
  if (!text) return;

  // বট নিজের মেসেজ স্কিপ করবে
  try {
    if (typeof api.getCurrentUserID === "function" &&
        event.senderID == api.getCurrentUserID()) return;
  } catch { /* ignore */ }

  for (const emoji of Object.keys(EMOJI_VOICE_MAP)) {
    if (text.includes(emoji)) {
      const filePath = path.join(__dirname, "../voices", EMOJI_VOICE_MAP[emoji]);
      if (!fs.existsSync(filePath)) {
        console.log("[emojiVoice] ❌ Voice file not found:", filePath);
        return;
      }
      return api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        event.threadID,
        event.messageID
      );
    }
  }
}

module.exports = {
  config: {
    name: "emojiVoice",
    version: "1.2",
    author: "Your Name",
    countDown: 0,              // কুলডাউন নেই
    role: 0,                   // সাধারণ ইউজার লেভেল
    category: "automation",    // ⚠️ এই লাইনটাই দরকার ছিল
    shortDescription: "ইমোজি দিলে ভয়েস পাঠায়",
    longDescription:
      "গ্রুপে কেউ 😁/🤣/🤭 ইত্যাদি ইমোজি পাঠালে নির্দিষ্ট mp3 ভয়েস পাঠাবে; বট নিজের মেসেজ এড়িয়ে যায়।"
  },

  // ভিন্ন ফ্রেমওয়ার্কে ভিন্ন হুক নামে কল হয়—সবই এক হ্যান্ডলারে রাউট করা
  onStart: async function () {},
  onChat: handleEmojiVoice,     // GoatBot-স্টাইলে
  onMessage: handleEmojiVoice,  // কিছু বটে এ নামে থাকে
  onEvent: handleEmojiVoice     // আরেক ভ্যারিয়েশন
};
