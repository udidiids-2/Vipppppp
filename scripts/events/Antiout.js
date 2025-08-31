module.exports = {
  config: {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "2.0",
    credits: "Chitron Bhattacharjee",
    description: "Always active Anti-out system"
  },

  run: async ({ event, api, Users }) => {
    // বট নিজে লিভ দিলে কিছু করবে না
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    const uid = event.logMessageData.leftParticipantFbId;
    const name =
      global.data.userName.get(uid) || (await Users.getNameUser(uid));
    const type =
      event.author == uid
        ? "self-separation"
        : "being kicked by an admin";

    // যদি ইউজার নিজে লিভ দেয়
    if (type == "self-separation") {
      api.addUserToGroup(uid, event.threadID, (error) => {
        if (error) {
          api.sendMessage(
            `❌ Unable to re-add member ${name}\n\n👉 Reason: blocked me or no Messenger option enabled.`,
            event.threadID
          );
        } else {
          api.sendMessage(
            `⚠️ ${name}, you can't escape from this group 😏`,
            event.threadID
          );
        }
      });
    }
  }
};
