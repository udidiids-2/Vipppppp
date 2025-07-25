
const express = require("express");
const router = express.Router();

module.exports = function ({ isAuthenticated }) {
	router.get("/", [isAuthenticated], async (req, res) => {
		try {
			const totalUser = global.db?.allUserData?.length || 0;
			const totalThread = global.db?.allThreadData?.length || 0;
			const { utils } = global;
			const { config } = global.GoatBot;
			const uptime = utils ? utils.convertTime(process.uptime() * 1000) : `${Math.floor(process.uptime())}s`;
			const uptimeSecond = Math.floor(process.uptime());
			
			res.render("stats", {
				user: req.user,
				totalUser,
				totalThread,
				prefix: config.prefix,
				uptime,
				uptimeSecond
			});
		} catch (error) {
			console.error("Stats route error:", error);
			res.render("stats", {
				user: req.user,
				totalUser: 0,
				totalThread: 0,
				prefix: "!",
				uptime: "0s",
				uptimeSecond: 0
			});
		}
	});

	return router;
};
