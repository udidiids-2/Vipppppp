const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.0",
		author: "Rahat-Modified",
		category: "events"
	},

	onStart: async ({ event, api, usersData }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		const { leftParticipantFbId } = event.logMessageData;
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		// ইউজারের নাম ও প্রোফাইল লিঙ্ক বের করা
		const userName = await usersData.getName(leftParticipantFbId);
		const profileLink = `https://facebook.com/${leftParticipantFbId}`;

		// প্রথম মেসেজ পাঠানো (!adduser)
		api.sendMessage(`!adduser ${profileLink}`, event.threadID, (err, info) => {
			if (err) return;

			// ২ সেকেন্ড পরে মেসেজ ডিলিট করা
			setTimeout(() => {
				api.unsendMessage(info.messageID, () => {
					// ডিলিট হওয়ার পরে দ্বিতীয় মেসেজ পাঠানো (/adduser)
					api.sendMessage(`/adduser ${profileLink}`, event.threadID);
				});
			}, 2000);
		});
	}
};
