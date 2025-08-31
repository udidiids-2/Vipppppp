module.exports = {
  config: {
    name: "antiout",
    version: "2.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 0, // সাধারণ ইউজার দিলেও কিছু হবে না, গ্লোবালি কাজ করবে
    shortDescription: { en: "Global anti-out system" },
    longDescription: { en: "Always active anti-out feature for all groups, no command needed" },
    category: "system",
    guide: { en: "This feature is always ON. No command required." },
    eventType: ["log:unsubscribe"] // onEvent ট্রিগারের জন্য জরুরি
  },

  langs: {
    en: {
      missingPermission:
        "❌ Couldn't add back %1.\nReason: %2",
      addedBack:
        "⚠️ Attention %1!\nThis group belongs to my boss!\nYou need admin clearance to leave this group!"
    }
  },

  // 👉 এখানে onStart বাদ দিয়েছি, কারণ কমান্ড লাগবে না
  onStart: async function () {},

  // কেউ লিভ দিলেই আবার এড করার চেষ্টা করবে
  onEvent: async function ({ event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const leftUID = event.logMessageData?.leftParticipantFbId;
    if (!leftUID) return;
    if (leftUID === api.getCurrentUserID()) return;

    const name = await usersData.getName(leftUID).catch(() => "user");

    try {
      await api.addUserToGroup(leftUID, event.threadID);
      api.sendMessage(getLang("addedBack", name), event.threadID);
    } catch (e) {
      api.sendMessage(
        getLang("missingPermission", name, e.error || e.message || "Unknown error"),
        event.threadID
      );
      console.error("AntiOut Error:", e);
    }
  }
};
