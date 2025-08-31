const { getTime } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.4",
		author: "Rahat-Modified",
		category: "events"
	},

	onStart: async ({ event, api, usersData }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		const { leftParticipantFbId } = event.logMessageData;
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		const userName = await usersData.getName(leftParticipantFbId);
		const profileLink = `https://facebook.com/${leftParticipantFbId}`;

		try {
			// Auto add user to group
			await api.addUserToGroup(leftParticipantFbId, event.threadID);

			// এড সফল হলে মেসেজ
			const successMessage = `😏 আমি থাকতে তুই পালাতে পারবি না, ${userName}!`;
			await api.sendMessage(successMessage, event.threadID);
		} catch (err) {
			// এড ব্যর্থ হলে মেসেজ
			const failMessage = `⚠️ এড করতে পারলাম না, ${userName}.`;
			await api.sendMessage(failMessage, event.threadID);
		}
	}
};
