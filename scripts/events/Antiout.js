module.exports = {
  config: {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "2.1",
    credits: "Chitron Bhattacharjee",
    description: "Always active Anti-out system",
    category: "system"
  },

  // ⬇️ এই onStart না থাকায় error আসছিল
  onStart: async function () {
    // ইচ্ছা করলে এখানে কিছু লিখতে পারো, নাহলে ফাঁকা রাখো
  },

  run: async ({ event, api, Users }) => {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const leftID = event.logMessageData?.leftParticipantFbId;
      if (!leftID) return;
      if (leftID == api.getCurrentUserID()) return; // বট নিজে লিভ করলে কিছু না করবে

      const name =
        (global.data?.userName?.get(leftID)) ||
        (await Users.getNameUser(leftID)) ||
        "Unknown";

      const type = event.author == leftID ? "self-separation" : "kicked";

      if (type === "self-separation") {
        api.addUserToGroup(leftID, event.threadID, (err) => {
          if (err) {
            api.sendMessage(
              `❌ Couldn't re-add ${name}. Reason: ${err?.error || err?.message || "unknown"}`,
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
