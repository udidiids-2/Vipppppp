const express = require("express");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");

module.exports = ({ isAuthenticated, threadsData, usersData }) => {
    const router = express.Router();

    // Get real-time stats
    router.get("/stats", (req, res) => {
        try {
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

            // Get user and thread counts
            const totalUsers = global.db?.allUserData?.length || 0;
            const totalThreads = global.db?.allThreadData?.length || 0;

            res.json({
                success: true,
                totalUsers,
                totalThreads,
                uptime,
                memoryUsage,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Stats API error:", error);
            res.status(500).json({
                success: false,
                error: true,
                message: error.message
            });
        }
    });

    // Restart bot
    router.post("/restart", (req, res) => {
        try {
            res.json({
                success: true,
                message: "Bot restart initiated"
            });

            // Restart after response is sent
            setTimeout(() => {
                process.exit(2);
            }, 1000);
        } catch (error) {
            console.error("Restart API error:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get Facebook cookies
    router.get("/cookies", (req, res) => {
        try {
            const cookiePath = path.join(process.cwd(), "account.txt");
            if (fs.existsSync(cookiePath)) {
                const cookies = fs.readFileSync(cookiePath, "utf8");
                res.json({
                    success: true,
                    cookies: cookies,
                    lastModified: fs.statSync(cookiePath).mtime
                });
            } else {
                res.json({
                    success: false,
                    message: "No cookies file found"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update Facebook cookies
    router.post("/cookies", (req, res) => {
        try {
            const { cookies } = req.body;
            if (!cookies) {
                return res.status(400).json({
                    success: false,
                    message: "Cookies data is required"
                });
            }

            const cookiePath = path.join(process.cwd(), "account.txt");
            fs.writeFileSync(cookiePath, cookies, "utf8");
            
            res.json({
                success: true,
                message: "Cookies updated successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get bot configuration
    router.get("/config", (req, res) => {
        try {
            const configPath = path.join(process.cwd(), "config.json");
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
                res.json({
                    success: true,
                    config: config
                });
            } else {
                res.json({
                    success: false,
                    message: "Config file not found"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update bot configuration
    router.post("/config", (req, res) => {
        try {
            const { config } = req.body;
            if (!config) {
                return res.status(400).json({
                    success: false,
                    message: "Configuration data is required"
                });
            }

            const configPath = path.join(process.cwd(), "config.json");
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
            
            res.json({
                success: true,
                message: "Configuration updated successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update bot (git pull)
    router.post("/update", (req, res) => {
        try {
            const { spawn } = require("child_process");
            
            res.json({
                success: true,
                message: "Update initiated"
            });

            // Run git pull
            const updateProcess = spawn("git", ["pull"], {
                cwd: process.cwd(),
                stdio: "inherit"
            });

            updateProcess.on("close", (code) => {
                if (code === 0) {
                    console.log("Update completed successfully");
                    // Restart after update
                    setTimeout(() => {
                        process.exit(2);
                    }, 2000);
                } else {
                    console.log("Update failed with code:", code);
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get system info with accurate stats
    router.get("/system", (req, res) => {
        try {
            // Get more accurate user/thread counts
            let totalUsers = 0;
            let totalThreads = 0;
            
            if (global.db && global.db.allUserData) {
                totalUsers = global.db.allUserData.length;
            }
            
            if (global.db && global.db.allThreadData) {
                totalThreads = global.db.allThreadData.length;
            }

            // Calculate accurate uptime
            const uptimeSeconds = Math.floor(process.uptime());
            const days = Math.floor(uptimeSeconds / (24 * 3600));
            const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            
            let uptime = '';
            if (days > 0) uptime += `${days}d `;
            if (hours > 0) uptime += `${hours}h `;
            if (minutes > 0) uptime += `${minutes}m `;
            uptime += `${seconds}s`;

            // Get memory usage
            const memUsage = process.memoryUsage();
            const memoryUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memoryTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

            res.json({
                success: true,
                totalUsers,
                totalThreads,
                uptime,
                memoryUsed: memoryUsed + " MB",
                memoryTotal: memoryTotal + " MB",
                nodeVersion: process.version,
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Health check endpoint
    router.get("/health", (req, res) => {
        res.json({
            status: "ok",
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            memory: {
                used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
                total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB"
            }
        });
    });

    return router;
};