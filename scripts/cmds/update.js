const axios = require("axios");
const fs = require("fs-extra");
const execSync = require("child_process").execSync;
const dirBootLogTemp = `${__dirname}/tmp/rebootUpdated.txt`;

module.exports = {
	config: {
		name: "update",
		version: "1.5",
		author: "Chat GPT, NTKhang",
		role: 2,
		description: {
			en: "Check for and install updates for the chatbot.",
			vi: "Kiểm tra và cài đặt phiên bản mới nhất của chatbot trên GitHub."
		},
		category: "owner",
		guide: {
			en: "   {pn}",
			vi: "   {pn}"
		}
	},

	langs: {
		vi: {
			noUpdates: "✅ | Bạn đang sử dụng phiên bản mới nhất của GoatBot V2 (v%1).",
			updatePrompt: "💫 | Bạn đang sử dụng phiên bản %1. Hiện tại đã có phiên bản %2. Bạn có muốn cập nhật chatbot lên phiên bản mới nhất không?"
				+ "\n\n⬆️ | Các tệp sau sẽ được cập nhật:"
				+ "\n%3%4"
				+ "\n\nℹ️ | Xem chi tiết tại https://github.com/sheikhtamimlover/ST-BOT/commits/main"
				+ "\n💡 | Thả cảm xúc bất kỳ vào tin nhắn này để xác nhận",
			fileWillDelete: "\n🗑️ | Các tệp/thư mục sau sẽ bị xóa:\n%1",
			andMore: " ...và %1 tệp khác",
			updateConfirmed: "🚀 | Đã xác nhận, đang cập nhật...",
			updateComplete: "✅ | Cập nhật thành công, bạn có muốn khởi động lại chatbot ngay bây giờ không (phản hồi tin nhắn với nội dung \"yes\" hoặc \"y\" để xác nhận).",
			updateTooFast: "⭕ Vì bản cập nhật gần nhất được thực phát hành cách đây %1 phút %2 giây nên không thể cập nhật. Vui lòng thử lại sau %3 phút %4 giây nữa để cập nhật không bị lỗi.",
			botWillRestart: "🔄 | Bot sẽ khởi động lại ngay!"
		},
		en: {
			noUpdates: "✅ | You are using the latest version of GoatBot V2 (v%1).",
			updatePrompt: "💫 | You are using version %1. There is a new version %2. Do you want to update the chatbot to the latest version?"
				+ "\n\n⬆️ | The following files will be updated:"
				+ "\n%3%4"
				+ "\n\nℹ️ | See details at https://github.com/sheikhtamimlover/ST-BOT/commits/main"
				+ "\n💡 | React to this message to confirm.",
			fileWillDelete: "\n🗑️ | The following files/folders will be deleted:\n%1",
			andMore: " ...and %1 more files",
			updateConfirmed: "🚀 | Confirmed, updating...",
			updateComplete: "✅ | Update complete, do you want to restart the chatbot now (reply with \"yes\" or \"y\" to confirm)?",
			updateTooFast: "⭕ Because the latest update was released %1 minutes %2 seconds ago, you can't update now. Please try again after %3 minutes %4 seconds to avoid errors.",
			botWillRestart: "🔄 | The bot will restart now!"
		}
	},

	onLoad: async function ({ api }) {
		if (fs.existsSync(dirBootLogTemp)) {
			const threadID = fs.readFileSync(dirBootLogTemp, "utf-8");
			fs.removeSync(dirBootLogTemp);
			api.sendMessage("The chatbot has been restarted.", threadID);
		}
	},

	onStart: async function ({ message, getLang, commandName, event }) {
		try {
			// Check if git is initialized
			let currentCommit;
			try {
				currentCommit = require('child_process').execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
			} catch (gitError) {
				return message.reply("❌ | Git repository not properly initialized. Please ensure this is a valid Git repository.");
			}
			
			// Get latest commit from GitHub
			const { data: latestCommit } = await axios.get('https://api.github.com/repos/sheikhtamimlover/ST-BOT/commits/main');
			const latestCommitHash = latestCommit.sha;
			
			// Check if already up to date
			if (currentCommit === latestCommitHash) {
				return message.reply("✅ | You are using the latest version of the project.");
			}
			
			// Try to get commits between current and latest
			let commits;
			try {
				const { data: commitsData } = await axios.get(`https://api.github.com/repos/sheikhtamimlover/ST-BOT/compare/${currentCommit}...${latestCommitHash}`);
				commits = commitsData;
			} catch (compareError) {
				// If compare fails, try to get recent commits instead
				try {
					const { data: recentCommits } = await axios.get('https://api.github.com/repos/sheikhtamimlover/ST-BOT/commits?per_page=10');
					
					// Ensure recentCommits is an array
					if (!Array.isArray(recentCommits)) {
						throw new Error('Invalid response format from GitHub API');
					}
					
					// Find the index of current commit
					const currentIndex = recentCommits.findIndex(commit => commit.sha === currentCommit);
					
					if (currentIndex === -1) {
						// Current commit not found in recent commits, get commit messages for display
						const updateMessages = [];
						for (let i = 0; i < Math.min(5, recentCommits.length); i++) {
							const commit = recentCommits[i];
							updateMessages.push(`• ${commit.commit.message.split('\n')[0]}`);
						}
						
						const updateInfo = `💫 | Your local repository appears to be outdated or diverged from the main branch.\n\n⚠️ | Current commit: ${currentCommit.substring(0, 7)}\n⚠️ | Latest commit: ${latestCommitHash.substring(0, 7)}\n\n📝 | Recent updates:\n${updateMessages.join('\n')}\n\nℹ️ | See latest changes at https://github.com/sheikhtamimlover/ST-BOT/commits/main\n💡 | React to this message to force update (this will reset to latest version)`;
						
						return message.reply(updateInfo, (err, info) => {
							if (err) return console.error(err);
							global.GoatBot.onReaction.set(info.messageID, {
								messageID: info.messageID,
								threadID: info.threadID,
								authorID: event.senderID,
								commandName,
								latestCommitHash,
								commits: recentCommits.slice(0, 5)
							});
						});
					}
					
					// Create fake commits data structure
					commits = {
						commits: recentCommits.slice(0, currentIndex)
					};
				} catch (fallbackError) {
					console.error('Update check fallback error:', fallbackError);
					return message.reply("❌ | Failed to check for updates. Please check your internet connection and try again later.");
				}
			}
			
			if (!commits.commits || commits.commits.length === 0) {
				return message.reply("✅ | You are using the latest version of the project.");
			}
			
			// Get file changes from commits
			const fileChanges = new Set();
			const updateMessages = [];
			const addedFiles = new Set();
			const modifiedFiles = new Set();
			const deletedFiles = new Set();
			
			for (const commit of commits.commits) {
				try {
					const { data: commitDetails } = await axios.get(commit.url);
					updateMessages.push(`• ${commit.commit.message.split('\n')[0]}`);
					
					if (commitDetails.files) {
						commitDetails.files.forEach(file => {
							fileChanges.add(file.filename);
							if (file.status === 'added') {
								addedFiles.add(file.filename);
							} else if (file.status === 'modified') {
								modifiedFiles.add(file.filename);
							} else if (file.status === 'removed') {
								deletedFiles.add(file.filename);
							}
						});
					}
				} catch (commitError) {
					// If we can't get commit details, just use the commit message
					updateMessages.push(`• ${commit.commit.message.split('\n')[0]}`);
					console.warn(`Could not fetch details for commit ${commit.sha}:`, commitError.message);
				}
			}
			
			let fileUpdateInfo = "";
			if (addedFiles.size > 0) {
				fileUpdateInfo += `\n➕ New files (${addedFiles.size}):\n${Array.from(addedFiles).slice(0, 5).map(f => ` - ${f}`).join('\n')}${addedFiles.size > 5 ? `\n...and ${addedFiles.size - 5} more` : ""}`;
			}
			if (modifiedFiles.size > 0) {
				fileUpdateInfo += `\n📝 Modified files (${modifiedFiles.size}):\n${Array.from(modifiedFiles).slice(0, 5).map(f => ` - ${f}`).join('\n')}${modifiedFiles.size > 5 ? `\n...and ${modifiedFiles.size - 5} more` : ""}`;
			}
			if (deletedFiles.size > 0) {
				fileUpdateInfo += `\n🗑️ Deleted files (${deletedFiles.size}):\n${Array.from(deletedFiles).slice(0, 5).map(f => ` - ${f}`).join('\n')}${deletedFiles.size > 5 ? `\n...and ${deletedFiles.size - 5} more` : ""}`;
			}
			
			if (fileUpdateInfo === "") {
				fileUpdateInfo = "\n📄 File changes will be determined during update";
			}
			
			// Show update info
			const updateInfo = `💫 | New updates available! (${commits.commits.length} commits ahead)\n${fileUpdateInfo}\n\n📝 | Recent changes:\n${updateMessages.slice(0, 5).join('\n')}${updateMessages.length > 5 ? `\n...and ${updateMessages.length - 5} more commits` : ""}\n\nℹ️ | See full details at https://github.com/sheikhtamimlover/ST-BOT/commits/main\n💡 | React to this message to confirm update`;
			
			message.reply(updateInfo, (err, info) => {
				if (err)
					return console.error(err);

				global.GoatBot.onReaction.set(info.messageID, {
					messageID: info.messageID,
					threadID: info.threadID,
					authorID: event.senderID,
					commandName,
					latestCommitHash,
					commits: commits.commits
				});
			});
			
		} catch (error) {
			console.error('Update check error:', error);
			
			if (error.response && error.response.status === 404) {
				message.reply("❌ | Repository not found or access denied. Please check the repository URL and permissions.");
			} else if (error.code === 'ENOTFOUND') {
				message.reply("❌ | Network error. Please check your internet connection and try again.");
			} else {
				message.reply("❌ | Failed to check for updates. Please try again later.\n\n" + 
					"If this persists, you can manually check for updates at:\n" +
					"https://github.com/sheikhtamimlover/ST-BOT/commits/main");
			}
		}
	},

	onReaction: async function ({ message, getLang, Reaction, event, commandName }) {
		const { userID } = event;
		if (userID != Reaction.authorID)
			return;

		try {
			// Check if update is too recent (< 5 minutes)
			const { data: lastCommit } = await axios.get('https://api.github.com/repos/sheikhtamimlover/ST-BOT/commits/main');
			const lastCommitDate = new Date(lastCommit.commit.committer.date);
			
			if (new Date().getTime() - lastCommitDate.getTime() < 5 * 60 * 1000) {
				const minutes = Math.floor((new Date().getTime() - lastCommitDate.getTime()) / 1000 / 60);
				const seconds = Math.floor((new Date().getTime() - lastCommitDate.getTime()) / 1000 % 60);
				const minutesCooldown = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 / 60);
				const secondsCooldown = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 % 60);
				return message.reply(getLang("updateTooFast", minutes, seconds, minutesCooldown, secondsCooldown));
			}

			await message.reply(getLang("updateConfirmed"));
			
			// Create backup directory
			const backupDir = `${process.cwd()}/backups/backup_${currentCommit.substring(0, 7)}_${Date.now()}`;
			
			// Perform Git-based update
			execSync(`mkdir -p "${backupDir}"`, { stdio: "inherit" });
			execSync(`cp -r . "${backupDir}" || true`, { stdio: "inherit" });
			
			// Ensure we have the remote origin set
			try {
				execSync("git remote get-url origin", { stdio: "pipe" });
			} catch (remoteError) {
				execSync("git remote add origin https://github.com/sheikhtamimlover/ST-BOT.git", { stdio: "inherit" });
			}
			
			execSync("git fetch origin", { stdio: "inherit" });
			execSync("git reset --hard origin/main", { stdio: "inherit" });
			
			// Check if package.json changed and install dependencies if needed
			try {
				const { stdout } = execSync("git diff HEAD~1 HEAD --name-only", { encoding: 'utf8' });
				if (stdout.includes('package.json') || stdout.includes('package-lock.json')) {
					console.log("📦 | Package files changed, updating dependencies...");
					execSync("npm install", { stdio: "inherit" });
				}
			} catch (err) {
				console.log("📦 | Installing dependencies to be safe...");
				execSync("npm install", { stdio: "inherit" });
			}
			
			fs.writeFileSync(dirBootLogTemp, event.threadID);

			message.reply(getLang("updateComplete"), (err, info) => {
				if (err)
					return console.error(err);

				global.GoatBot.onReply.set(info.messageID, {
					messageID: info.messageID,
					threadID: info.threadID,
					authorID: event.senderID,
					commandName
				});
			});
		} catch (error) {
			console.error('Update error:', error);
			message.reply("❌ | Update failed. Please check the console for details.");
		}
	},

	onReply: async function ({ message, getLang, event }) {
		if (['yes', 'y'].includes(event.body?.toLowerCase())) {
			await message.reply(getLang("botWillRestart"));
			process.exit(2);
		}
	}
};

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i]))
			return 1;
		if (parseInt(v1[i]) < parseInt(v2[i]))
			return -1;
	}
	return 0;
}
