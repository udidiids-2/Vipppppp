const axios = require('axios');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('./logger/log.js');
let chalk;
try {
	chalk = require("./func/colors.js").colors;
}
catch (e) {
	chalk = require("chalk");
}

const sep = path.sep;
const currentConfig = require('./config.json');
const langCode = currentConfig.language;
const execSync = require('child_process').execSync;

let pathLanguageFile = `${process.cwd()}/languages/${langCode}.lang`;
if (!fs.existsSync(pathLanguageFile)) {
	log.warn("LANGUAGE", `Can't find language file ${langCode}, using default language file "${path.normalize(`${process.cwd()}/languages/en.lang`)}"`);
	pathLanguageFile = `${process.cwd()}/languages/en.lang`;
}
const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
const languageData = readLanguage
	.split(/\r?\n|\r/)
	.filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line != "");

global.language = {};
for (const sentence of languageData) {
	const getSeparator = sentence.indexOf('=');
	const itemKey = sentence.slice(0, getSeparator).trim();
	const itemValue = sentence.slice(getSeparator + 1, sentence.length).trim();
	const head = itemKey.slice(0, itemKey.indexOf('.'));
	const key = itemKey.replace(head + '.', '');
	const value = itemValue.replace(/\\n/gi, '\n');
	if (!global.language[head])
		global.language[head] = {};
	global.language[head][key] = value;
}

function getText(head, key, ...args) {
	if (!global.language[head]?.[key])
		return `Can't find text: "${head}.${key}"`;
	let text = global.language[head][key];
	for (let i = args.length - 1; i >= 0; i--)
		text = text.replace(new RegExp(`%${i + 1}`, 'g'), args[i]);
	return text;
}

const defaultWriteFileSync = fs.writeFileSync;
const defaulCopyFileSync = fs.copyFileSync;

function checkAndAutoCreateFolder(pathFolder) {
	const splitPath = path.normalize(pathFolder).split(sep);
	let currentPath = '';
	for (const i in splitPath) {
		currentPath += splitPath[i] + sep;
		if (!fs.existsSync(currentPath))
			fs.mkdirSync(currentPath);
	}
}

function sortObj(obj, parentObj, rootKeys, stringKey = "") {
	const root = sortObjAsRoot(obj, rootKeys);
	stringKey = stringKey || "";
	if (stringKey) {
		stringKey += ".";
	}
	for (const key in root) {
		if (
			typeof root[key] == "object"
			&& !Array.isArray(root[key])
			&& root[key] != null
		) {
			stringKey += key;

			root[key] = sortObj(
				root[key],
				parentObj,
				Object.keys(_.get(parentObj, stringKey) || {}),
				stringKey
			);

			stringKey = "";
		}
	}
	return root;
}

function sortObjAsRoot(subObj, rootKeys) {
	const _obj = {};
	for (const key in subObj) {
		const indexInRootObj = rootKeys.indexOf(key);
		_obj[key] = indexInRootObj == -1 ? 9999 : indexInRootObj;
	}
	const sortedSubObjKeys = Object.keys(_obj).sort((a, b) => _obj[a] - _obj[b]);
	const sortedSubObj = {};
	for (const key of sortedSubObjKeys) {
		sortedSubObj[key] = subObj[key];
	}

	return sortedSubObj;
}

// override fs.writeFileSync and fs.copyFileSync to auto create folder if not exist
fs.writeFileSync = function (fullPath, data) {
	fullPath = path.normalize(fullPath);
	const pathFolder = fullPath.split(sep);
	if (pathFolder.length > 1)
		pathFolder.pop();
	checkAndAutoCreateFolder(pathFolder.join(path.sep));
	defaultWriteFileSync(fullPath, data);
};

fs.copyFileSync = function (src, dest) {
	src = path.normalize(src);
	dest = path.normalize(dest);
	const pathFolder = dest.split(sep);
	if (pathFolder.length > 1)
		pathFolder.pop();
	checkAndAutoCreateFolder(pathFolder.join(path.sep));
	defaulCopyFileSync(src, dest);
};

(async () => {
	try {
		// Check if update is too recent
		const { data: lastCommit } = await axios.get('https://api.github.com/repos/sheikhtamimlover/ST-BOT/commits/main');
		const lastCommitDate = new Date(lastCommit.commit.committer.date);
		
		if (new Date().getTime() - lastCommitDate.getTime() < 5 * 60 * 1000) {
			const minutes = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 / 60);
			const seconds = Math.floor((5 * 60 * 1000 - (new Date().getTime() - lastCommitDate.getTime())) / 1000 % 60);
			return log.error("ERROR", getText("updater", "updateTooFast", minutes, seconds));
		}

		// Get current commit hash
		let currentCommit;
		try {
			currentCommit = require('child_process').execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
		} catch (err) {
			return log.error("ERROR", "Git not initialized. Please clone the repository using Git.");
		}

		// Check if already up to date
		if (currentCommit === lastCommit.sha) {
			return log.info("SUCCESS", getText("updater", "latestVersion"));
		}

		// Get commits between current and latest
		const { data: commits } = await axios.get(`https://api.github.com/repos/sheikhtamimlover/ST-BOT/compare/${currentCommit}...${lastCommit.sha}`);
		
		if (!commits.commits || commits.commits.length === 0) {
			return log.info("SUCCESS", getText("updater", "latestVersion"));
		}

		log.info("UPDATE", getText("updater", "newVersions", chalk.yellow(commits.commits.length)));
		
		// Analyze file changes from commits
		const changedFiles = new Set();
		const packageChanged = false;
		
		for (const commit of commits.commits) {
			const { data: commitDetails } = await axios.get(commit.url);
			if (commitDetails.files) {
				commitDetails.files.forEach(file => {
					changedFiles.add(file.filename);
					if (file.filename === 'package.json' || file.filename === 'package-lock.json') {
						packageChanged = true;
					}
				});
			}
		}

		const createUpdate = {
			version: lastCommit.sha.substring(0, 7),
			files: Array.from(changedFiles),
			reinstallDependencies: packageChanged
		};

	const backupsPath = `${process.cwd()}/backups`;
		if (!fs.existsSync(backupsPath))
			fs.mkdirSync(backupsPath);
		
		const currentVersion = require('./package.json').version;
		const folderBackup = `${backupsPath}/backup_${currentVersion}_${Date.now()}`;
		
		// Create backup
		fs.mkdirSync(folderBackup, { recursive: true });
		execSync(`cp -r . "${folderBackup}" || true`, { stdio: 'inherit' });

		log.info("UPDATE", `Update to commit ${chalk.yellow(createUpdate.version)}`);
		
		// Show which files will be updated
		for (const filePath of createUpdate.files) {
			console.log(chalk.bold.blue('[↑]'), filePath);
		}

		// Perform Git update
		try {
			log.info("UPDATE", "Fetching latest changes...");
			execSync("git fetch origin", { stdio: 'inherit' });
			
			log.info("UPDATE", "Applying updates...");
			execSync("git reset --hard origin/main", { stdio: 'inherit' });
			
			console.log(chalk.bold.green('[✓]'), "Successfully updated all files from Git");
		} catch (error) {
			log.error("ERROR", "Failed to update files via Git");
			throw error;
		}

	log.info("UPDATE", getText("updater", "updateSuccess", !createUpdate.reinstallDependencies ? getText("updater", "restartToApply") : ""));

		// npm install if package.json changed
		if (createUpdate.reinstallDependencies) {
			log.info("UPDATE", getText("updater", "installingPackages"));
			execSync("npm install", { stdio: 'inherit' });
			log.info("UPDATE", getText("updater", "installSuccess"));
		}

		log.info("UPDATE", getText("updater", "backupSuccess", chalk.yellow(folderBackup)));
		
	} catch (error) {
		log.error("ERROR", `Update failed: ${error.message}`);
		process.exit(1);
	}
})();