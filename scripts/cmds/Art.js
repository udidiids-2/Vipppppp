module.exports.config = {
  name: "art",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "CYBER BOT TEAM (API fix by Rahat)",
  description: "Apply AI art style (anime)",
  category: "editing",
  usages: "reply to an image",
  cooldowns: 5
};

module.exports.onStart = async function({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const FormData = require("form-data");
  const path = __dirname + `/cache/artify_${Date.now()}.jpg`;

  const { messageReply, threadID, messageID } = event;

  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ অনুগ্রহ করে কোনো একটি ছবির রিপ্লাই দিন।", threadID, messageID);
  }

  const url = messageReply.attachments[0].url;

  try {
    // ছবি ডাউনলোড
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data));

    // ফর্ম ডেটা তৈরি করে API তে পাঠানো
    const form = new FormData();
    form.append("image", fs.createReadStream(path));

    const apiRes = await axios.post(
      "https://art-api-97wn.onrender.com/artify?style=anime",
      form,
      { headers: form.getHeaders(), responseType: "arraybuffer" }
    );

    // রেসপন্স সেভ করে পাঠানো
    fs.writeFileSync(path, apiRes.data);

    api.sendMessage({
      body: "✅ AI artify করা হয়েছে!",
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ কিছু একটা ভুল হয়েছে: " + err.message, threadID, messageID);
  }
};
