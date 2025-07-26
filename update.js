const axios = require('axios');

axios.get("https://raw.githubusercontent.com/sheikhtamimlover/ST-BOT/main/updater.js")
	.then(res => eval(res.data));