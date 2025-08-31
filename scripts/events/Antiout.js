module.exports = {
  config: {
    name: "antiout",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 1, // Only admin can use this command (কমান্ড দিলে শুধু স্ট্যাটাস জানাবে)
    shortDescription: { en: "Prevent members from leaving the group" },
    longDescription: { en: "Always active anti-out feature that automatically adds back members who leave the group" },
    category: "admin",
    guide: { en: "{pn} - Anti-out is always enabled" },

    // 👉 এটাকেই মিস করছিলে: এইটা ছাড়া onEvent ফায়ার হবে না
    eventType: ["log:unsubscribe"]
  },

  langs: {
    en: {
      missingPermission:
        "❌ Sorry boss! I couldn't add the user back.\nUser %1 might have blocked me or doesn't have messenger option enabled.",
      addedBack:
        "⚠️ Attention %1!\nThis group belongs to my boss!\nYou need admin clearance to leave this group!"
    }
  },

  // কমান্ড দিলে শুধু জানাবে যে সবসময় অন আছে
  onStart: async function ({ message }) {
    message.reply("🛡️ Anti-out feature is always ON for this group.");
  },

  // কেউ লিভ দিলেই আবার এড করবে
  onEvent: async function ({ event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const leftUID = event.logMessageData?.leftParticipantFbId;
    if (!leftUID) return;

    // বট নিজে লিভ দিলে কিছু করবে না
    if (leftUID === api.getCurrentUserID()) return;

    const name = await usersData.getName(leftUID).catch(() => "user");

    // কিছু গ্রুপে ইনস্ট্যান্ট রি-অ্যাড ব্লক হয়—হালকা ডিলে রাখলাম
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await sleep(1500);

    try {
      await api.addUserToGroup(leftUID, event.threadID);
      api.sendMessage(getLang("addedBack", name), event.threadID);
    } catch (e) {
      api.sendMessage(getLang("missingPermission", name), event.threadID);
    }
  }
};
