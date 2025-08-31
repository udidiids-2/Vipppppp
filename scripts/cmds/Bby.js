const fs = require("fs");
const axios = require("axios");
const baseApiUrl = async () => "https://noobs-api.top/dipto";

module.exports = {
  config: {
    name: "bby",
    version: "2.1",
    author: "Modified by Rahat",
    countDown: 5,
    role: 0,
    category: "fun", // ✅ category ঠিক আছে
    description: "Chat with bot and show owner info"
  },

  // ====== যখন কেউ কমান্ড লিখবে ======
  onStart: async ({ api, event, args }) => {
    const cmd = args[0] ? args[0].toLowerCase() : "";
    if (cmd === "admin" || cmd === "info") {
      const time = new Date().toLocaleString("en-GB", { hour12: false });

      // Local image path ব্যবহার (Facebook URL বাদ)
      const imagePath = __dirname + "/cache/owner.png";

      // Image না থাকলে কোনো default message
      const sendOwnerInfo = () => {
        const msg = {
          body: `┏━━━━━━━━━━━━━━━┓
┃   🌟 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 🌟    
┣━━━━━━━━━━━━━━━┫
┃👤 𝐍𝐚𝐦𝐞      : 🔰𝗥𝗮𝗵𝗮𝘁🔰
┃🚹 𝐆𝐞𝐧𝐝𝐞𝐫    : 𝐌𝐚𝐥e
┃🎂 𝐀𝐠𝐞       : 16
┃🕌 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧  : 𝐈𝐬𝐥𝐚𝐦
┃🏫 𝐄𝐝𝐮𝐜𝐚𝐭𝐢𝐨𝐧 : বয়ড়া ইসরাইল 
┃𝐀𝐝𝐝𝐫𝐞𝐬𝐬: জামালপুর, বাংলাদেশ 
┣━━━━━━━━━━━━━━━┫
┃𝐓𝐢𝐤𝐭𝐨𝐤 : @where.is.she15
┃📢 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 : আছে🥴🤪
┃🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : বায়ো-তে আছে
┣━━━━━━━━━━━━━━━┫
┃ 🕒 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐓𝐢𝐦𝐞:  ${time}
┗━━━━━━━━━━━━━━━┛`
        };

        // যদি ইমেজ আছে তাহলে attach করো
        if (fs.existsSync(imagePath)) msg.attachment = fs.createReadStream(imagePath);

        api.sendMessage(msg, event.threadID);
      };

      sendOwnerInfo();
    }
  },

  // ====== যখন কেউ চ্যাটে baby/bot/janu লিখবে ======
  onChat: async ({ api, event }) => {
    try {
      const body = event.body ? event.body.toLowerCase() : "";
      if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu")) {
        const arr = body.replace(/^\S+\s*/, "");
        const randomReplies = ["হুম?", "বল?", "জানি না!", "আচ্ছা..."];
        const a = arr ?
          (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}`)).data.reply
          : randomReplies[Math.floor(Math.random() * randomReplies.length)];

        await api.sendMessage(a, event.threadID, (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "bby",
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            a
          });
        }, event.messageID);
      }
    } catch (err) {
      return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};
