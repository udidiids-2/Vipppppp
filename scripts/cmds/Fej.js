module.exports = {
  config: {
    name: "sexx",
    aliases: ["sex"],
    version: "1.0",
    author: "Akash × ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Watch funny video",
    longDescription: "Watch funny video (costs 145 coins from your balance)",
    category: "entertainment",
    guide: "{p}funnyvideo"
  },

  onStart: async function ({ api, event, usersData }) {
    const { senderID, threadID, messageID } = event;
    const userData = await usersData.get(senderID);

    if (userData.money < 145) {
      return api.sendMessage("📛 পর্যাপ্ত কয়েন নেই (কমপক্ষে 145 কয়েন দরকার)", threadID, messageID);
    }

    // প্রথমে "please wait" মেসেজ দেখানো
    const waitMessage = await api.sendMessage("⏳ Please wait...", threadID);

    // কয়েন কেটে নেওয়া
    await usersData.set(senderID, { 
      money: userData.money - 145, 
      exp: userData.exp, 
      data: userData.data 
    });

    const videos = [
      "https://drive.google.com/uc?export=download&id=1SAALOmQPtcdInvK1FghkzHfn2Yig2CsK",
      "https://drive.google.com/uc?export=download&id=1serqpRO5mVHYpLtoBEOHM7elZrUWggU5",
      "https://drive.google.com/uc?export=download&id=15JqeLaMNh81KstjbJVFs7hVi6Ni1Y39r"
    ];
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    // ভিডিও পাঠানো
    await api.sendMessage({
      body: `🔰𝗥𝗮𝗵𝗮𝘁_𝗕𝗼𝘁🔰\n🔞VIP Vedio🔞\n💸 145 কয়েন কেটে নেওয়া হয়েছে\n📌 নতুন Balance: ${userData.money - 145}`,
      attachment: await global.utils.getStreamFromURL(randomVideo)
    }, threadID);

    // "please wait" মেসেজ ডিলিট করা
    return api.unsendMessage(waitMessage.messageID);
  }
};
