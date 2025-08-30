const express = require("express");
const bodyParser = require("body-parser");
const eta = require("eta");
const http = require("http");
const WebSocket = require("ws");
const os = require("os");

const app = express();

module.exports = async (api) => {
	const { utils } = global;
	const { config } = global.GoatBot;

	eta.configure({
		useWith: true
	});

	app.set("views", `${__dirname}/views`);
	app.engine("eta", eta.renderFile);
	app.set("view engine", "eta");

	// Session middleware for password authentication
	const session = require('express-session');
	app.use(session({
		secret: 'dashboard-session-' + Date.now(),
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
	}));

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	// Static files
	app.use("/css", express.static(`${__dirname}/css`));
	app.use("/js", express.static(`${__dirname}/js`));
	app.use("/images", express.static(`${__dirname}/images`));

	// Simple authentication middleware
	const isAuthenticated = (req, res, next) => {
		// Check if dashboard password protection is enabled
		if (config.dashBoard?.password?.enable === true && config.dashBoard?.password?.password) {
			const sessionPassword = req.session?.dashboardAuth;
			const configPassword = config.dashBoard.password.password;
			
			if (sessionPassword !== configPassword) {
				return res.render("login", {
					error: req.query.error === "1" ? "Invalid password" : null
				});
			}
		}
		next();
	};

	// Login route for password authentication
	app.post("/login", (req, res) => {
		const { password } = req.body;
		const configPassword = config.dashBoard?.password?.password;
		
		if (password === configPassword) {
			req.session.dashboardAuth = password;
			res.redirect("/");
		} else {
			res.redirect("/?error=1");
		}
	});

	// Main dashboard route
	app.get("/", isAuthenticated, async (req, res) => {
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

			// Get memory usage
			const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB";

			// Bot info
			const botInfo = {
				botID: api?.getCurrentUserID?.() || "Unknown",
				prefix: config?.prefix || "!",
				language: config?.language || "en",
				nickname: config?.nickNameBot || "ST Bot",
				version: require("../package.json").version,
				totalUsers,
				totalThreads
			};

			// System info
			const systemInfo = {
				platform: os.platform(),
				arch: os.arch(),
				nodeVersion: process.version,
				cpus: os.cpus().length,
				totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				uptime,
				memoryUsed
			};

			res.render("dashboard", {
				botInfo,
				systemInfo
			});
		} catch (error) {
			console.error("Dashboard error:", error);
			res.status(500).render("404", {
				error: "Failed to load dashboard"
			});
		}
	});

	// API routes
	const apiRouter = require("./routes/api")({ isAuthenticated });
	app.use("/api", isAuthenticated, apiRouter);

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
		const server = http.createServer(app);

		// WebSocket server for real-time updates
		const wss = new WebSocket.Server({ 
			server,
			path: '/ws'
		});

		wss.on('connection', (ws, req) => {
			
			// Send initial data immediately
			sendStatsUpdate(ws);

			// Set up interval for real-time updates every 1 second
			const interval = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					sendStatsUpdate(ws);
				} else {
					clearInterval(interval);
				}
			}, 1000);

			ws.on('close', () => {
				clearInterval(interval);
			});

			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
				clearInterval(interval);
			});

			// Handle ping/pong for connection health
			ws.on('pong', () => {
				ws.isAlive = true;
			});

			ws.isAlive = true;
		});

		// Ping clients periodically to check connection health
		const pingInterval = setInterval(() => {
			wss.clients.forEach((ws) => {
				if (ws.isAlive === false) {
					return ws.terminate();
				}
				ws.isAlive = false;
				ws.ping();
			});
		}, 30000);

		function sendStatsUpdate(ws) {
			try {
				// Get current stats
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

				// Get memory usage
				const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB";

				const statsData = {
					type: 'stats',
					totalUsers,
					totalThreads,
					uptime,
					memoryUsage,
					timestamp: new Date().toISOString()
				};

				ws.send(JSON.stringify(statsData));
			} catch (error) {
				console.error('Error sending stats update:', error);
			}
		}

		server.listen(port, "0.0.0.0", () => {
			console.log(`Dashboard with WebSocket running on port ${port}`);
			console.log(`WebSocket endpoint: ws://localhost:${port}/ws`);
			resolve(server);
		});

		server.on('error', (err) => {
			console.error('Dashboard server error:', err);
		});
	});
};