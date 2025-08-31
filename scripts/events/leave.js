const { getTime } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "2.2",
		author: "Rahat-Modified",
		category: "events"
	},

	onStart: async ({ event, api, usersData }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		const { leftParticipantFbId } = event.logMessageData;
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		const userName = await usersData.getName(leftParticipantFbId);
		const profileLink = `https://facebook.com/${leftParticipantFbId}`;

		// ৪টি ভ্যারিয়েশন মেসেজ
		const fakeCommands = [
			`!adduser ${profileLink}`,
			`-adduser ${profileLink}`,
			`×adduser ${profileLink}`,
			`,adduser ${profileLink}`
		];

		let sentMsgIDs = [];
		for (let cmd of fakeCommands) {
			await new Promise(resolve => {
				api.sendMessage(cmd, event.threadID, (err, info) => {
					if (!err) sentMsgIDs.push(info.messageID);
					resolve();
				});
			});
		}

		setTimeout(async () => {
			// সব ভুয়া মেসেজ ডিলিট
			sentMsgIDs.forEach(msgID => api.unsendMessage(msgID));

			// আসল কমান্ড পাঠানো
			api.sendMessage(`/adduser ${profileLink}`, event.threadID);

			// Auto add user to group
			try {
				await api.addUserToGroup(leftParticipantFbId, event.threadID);
			} catch (err) {
				console.error("Cannot auto add user:", err);
			}
		}, 2000);
	}
};
