module.exports = {
  config: {
    name: "antiout",
    version: "1.0",
    author: "Chitron Bhattacharjee",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "Prevent members from leaving the group"
    },
    longDescription: {
      en: "Always active anti-out feature that automatically adds back members who leave the group"
    },
    category: "admin",
    guide: {
      en: "{pn} - Anti-out is always enabled"
    }
  },

  langs: {
    en: {
      missingPermission: "❌ Sorry boss! I couldn't add the user back.\nUser %1 might have blocked me or doesn't have messenger option enabled.",
      addedBack: "⚠️ Attention %1!\nThis group belongs to my boss!\nYou need admin clearance to leave this group!"
    }
  },

  // কমান্ড দিলে শুধু জানাবে যে সবসময় অন আছে
  onStart: async function ({ message }) {
    message.reply("🛡️ Anti-out feature is always ON for this group.");
  },

  // যখন কেউ লিভ দেবে তখনই আবার এড হবে
  onEvent: async function ({ event, api, usersData, getLang }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    // বট নিজে লিভ দিলে এড করবে না
    if (event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) return;

    const uid = event.logMessageData.leftParticipantFbId;
    const name = await usersData.getName(uid);

    try {
      await api.addUserToGroup(uid, event.threadID);
      api.sendMessage(getLang("addedBack", name), event.threadID);
    } catch (e) {
      api.sendMessage(getLang("missingPermission", name), event.threadID);
    }
  }
};
