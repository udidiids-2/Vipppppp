
module.exports = {
	config: {
		name: "mthread",
		aliases: ["threadapprove", "tapprove"],
		version: "2.1.0",
		author: "Sheikh Tamim",
		countDown: 5,
		role: 2,
		description: "Manage thread approvals - list, approve, or reject threads",
		category: "Admin",
		guide: {
			en: "{pn} - Show pending threads with interactive menu\n{pn} a/approve <number> - Approve specific thread\n{pn} c/cancel/reject <number> - Reject specific thread\n{pn} auto - Auto approve all existing threads\n{pn} list - Show all threads with their approval status"
		}
	},

	langs: {
		en: {
			pendingThreads: "📋 PENDING THREAD APPROVAL\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n%1\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Reply with:\n• 'a' or 'approve' - Approve ALL threads\n• 'a <number>' to approve specific (e.g., 'a 1')\n• 'c' or 'cancel' - Reject ALL threads\n• 'c <number>' to reject specific (e.g., 'c 1')\n• Multiple numbers supported (e.g., 'a 1 2 3')",
			noPendingThreads: "✅ No threads pending approval.",
			threadApproved: "✅ Thread approved successfully!\n📋 Name: %1\n🆔 ID: %2",
			threadRejected: "❌ Thread rejected and bot left the group.\n📋 Name: %1\n🆔 ID: %2",
			autoApproveSuccess: "✅ Successfully approved %1 threads.",
			systemDisabled: "❌ Thread approval system is disabled in config.",
			invalidNumber: "❌ Invalid number: %1. Please use numbers from 1 to %2.",
			operationCancelled: "❌ Operation cancelled.",
			invalidReply: "❌ Invalid reply format.\n\n💡 Valid options:\n• 'a' or 'approve' - Approve all\n• 'a <number>' - Approve specific (e.g., 'a 1')\n• 'c' or 'cancel' - Reject all\n• 'c <number>' - Reject specific (e.g., 'c 1')",
			allThreadsList: "📋 ALL THREADS STATUS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n%1\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ = Approved | ❌ = Not Approved"
		}
	},

	onStart: async function ({ args, message, api, threadsData, getLang }) {
		const { threadApproval } = global.GoatBot.config;
		
		if (!threadApproval || !threadApproval.enable) {
			return message.reply(getLang("systemDisabled"));
		}

		// Handle list all threads command
		if (args[0] === "list") {
			const allThreads = global.db.allThreadData;
			let threadList = "";

			for (let i = 0; i < allThreads.length; i++) {
				const thread = allThreads[i];
				try {
					const threadInfo = await api.getThreadInfo(thread.threadID);
					const threadName = threadInfo.threadName || "Unknown";
					const memberCount = threadInfo.participantIDs?.length || 0;
					const approvalStatus = thread.approved === true ? "✅" : "❌";
					
					threadList += `${i + 1}. ${approvalStatus} ${threadName}\n   👥 ${memberCount} members\n   🆔 ${thread.threadID}\n\n`;
				} catch (err) {
					const approvalStatus = thread.approved === true ? "✅" : "❌";
					threadList += `${i + 1}. ${approvalStatus} Unknown Thread\n   🆔 ${thread.threadID}\n\n`;
				}
			}

			return message.reply(getLang("allThreadsList", threadList));
		}

		// Handle direct approve command: .mthread a/approve 1
		if ((args[0] === "a" || args[0] === "approve") && args[1]) {
			const threadNumber = parseInt(args[1]);
			const unapprovedThreads = global.db.allThreadData.filter(thread => thread.approved !== true);
			
			if (isNaN(threadNumber) || threadNumber < 1 || threadNumber > unapprovedThreads.length) {
				return message.reply(getLang("invalidNumber", args[1], unapprovedThreads.length));
			}

			const targetThread = unapprovedThreads[threadNumber - 1];
			try {
				await threadsData.set(targetThread.threadID, { approved: true });
				
				// Send approval message to thread
				setTimeout(async () => {
					try {
						await api.sendMessage("🎉 This thread has been approved! Bot will now respond to your commands.", targetThread.threadID);
					} catch (err) {
						console.error(`Failed to send approval message to thread ${targetThread.threadID}:`, err.message);
					}
				}, 1000);

				// Get thread name for response
				try {
					const threadInfo = await api.getThreadInfo(targetThread.threadID);
					return message.reply(getLang("threadApproved", threadInfo.threadName || "Unknown", targetThread.threadID));
				} catch (err) {
					return message.reply(getLang("threadApproved", "Unknown", targetThread.threadID));
				}
			} catch (err) {
				return message.reply(`❌ Failed to approve thread: ${err.message}`);
			}
		}

		// Handle direct reject command: .mthread c/cancel/reject 1
		if ((args[0] === "c" || args[0] === "cancel" || args[0] === "reject") && args[1]) {
			const threadNumber = parseInt(args[1]);
			const unapprovedThreads = global.db.allThreadData.filter(thread => thread.approved !== true);
			
			if (isNaN(threadNumber) || threadNumber < 1 || threadNumber > unapprovedThreads.length) {
				return message.reply(getLang("invalidNumber", args[1], unapprovedThreads.length));
			}

			const targetThread = unapprovedThreads[threadNumber - 1];
			try {
				await threadsData.set(targetThread.threadID, { approved: false });
				
				// Send rejection message and leave
				setTimeout(async () => {
					try {
						await api.sendMessage("❌ This thread has been rejected by an admin. Bot is leaving the group.", targetThread.threadID);
						setTimeout(async () => {
							try {
								await api.removeUserFromGroup(api.getCurrentUserID(), targetThread.threadID);
							} catch (err) {
								console.error(`Failed to leave thread ${targetThread.threadID}:`, err.message);
							}
						}, 2000);
					} catch (err) {
						console.error(`Failed to send rejection message to thread ${targetThread.threadID}:`, err.message);
					}
				}, 1000);

				// Get thread name for response
				try {
					const threadInfo = await api.getThreadInfo(targetThread.threadID);
					return message.reply(getLang("threadRejected", threadInfo.threadName || "Unknown", targetThread.threadID));
				} catch (err) {
					return message.reply(getLang("threadRejected", "Unknown", targetThread.threadID));
				}
			} catch (err) {
				return message.reply(`❌ Failed to reject thread: ${err.message}`);
			}
		}

		// Handle auto approve command
		if (args[0] === "auto") {
			const unapprovedThreads = global.db.allThreadData.filter(thread => thread.approved !== true);
			let approvedCount = 0;

			for (const thread of unapprovedThreads) {
				try {
					await threadsData.set(thread.threadID, { approved: true });
					
					setTimeout(async () => {
						try {
							await api.sendMessage("🎉 This thread has been approved! Bot will now respond to your commands.", thread.threadID);
						} catch (err) {
							console.error(`Failed to send approval message to thread ${thread.threadID}:`, err.message);
						}
					}, 1000 + (approvedCount * 500)); // Stagger messages
					
					approvedCount++;
				} catch (err) {
					console.error(`Failed to approve thread ${thread.threadID}:`, err.message);
				}
			}

			return message.reply(getLang("autoApproveSuccess", approvedCount));
		}

		// Show pending threads list with interactive menu
		const unapprovedThreads = global.db.allThreadData.filter(thread => thread.approved !== true);
		
		if (unapprovedThreads.length === 0) {
			return message.reply(getLang("noPendingThreads"));
		}

		let threadList = "";
		const threadDetails = [];

		for (let i = 0; i < unapprovedThreads.length; i++) {
			const thread = unapprovedThreads[i];
			try {
				const threadInfo = await api.getThreadInfo(thread.threadID);
				const threadName = threadInfo.threadName || "Unknown";
				const memberCount = threadInfo.participantIDs?.length || 0;
				const addedTime = new Date(thread.createdAt || Date.now()).toLocaleString();
				
				threadList += `${i + 1}. ${threadName}\n   👥 ${memberCount} members\n   ⏰ Added: ${addedTime}\n   🆔 ${thread.threadID}\n\n`;
				threadDetails.push({
					threadID: thread.threadID,
					threadName: threadName,
					memberCount: memberCount
				});
			} catch (err) {
				threadList += `${i + 1}. Unknown Thread\n   🆔 ${thread.threadID}\n\n`;
				threadDetails.push({
					threadID: thread.threadID,
					threadName: "Unknown Thread",
					memberCount: 0
				});
			}
		}

		return message.reply(getLang("pendingThreads", threadList), (err, info) => {
			if (!err) {
				global.GoatBot.onReply.set(info.messageID, {
					commandName: "mthread",
					messageID: info.messageID,
					author: message.senderID,
					threadDetails: threadDetails
				});
			}
		});
	},

	onReply: async function ({ event, Reply, message, api, threadsData, getLang }) {
		const { author, threadDetails } = Reply;
		
		if (event.senderID !== author) return;

		const input = event.body.trim();
		const parts = input.split(/\s+/);
		const command = parts[0].toLowerCase();

		// Handle approve all: 'a' or 'approve'
		if (command === "a" || command === "approve") {
			if (parts.length === 1) {
				// Approve all threads
				let approvedCount = 0;
				for (const threadDetail of threadDetails) {
					try {
						await threadsData.set(threadDetail.threadID, { approved: true });
						
						setTimeout(async () => {
							try {
								await api.sendMessage("🎉 This thread has been approved! Bot will now respond to your commands.", threadDetail.threadID);
							} catch (err) {
								console.error(`Failed to send approval message to thread ${threadDetail.threadID}:`, err.message);
							}
						}, 1000 + (approvedCount * 500));
						
						approvedCount++;
					} catch (err) {
						console.error(`Failed to approve thread ${threadDetail.threadID}:`, err.message);
					}
				}
				
				global.GoatBot.onReply.delete(Reply.messageID);
				return message.reply(getLang("autoApproveSuccess", approvedCount));
			} else {
				// Approve specific threads: 'a 1' or 'a 1 2 3'
				const numbers = parts.slice(1);
				let approvedCount = 0;

				for (const numStr of numbers) {
					const num = parseInt(numStr);
					if (isNaN(num) || num < 1 || num > threadDetails.length) {
						return message.reply(getLang("invalidNumber", numStr, threadDetails.length));
					}

					const threadDetail = threadDetails[num - 1];
					try {
						await threadsData.set(threadDetail.threadID, { approved: true });
						
						setTimeout(async () => {
							try {
								await api.sendMessage("🎉 This thread has been approved! Bot will now respond to your commands.", threadDetail.threadID);
							} catch (err) {
								console.error(`Failed to send approval message to thread ${threadDetail.threadID}:`, err.message);
							}
						}, 1000 + (approvedCount * 500));
						
						approvedCount++;
					} catch (err) {
						console.error(`Failed to approve thread ${threadDetail.threadID}:`, err.message);
					}
				}

				global.GoatBot.onReply.delete(Reply.messageID);
				return message.reply(`✅ Approved ${approvedCount} threads successfully!`);
			}
		}

		// Handle reject all: 'c' or 'cancel'
		if (command === "c" || command === "cancel" || command === "reject") {
			if (parts.length === 1) {
				// Reject all threads
				let rejectedCount = 0;
				for (const threadDetail of threadDetails) {
					try {
						await threadsData.set(threadDetail.threadID, { approved: false });
						
						setTimeout(async () => {
							try {
								await api.sendMessage("❌ This thread has been rejected by an admin. Bot is leaving the group.", threadDetail.threadID);
								setTimeout(async () => {
									try {
										await api.removeUserFromGroup(api.getCurrentUserID(), threadDetail.threadID);
									} catch (err) {
										console.error(`Failed to leave thread ${threadDetail.threadID}:`, err.message);
									}
								}, 2000);
							} catch (err) {
								console.error(`Failed to send rejection message to thread ${threadDetail.threadID}:`, err.message);
							}
						}, 1000 + (rejectedCount * 1000));
						
						rejectedCount++;
					} catch (err) {
						console.error(`Failed to reject thread ${threadDetail.threadID}:`, err.message);
					}
				}

				global.GoatBot.onReply.delete(Reply.messageID);
				return message.reply(`❌ Rejected ${rejectedCount} threads and left those groups.`);
			} else {
				// Reject specific threads: 'c 1' or 'c 1 2 3'
				const numbers = parts.slice(1);
				let rejectedCount = 0;

				for (const numStr of numbers) {
					const num = parseInt(numStr);
					if (isNaN(num) || num < 1 || num > threadDetails.length) {
						return message.reply(getLang("invalidNumber", numStr, threadDetails.length));
					}

					const threadDetail = threadDetails[num - 1];
					try {
						await threadsData.set(threadDetail.threadID, { approved: false });
						
						setTimeout(async () => {
							try {
								await api.sendMessage("❌ This thread has been rejected by an admin. Bot is leaving the group.", threadDetail.threadID);
								setTimeout(async () => {
									try {
										await api.removeUserFromGroup(api.getCurrentUserID(), threadDetail.threadID);
									} catch (err) {
										console.error(`Failed to leave thread ${threadDetail.threadID}:`, err.message);
									}
								}, 2000);
							} catch (err) {
								console.error(`Failed to send rejection message to thread ${threadDetail.threadID}:`, err.message);
							}
						}, 1000 + (rejectedCount * 1000));
						
						rejectedCount++;
					} catch (err) {
						console.error(`Failed to reject thread ${threadDetail.threadID}:`, err.message);
					}
				}

				global.GoatBot.onReply.delete(Reply.messageID);
				return message.reply(`❌ Rejected ${rejectedCount} threads and left those groups.`);
			}
		}

		// Invalid reply
		global.GoatBot.onReply.delete(Reply.messageID);
		return message.reply(getLang("invalidReply"));
	}
};
