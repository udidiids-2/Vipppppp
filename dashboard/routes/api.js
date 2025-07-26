
const express = require("express");
const router = express.Router();
const os = require("os");
const path = require("path");
const fs = require("fs");

module.exports = function ({ isAuthenticated, threadsData, usersData }) {
	// Simple rate limiting function
	const createLimiter = (windowMs, max) => {
		const requests = new Map();

		return (req, res, next) => {
			const key = req.ip || req.connection.remoteAddress;
			const now = Date.now();

			if (!requests.has(key)) {
				requests.set(key, { count: 1, resetTime: now + windowMs });
				return next();
			}

			const record = requests.get(key);
			if (now > record.resetTime) {
				record.count = 1;
				record.resetTime = now + windowMs;
				return next();
			}

			if (record.count >= max) {
				return res.status(429).json({ error: "Too many requests" });
			}

			record.count++;
			next();
		};
	};

	const apiLimiter = createLimiter(1000 * 60 * 5, 100);

	// Apply rate limiting to all API routes
	router.use(apiLimiter);

	// Stats endpoint for real-time updates
	router.get("/stats", async (req, res) => {
		try {
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

			const memoryUsage = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;

			res.json({
				totalUsers,
				totalThreads,
				uptime,
				memoryUsage,
				status: "online",
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error("API Stats error:", error);
			res.json({
				error: false,
				totalUsers: 0,
				totalThreads: 0,
				uptime: "Unknown",
				memoryUsage: "Unknown",
				status: "error"
			});
		}
	});

	// System info endpoint
	router.get("/system", async (req, res) => {
		try {
			const systemInfo = {
				platform: os.platform(),
				arch: os.arch(),
				nodeVersion: process.version,
				uptime: Math.floor(process.uptime()),
				totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
				memoryUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
				cpus: os.cpus().length,
				hostname: os.hostname(),
				loadAverage: os.loadavg()
			};

			res.json(systemInfo);
		} catch (error) {
			console.error("API System error:", error);
			res.status(500).json({ error: "Failed to fetch system info" });
		}
	});

	// Restart endpoint
	router.post("/restart", async (req, res) => {
		try {
			// Create restart file to track restart
			const restartFile = path.join(__dirname, "../tmp/restart.txt");
			const tmpDir = path.dirname(restartFile);
			
			// Ensure tmp directory exists
			if (!fs.existsSync(tmpDir)) {
				fs.mkdirSync(tmpDir, { recursive: true });
			}
			
			// Write restart info
			fs.writeFileSync(restartFile, `Dashboard restart at ${new Date().toISOString()}`);

			res.json({
				success: true,
				message: "Bot restart initiated successfully"
			});

			// Restart after sending response
			setTimeout(() => {
				console.log("Dashboard: Restarting bot...");
				process.exit(2);
			}, 1000);

		} catch (error) {
			console.error("Restart error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to restart bot: " + error.message
			});
		}
	});

	// Logs endpoint
	router.get("/logs", (req, res) => {
		try {
			// Simple logs endpoint - shows recent console output
			const logs = [
				`Bot Status: Running`,
				`Uptime: ${Math.floor(process.uptime())} seconds`,
				`Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
				`Platform: ${os.platform()}`,
				`Node Version: ${process.version}`,
				`Total Users: ${global.db?.allUserData?.length || 0}`,
				`Total Threads: ${global.db?.allThreadData?.length || 0}`,
				`Last Updated: ${new Date().toISOString()}`
			];

			res.setHeader('Content-Type', 'text/plain');
			res.send(logs.join('\n'));
		} catch (error) {
			res.status(500).send('Error fetching logs: ' + error.message);
		}
	});

	return router;
};
