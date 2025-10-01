const axios = require("axios");

module.exports = {
  config: {
    name: "quiz",
    version: "2.0",
    author: "Akash × ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Play quiz and earn coins",
    longDescription: "Bangla quiz system. Correct = earn coins, Wrong = lose coins.",
    category: "game",
    guide: "{p}quiz"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, senderID, messageID } = event;

    const userData = await usersData.get(senderID);
    if (userData.money < 30) {
      return api.sendMessage("❌ আপনার কাছে পর্যাপ্ত কয়েন নেই (কমপক্ষে 30 কয়েন লাগবে)।", threadID, messageID);
    }

    if (args[0]?.toLowerCase() === "h") {
      return api.sendMessage(
        `🧠 Quiz Guide:\n\n` +
        `➤ খেলতে খরচ হবে: -30 কয়েন\n` +
        `➤ সঠিক উত্তর: +1000 কয়েন\n` +
        `➤ ভুল উত্তর: -50 কয়েন\n` +
        `➤ সময়: 20 সেকেন্ড`,
        threadID, messageID
      );
    }

    try {
      const res = await axios.get(`https://rubish-apihub.onrender.com/rubish/quiz-api?category=Bangla&apikey=rubish69`);
      const data = res.data;
      if (!data.question || !data.answer) throw new Error("Invalid quiz data");

      // -30 কয়েন কেটে নেওয়া
      await usersData.set(senderID, {
        money: userData.money - 30,
        exp: userData.exp,
        data: userData.data
      });

      const formatted = 
`╭──✦ ${data.question}
├‣ 𝗔) ${data.A}
├‣ 𝗕) ${data.B}
├‣ 𝗖) ${data.C}
├‣ 𝗗) ${data.D}
╰──────────────────‣ Reply with A/B/C/D (⏰ 20s)`;

      return api.sendMessage(formatted, threadID, async (err, info) => {
        if (err) return;

        // messageID কে string এ convert করা
        const msgID = String(info.messageID);

        const timeout = setTimeout(async () => {
          const index = global.GoatBot.onReply.findIndex(e => e.messageID === msgID);
          if (index !== -1) {
            api.sendMessage(`⏰ সময় শেষ!\n✅ সঠিক উত্তর ছিল: ${data.answer}`, threadID);
            global.GoatBot.onReply.splice(index, 1);
          }
        }, 20000);

        if (!global.GoatBot.onReply) global.GoatBot.onReply = [];

        global.GoatBot.onReply.push({
          commandName: this.config.name,
          messageID: msgID,
          author: senderID,
          correct: data.answer.toUpperCase(), // ensure uppercase
          timeout
        });
      });

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ কুইজ লোড করতে ব্যর্থ!", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, messageID, threadID, body } = event;

    // শুধুমাত্র মূল author কে allow করা
    if (!Reply || senderID != Reply.author) return;

    const answer = body.trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) {
      return api.sendMessage("⚠️ শুধু A/B/C/D লিখো", threadID, messageID);
    }

    clearTimeout(Reply.timeout);

    const userData = await usersData.get(senderID);

    // সঠিক উত্তর
    if (answer === Reply.correct) {
      const newMoney = userData.money + 1000;
      await usersData.set(senderID, { 
        money: newMoney, 
        exp: userData.exp, 
        data: userData.data 
      });
      api.sendMessage(`✅ সঠিক উত্তর!\n💰 +1000 কয়েন\n📌 নতুন Balance: ${newMoney}`, threadID, messageID);
    } else {
      // ভুল উত্তর
      const newMoney = Math.max(userData.money - 50, 0);
      await usersData.set(senderID, { 
        money: newMoney, 
        exp: userData.exp, 
        data: userData.data 
      });
      api.sendMessage(`❌ ভুল উত্তর!\n✅ সঠিক: ${Reply.correct}\n💸 -50 কয়েন\n📌 নতুন Balance: ${newMoney}`, threadID, messageID);
    }

    // onReply থেকে remove করা
    const index = global.GoatBot.onReply.findIndex(e => e.messageID === Reply.messageID);
    if (index !== -1) global.GoatBot.onReply.splice(index, 1);
  }
};
