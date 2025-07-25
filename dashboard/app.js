
const express = require("express");
const app = express();
const fs = require("fs-extra");
const eta = require("eta");
const bodyParser = require("body-parser");
const http = require("http");
const server = http.createServer(app);
const os = require("os");

module.exports = async (api) => {
	const { utils } = global;
	const { config } = global.GoatBot;

	eta.configure({
		useWith: true
	});

	app.set("views", `${__dirname}/views`);
	app.engine("eta", eta.renderFile);
	app.set("view engine", "eta");

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// public folder 
	app.use("/css", express.static(`${__dirname}/css`));
	app.use("/js", express.static(`${__dirname}/js`));
	app.use("/images", express.static(`${__dirname}/images`));

	// Main dashboard route
	app.get("/", async (req, res) => {
		const {
			threadModel,
			userModel,
			threadsData,
			usersData
		} = global.db;

		// Get system info
		const systemInfo = {
			platform: os.platform(),
			arch: os.arch(),
			nodeVersion: process.version,
			uptime: utils.convertTime(process.uptime() * 1000),
			uptimeSeconds: process.uptime(),
			totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
			freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
			cpus: os.cpus().length,
			hostname: os.hostname()
		};

		// Get bot info
		const botInfo = {
			botID: global.GoatBot.botID || "Not logged in",
			prefix: config.prefix,
			language: config.language || "en",
			nickname: config.nickNameBot || "GoatBot",
			version: require("../package.json").version,
			totalThreads: threadsData ? (await threadsData.getAll()).filter(t => t.threadID.toString().length > 15).length : 0,
			totalUsers: usersData ? (await usersData.getAll()).length : 0
		};

		// Get account.txt content
		const accountPath = require("path").normalize(`${__dirname}/../account.txt`);
		let accountContent = "";
		try {
			accountContent = fs.readFileSync(accountPath, "utf8");
		} catch (err) {
			accountContent = "Error reading account.txt";
		}

		res.render("dashboard", {
			systemInfo,
			botInfo,
			accountContent,
			ping: Date.now() // Simple ping calculation
		});
	});

	// Update cookie route
	app.post("/update-cookie", async (req, res) => {
		try {
			const { cookie } = req.body;
			if (!cookie) {
				return res.json({ success: false, message: "Cookie content is required" });
			}

			const accountPath = require("path").normalize(`${__dirname}/../account.txt`);
			fs.writeFileSync(accountPath, cookie);

			res.json({ success: true, message: "Cookie updated successfully. Restarting bot..." });

			// Restart the bot after a short delay
			setTimeout(() => {
				process.exit(2);
			}, 1000);
		} catch (err) {
			res.json({ success: false, message: "Error updating cookie: " + err.message });
		}
	});

	// Real-time stats API endpoint - ultra-fast response
	app.get("/api/stats", (req, res) => {
		// Set headers for immediate response and no caching
		res.set({
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0',
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		
		try {
			// Get memory and CPU data
			const memUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();
			
			// Build response immediately
			const stats = {
				success: true,
				totalUser: global.db?.allUserData?.length || 0,
				totalThread: global.db?.allThreadData?.length || 0,
				memory: (memUsage.rss / 1024 / 1024).toFixed(2),
				cpu: (cpuUsage.system / 1024 / 1024).toFixed(2),
				nodeCpu: (cpuUsage.user / 1024 / 1024).toFixed(2),
				botStatus: global.GoatBot?.botID ? "Online" : "Offline",
				timestamp: Date.now(),
				uptime: Math.floor(process.uptime())
			};
			
			// Send response immediately
			res.json(stats);
			
		} catch (error) {
			// Quick error response
			res.json({
				success: false,
				error: 'API Error',
				totalUser: 0,
				totalThread: 0,
				memory: "0.00",
				cpu: "0.00",
				nodeCpu: "0.00",
				botStatus: "Error",
				timestamp: Date.now(),
				uptime: Math.floor(process.uptime())
			});
		}
	});

	// Server-Sent Events for real-time stats
	app.get("/api/stats/stream", (req, res) => {
		// Set SSE headers
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control'
		});

		// Function to send stats data
		const sendStats = () => {
			try {
				const memUsage = process.memoryUsage();
				const cpuUsage = process.cpuUsage();
				
				const stats = {
					success: true,
					totalUser: global.db?.allUserData?.length || 0,
					totalThread: global.db?.allThreadData?.length || 0,
					memory: (memUsage.rss / 1024 / 1024).toFixed(2),
					cpu: (cpuUsage.system / 1024 / 1024).toFixed(2),
					nodeCpu: (cpuUsage.user / 1024 / 1024).toFixed(2),
					uptime: utils ? utils.convertTime(process.uptime() * 1000) : `${Math.floor(process.uptime())}s`,
					uptimeSeconds: Math.floor(process.uptime()),
					botStatus: global.GoatBot?.botID ? "Online" : "Offline",
					timestamp: Date.now()
				};
				
				res.write(`data: ${JSON.stringify(stats)}\n\n`);
			} catch (error) {
				console.error("SSE Stats Error:", error);
				res.write(`data: ${JSON.stringify({
					success: false,
					error: 'Failed to fetch stats',
					timestamp: Date.now()
				})}\n\n`);
			}
		};

		// Send initial stats immediately
		sendStats();

		// Send stats every 500ms for real-time updates
		const interval = setInterval(sendStats, 500);

		// Clean up on client disconnect
		req.on('close', () => {
			clearInterval(interval);
			res.end();
		});

		req.on('aborted', () => {
			clearInterval(interval);
			res.end();
		});
	});

	// Include stats route
	app.use("/stats", require("./routes/stats.js")({
		isAuthenticated: (req, res, next) => {
			// Simple auth check - you can modify this based on your auth system
			next();
		}
	}));

	// Add CORS headers for API requests
	app.use((req, res, next) => {
		if (req.path.startsWith('/api/')) {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
			res.header('Access-Control-Allow-Headers', 'Content-Type');
		}
		next();
	});

	app.get("*", (req, res) => {
		res.status(404).send("Page not found");
	});

	const PORT = config.dashBoard.port || config.serverUptime.port || 3001;
	let dashBoardUrl = `https://${process.env.REPL_OWNER
		? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
		: process.env.API_SERVER_EXTERNAL == "https://api.glitch.com"
			? `${process.env.PROJECT_DOMAIN}.glitch.me`
			: `localhost:${PORT}`}`;
	dashBoardUrl.includes("localhost") && (dashBoardUrl = dashBoardUrl.replace("https", "http"));
	await server.listen(PORT);
	utils.log.info("DASHBOARD", `Dashboard is running: ${dashBoardUrl}`);
};
