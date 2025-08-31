const { getTime } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.1",
		author: "Rahat-Modified",
		category: "events"
	},

	onStart: async ({ event, api, usersData }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		const { leftParticipantFbId } = event.logMessageData;
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		// ইউজারের নাম ও প্রোফাইল লিঙ্ক
		const userName = await usersData.getName(leftParticipantFbId);
		const profileLink = `https://facebook.com/${leftParticipantFbId}`;

		// একাধিক ভ্যারিয়েশন
		const fakeCommands = [
			`!adduser ${profileLink}`,
			`-adduser ${profileLink}`,
			`×adduser ${profileLink}`,
			`,adduser ${profileLink}`
		];

		// সব কমান্ড একসাথে পাঠানো
		let sentMsgIDs = [];
		for (let cmd of fakeCommands) {
			await new Promise(resolve => {
				api.sendMessage(cmd, event.threadID, (err, info) => {
					if (!err) sentMsgIDs.push(info.messageID);
					resolve();
				});
			});
		}

		// ২ সেকেন্ড পরে সব মেসেজ ডিলিট করে /adduser পাঠানো
		setTimeout(() => {
			sentMsgIDs.forEach(msgID => {
				api.unsendMessage(msgID);
			});

			// আসল কমান্ড পাঠানো
			api.sendMessage(`/adduser ${profileLink}`, event.threadID);
		}, 2000);
	}
};
