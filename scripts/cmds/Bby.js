const fs = require("fs");
const axios = require("axios");
const baseApiUrl = async () => "https://noobs-api.top/dipto";

module.exports = {
  config: {
    name: "bby",
    version: "2.0",
    author: "Modified by Rahat",
    countDown: 5,
    role: 0,
    description: "Chat with bot and show owner info"
  },

  // ====== যখন কেউ কমান্ড লিখবে ======
  onStart: async ({ api, event, args }) => {
    const cmd = args[0] ? args[0].toLowerCase() : "";
    if (cmd === "admin" || cmd === "info") {
      const time = new Date().toLocaleString("en-GB", { hour12: false });

      const callback = () => {
        api.sendMessage({
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
┗━━━━━━━━━━━━━━━┛`,
          attachment: fs.createReadStream(__dirname + "/cache/1.png")
        }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"));
      };

      // Profile picture download
      axios({
        method: "get",
        url: "https://graph.facebook.com/61561511477968/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662",
        responseType: "stream"
      }).then(response => {
        response.data.pipe(fs.createWriteStream(__dirname + '/cache/1.png')).on('close', callback);
      });
    }
  },

  // ====== যখন কেউ চ্যাটে baby/bot/janu লিখবে ======
  onChat: async ({ api, event }) => {
    try {
      const body = event.body ? event.body.toLowerCase() : "";
      if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu")) {
        const arr = body.replace(/^\S+\s*/, "");
        const randomReplies = ["হুম?", "বল?", "জানি না!", "আচ্ছা..."]; // চাইলে লিস্ট বড় করো
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
