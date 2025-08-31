module.exports = {
  config: {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "2.1",
    credits: "Chitron Bhattacharjee",
    description: "Always active Anti-out system",
    category: "system" // <-- এটা না থাকলে তোর দেখানো error আসবে
  },

  run: async ({ event, api, Threads, Users }) => {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID) return;
      if (leftID == api.getCurrentUserID()) return; // বট নিজে লিভ করলে কিছু না করবে

      const name =
        (global.data && global.data.userName && global.data.userName.get(leftID)) ||
        (await Users.getNameUser(leftID)).name || "Unknown";

      const type = event.author == leftID ? "self-separation" : "kicked";

      console.log(`[antiout] ${name} (${leftID}) left (${type}) in thread ${event.threadID}`);

      if (type === "self-separation") {
        api.addUserToGroup(leftID, event.threadID, (err) => {
          if (err) {
            console.error(`[antiout] failed to add ${leftID}:`, err);
            api.sendMessage(
              `❌ Couldn't re-add ${name}.\nReason: ${err?.error || err?.message || "unknown"}`,
              event.threadID
            );
          } else {
            api.sendMessage(`⚠️ ${name}, you can't escape from this group 😏`, event.threadID);
          }
        });
      }
    } catch (e) {
      console.error("[antiout] unexpected error:", e);
    }
  }
};
