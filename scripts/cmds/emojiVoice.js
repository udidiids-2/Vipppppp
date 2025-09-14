const fs = require("fs");
const path = require("path");

function findFileRecursive(dir, filename) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findFileRecursive(fullPath, filename);
      if (found) return found;
    } else if (file.toLowerCase() === filename.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

module.exports = {
  config: {
    name: "Khanki",
    aliases: [],
    version: "3.0",
    author: "🔰𝗥𝗮𝗵𝗮𝘁_𝗕𝗼𝘁🔰",
    countDown: 5,
    role: 2,
    shortDescription: "অডিও পাঠাবে",
    longDescription: "!Khanki @user '",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    }
  },

  onStart: async function ({ api, event, args, Users }) {
    if (!event.mentions || Object.keys(event.mentions).length === 0) {
      return api.sendMessage("কারো মেনশন করো 𝗥𝗮𝗵𝗮𝘁 Boss 🙂", event.threadID, event.messageID);
    }

    try {
      const mentionID = Object.keys(event.mentions)[0];
      const mentionName = event.mentions[mentionID] || (await Users.getName(mentionID));

      // যেকোনো যায়গা থেকে খুঁজবে
      const projectRoot = process.cwd();
      const voiceFile = findFileRecursive(projectRoot, "Khan.mp4.mp3");

      if (!voiceFile) {
        return api.sendMessage(
          `${mentionName} খানকির পোলা🫦মাদারচোদ💦তোর জন্য ভয়েসটা😏 𝗥𝗮𝗵𝗮𝘁 বসের বদলে আমি চুদে দিলাম💋💦\n⚠️ খুঁজেও কোনো ভয়েস পাওয়া গেল না`,
          event.threadID,
          event.messageID
        );
      }

      // প্রথমে অডিও পাঠানো
      await api.sendMessage(
        {
          attachment: fs.createReadStream(voiceFile)
        },
        event.threadID
      );

      // তারপর মেনশন মেসেজ পাঠানো
      return api.sendMessage(
        {
          body: `${mentionName} খানকির পোলা🫦মাদারচোদ💦তোর জন্য ভয়েসটা😏 𝗥𝗮𝗵𝗮𝘁 বসের বদলে আমি চুদে দিলাম💋💦`,
          mentions: [{ tag: mentionName, id: mentionID }]
        },
        event.threadID
      );

    } catch (err) {
      console.error("Error in Khanki command:", err);
      return api.sendMessage(
        "ত্রুটি হলেও ভয় নেই 🙂 বট ক্র্যাশ করবে না, কিন্তু ভয়েস ফাইল পাওয়া যায়নি।",
        event.threadID,
        event.messageID
      );
    }
  }
};
