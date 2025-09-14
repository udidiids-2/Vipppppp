module.exports = {
  config: {
    name: "khanki",
    aliases: [],
    version: "1.0",
    author: "🔰𝗥𝗮𝗵𝗮𝘁_𝗕𝗼𝘁🔰",
    countDown: 5,
    role: 2,
    shortDescription: "মেনশন করলে বলে 'কে তুই' আর ভিডিও পাঠায়",
    longDescription: "!Khan @user — মেনশন করা ",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    }
  },

  onStart: async function ({ api, event, args, Users }) {
    // মেনশন আছে কি না চেক
    if (!event.mentions || Object.keys(event.mentions).length === 0) {
      return api.sendMessage("কারো মেনশন করো ভাই 🙂", event.threadID, event.messageID);
    }

    try {
      // প্রথম মেনশন নেওয়া
      const mentionID = Object.keys(event.mentions)[0];
      const mentionName = event.mentions[mentionID] || (await Users.getName(mentionID));

      // Google Drive ফাইল আইডি
      const FILE_ID = "1KWZioIfqTtw2--7ckq1mVdsMsrC1QKKj";
      const videoUrl = `https://drive.google.com/uc?export=download&id=${FILE_ID}`;

      let stream = null;
      if (global && global.utils && typeof global.utils.getStreamFromURL === "function") {
        stream = await global.utils.getStreamFromURL(videoUrl);
      }

      if (!stream) {
        // যদি স্ট্রিম না মেলে তাহলে শুধু লিঙ্ক পাঠাবে
        return api.sendMessage(
          {
            body: `${mentionName} খানকির পোলা 🫦মাদারচোদ🥹চুদমারানি🫵😏তোর জন্য এই ভয়েসটা🫦🫦রাহাদ বস এর পক্ষ থেকে দিয়ে দিলাম💋💦\n(ভিডিও লিংক: ${videoUrl})`,
            mentions: [{ tag: mentionName, id: mentionID }]
          },
          event.threadID,
          event.messageID
        );
      }

      // মেসেজ পাঠানো
      return api.sendMessage(
        {
          body: `${mentionName} রাহাদ তোর মাকে বেলুন দিয়ে খেলাবো💋`,
          mentions: [{ tag: mentionName, id: mentionID }],
          attachment: stream
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("Error in Khan command:", err);
      return api.sendMessage(
        "কোথাও ত্রুটি হয়েছে — ভয়েস পাঠানো যায়নি",
        event.threadID,
        event.messageID
      );
    }
  }
};
