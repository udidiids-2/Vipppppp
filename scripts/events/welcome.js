const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "NTKhang",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
			multiple1: "you",
			multiple2: "you guys",
			defaultWelcomeMessage: `Hello {userName}.\nWelcome {multiple} to the chat group: {boxName}\nHave a nice {session} 😊`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;
				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					
					// Check if thread approval system is enabled
					const { threadApproval } = global.GoatBot.config;
					if (threadApproval && threadApproval.enable) {
						try {
							let threadData = await threadsData.get(threadID);
							
							// Always set new threads as unapproved
							await threadsData.set(threadID, { approved: false });
							
							// Send notification to admin notification threads only (not to admin IDs)
							if (threadApproval.adminNotificationThreads && threadApproval.adminNotificationThreads.length > 0 && threadApproval.sendNotifications !== false) {
								// Use setTimeout to avoid immediate API conflicts
								setTimeout(async () => {
									try {
										// Get thread info safely with retries
										let threadInfo;
										let addedByUser;
										
										try {
											threadInfo = await api.getThreadInfo(threadID);
										} catch (err) {
											console.error(`Failed to get thread info for ${threadID}:`, err.message);
											threadInfo = { threadName: "Unknown", participantIDs: [] };
										}
										
										try {
											addedByUser = await api.getUserInfo(event.author);
										} catch (err) {
											console.error(`Failed to get user info for ${event.author}:`, err.message);
											addedByUser = { [event.author]: { name: "Unknown" } };
										}
										
										const notificationMessage = `🔔 BOT ADDED TO NEW THREAD 🔔\n\n` +
											`📋 Thread Name: ${threadInfo.threadName || "Unknown"}\n` +
											`🆔 Thread ID: ${threadID}\n` +
											`👤 Added by: ${addedByUser[event.author]?.name || "Unknown"}\n` +
											`👥 Members: ${threadInfo.participantIDs?.length || 0}\n` +
											`⏰ Time: ${new Date().toLocaleString()}\n\n` +
											`⚠️ This thread is NOT APPROVED. Bot will not respond to any commands.\n` +
											`Use "${prefix}mthread" to manage thread approvals.`;
										
										// Send notifications with proper error handling
										for (const notifyThreadID of threadApproval.adminNotificationThreads) {
											try {
												await message.send(notificationMessage, notifyThreadID);
											} catch (err) {
												console.error(`Failed to send notification to thread ${notifyThreadID}:`, err.message);
											}
										}
									} catch (err) {
										console.error(`Failed to send notifications:`, err.message);
									}
								}, 3000); // 3 second delay to avoid API conflicts
							}
							
							// Send warning message to the new thread if enabled
							if (threadApproval.sendThreadMessage !== false) {
								// Use setTimeout to avoid immediate API conflicts after bot addition
								setTimeout(async () => {
									try {
										const warningMessage = `⚠️ This thread is not approved yet. Bot will not respond to any commands until approved by an admin.\n\nUse "${prefix}help" after approval to see available commands.`;
										await message.send(warningMessage);
									} catch (err) {
										console.error(`Failed to send approval message to thread ${threadID}:`, err.message);
									}
								}, 5000); // 5 second delay for thread message
							}
							
							return null; // Don't send welcome message for unapproved threads
						} catch (err) {
							console.error(`Thread approval system error:`, err.message);
							// Continue with normal welcome if approval system fails
						}
					}
					
					// Use setTimeout to avoid immediate API conflicts
					setTimeout(async () => {
						try {
							await message.send(getLang("welcomeMessage", prefix));
						} catch (err) {
							console.error(`Failed to send welcome message to thread ${threadID}:`, err.message);
						}
					}, 2000);
					return null;
				}
				// if new member:
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// push new member to array
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				// if timeout is set, clear it
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				// set new timeout
				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;
					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}
					// {userName}:   name of new member
					// {multiple}:
					// {boxName}:    name of group
					// {threadName}: name of group
					// {session}:    session of day
					if (userName.length == 0) return;
					let { welcomeMessage = getLang("defaultWelcomeMessage") } =
						threadData.data;
					const form = {
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};
					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(
							/\{multiple\}/g,
							multiple ? getLang("multiple2") : getLang("multiple1")
						)
						.replace(
							/\{session\}/g,
							hours <= 10
								? getLang("session1")
								: hours <= 12
									? getLang("session2")
									: hours <= 18
										? getLang("session3")
										: getLang("session4")
						);

					form.body = welcomeMessage;

					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.reduce((acc, file) => {
							acc.push(drive.getFile(file, "stream"));
							return acc;
						}, []);
						form.attachment = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
					}
					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
