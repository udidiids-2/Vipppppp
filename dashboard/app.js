
const express = require("express");
const bodyParser = require("body-parser");
const eta = require("eta");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();

module.exports = async (api) => {
	const { utils } = global;
	const { config } = global.GoatBot;
	const { threadsData, usersData } = global.db;

	eta.configure({
		useWith: true
	});

	app.set("views", `${__dirname}/views`);
	app.engine("eta", eta.renderFile);
	app.set("view engine", "eta");

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// Static files
	app.use("/css", express.static(`${__dirname}/css`));
	app.use("/js", express.static(`${__dirname}/js`));
	app.use("/images", express.static(`${__dirname}/images`));

	// Simple authentication middleware
	const isAuthenticated = (req, res, next) => {
		next();
	};

	// Main dashboard route
	app.get("/", async (req, res) => {
		try {
			// Get real-time data safely
			const totalUsers = global.db?.allUserData?.length || 0;
			const totalThreads = global.db?.allThreadData?.length || 0;

			// Calculate uptime
			const uptimeSeconds = Math.floor(process.uptime());
			const hours = Math.floor(uptimeSeconds / 3600);
			const minutes = Math.floor((uptimeSeconds % 3600) / 60);
			const seconds = uptimeSeconds % 60;
			let uptime = '';
			if (hours > 0) uptime += `${hours}h `;
			if (minutes > 0) uptime += `${minutes}m `;
			uptime += `${seconds}s`;

			// System information
			const systemInfo = {
				platform: os.platform(),
				arch: os.arch(),
				nodeVersion: process.version,
				uptime: uptime,
				uptimeSeconds: uptimeSeconds,
				totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				memoryUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
				cpus: os.cpus().length,
				hostname: os.hostname()
			};

			// Bot information
			const botInfo = {
				botID: api ? api.getCurrentUserID() : "Unknown",
				prefix: config?.prefix || "!",
				language: config?.language || "en",
				nickname: config?.nickNameBot || "ST | Bot",
				version: "2.0.02",
				totalUsers,
				totalThreads
			};

			// Read account.txt content safely
			let accountContent = "";
			try {
				const accountPath = path.join(process.cwd(), "account.txt");
				if (fs.existsSync(accountPath)) {
					accountContent = fs.readFileSync(accountPath, "utf8");
				}
			} catch (err) {
				console.error("Error reading account.txt:", err);
			}

			res.render("dashboard", {
				systemInfo,
				botInfo,
				accountContent
			});
		} catch (error) {
			console.error("Dashboard route error:", error);
			// Render with safe defaults
			res.render("dashboard", {
				systemInfo: {
					platform: "Unknown",
					arch: "Unknown",
					nodeVersion: process.version,
					uptime: "Unknown",
					uptimeSeconds: 0,
					totalMemory: "Unknown",
					freeMemory: "Unknown",
					memoryUsed: "Unknown",
					cpus: 0,
					hostname: "Unknown"
				},
				botInfo: {
					botID: "Unknown",
					prefix: "!",
					language: "en",
					nickname: "ST | Bot",
					version: "2.0.02",
					totalUsers: 0,
					totalThreads: 0
				},
				accountContent: ""
			});
		}
	});

	// API routes
	const apiRouter = require("./routes/api")({ 
		isAuthenticated,
		threadsData,
		usersData
	});
	app.use("/api", apiRouter);

	// Cookie update endpoint
	app.post("/update-cookie", async (req, res) => {
		try {
			const { cookie } = req.body;

			if (!cookie || !cookie.trim()) {
				return res.json({
					success: false,
					message: "Cookie content is required"
				});
			}

			const accountPath = path.join(process.cwd(), "account.txt");
			fs.writeFileSync(accountPath, cookie.trim(), "utf8");

			res.json({
				success: true,
				message: "Cookie updated successfully! Bot will restart in 3 seconds..."
			});

			// Restart the bot after updating cookie
			setTimeout(() => {
				process.exit(2);
			}, 3000);

		} catch (error) {
			console.error("Cookie update error:", error);
			res.json({
				success: false,
				message: "Failed to update cookie: " + error.message
			});
		}
	});

	// Health check endpoint
	app.get("/uptime", (req, res) => {
		res.json({
			status: "ok",
			uptime: Math.floor(process.uptime()),
			timestamp: new Date().toISOString()
		});
	});

	// Error handling
	app.use((err, req, res, next) => {
		console.error("Dashboard error:", err);
		res.status(500).render("404", {
			error: "Internal Server Error"
		});
	});

	// 404 handler
	app.use((req, res) => {
		res.status(404).render("404", {
			error: "Page Not Found"
		});
	});

	const port = config.dashBoard?.port || 3001;

	return new Promise((resolve) => {
		const server = app.listen(port, "0.0.0.0", () => {
			console.log(`Dashboard running on port ${port}`);
			resolve(server);
		});
	});
};
