
# 🐐 ST-BOT - By Sheikh Tamim

A customized and powerful multi-purpose chatbot framework for Facebook Messenger, based on the original **GoatBot V2** by NTKhang. This version is tailored and improved by **Sheikh Tamim** with additional integrations, command structure enhancements, and admin tools.

> ⚠️ This is a modified version. See License section below for usage rights.

---

## 🚀 Features

- **Modular Command System** - Easy to add/remove commands
- **Fast and Scalable** - Optimized bot core for high performance
- **Auto-restart and Watchdog** - Self-healing capabilities
- **MongoDB/SQLite Support** - Flexible database options
- **Dynamic Command Loader** - Hot-reload commands without restart
- **Scheduling & Updates** - Built-in task scheduling
- **Admin Control Panel** - Web dashboard for bot management
- **Real-time Dashboard** - Live monitoring with WebSocket
- **Ready to Deploy** - One-click deployment on Replit

---

## 👨‍💻 About the Developer

**Sheikh Tamim** is actively maintaining and regularly updating this project. This bot framework is reliable, easy to use, and deployed without hesitation on Replit with no deployment issues.

### 📞 Contact & Support

- **Messenger Group**: [Join Support Group](https://m.me/j/AbYvFRTzENblDU94/)
- **Instagram**: [@sheikh.tamim_lover](https://www.instagram.com/sheikh.tamim_lover/)
- **Facebook**: [m.me/tormairedusi](https://m.me/tormairedusi)
- **GitHub**: [sheikhtamimlover](https://github.com/sheikhtamimlover)

For any support, feature requests, or issues, feel free to message me or join the Messenger group!

---

## 🔧 Installation & Setup

### 🖥 Local/Replit Setup

1. **Clone the repository**:
```bash
git clone https://github.com/sheikhtamimlover/ST-BOT.git && cp -r ST-BOT/. . && rm -rf ST-BOT
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure the bot**:
   - Set your **Admin UID** in `config.json` → `adminBot` array
   - Add your **Facebook cookies** in `account.txt` (JSON format)
   - Configure database settings in `config.json`

4. **Start the bot**:
```bash
npm start
```

### 📋 Essential Configuration

Before starting, make sure to configure:

1. **Admin UID**: Add your Facebook user ID to `config.json`:
```json
"adminBot": ["YOUR_FACEBOOK_UID_HERE"]
```

2. **Facebook Cookies**: Replace content in `account.txt` with your Facebook cookies in JSON format

3. **Database**: Choose between SQLite (default) or MongoDB in `config.json`

4. **Bot Settings**: Customize prefix, language, timezone in `config.json`

---

## 🎮 Creating Custom Commands

### Command Structure

Commands are located in `scripts/cmds/` directory. Each command follows this structure:

```javascript
module.exports = {
    config: {
        name: "commandname",           // Command name (lowercase)
        aliases: ["alias1", "alias2"], // Alternative names
        version: "1.0.0",             // Command version
        author: "Your Name",          // Your name
        countDown: 5,                 // Cooldown in seconds
        role: 0,                      // 0: Everyone, 1: Group Admin, 2: Bot Admin
        description: "Command description",
        category: "category name",
        guide: "{pn} <usage guide>"   // Usage instructions
    },

    langs: {
        en: {
            // English text responses
            success: "Command executed successfully!",
            error: "An error occurred!"
        }
    },

    onStart: async function({ message, args, event, api, getLang }) {
        // Main command logic here
        try {
            // Your command code
            message.reply(getLang("success"));
        } catch (error) {
            message.reply(getLang("error"));
        }
    },

    onChat: async function({ message, event, api }) {
        // Optional: Respond to specific chat messages
        // This runs on every message if implemented
    },

    onReaction: async function({ message, event, api, Reaction }) {
        // Optional: Handle reactions to bot messages
    }
};
```

### Command Functions Available

- **message.reply()** - Reply to user
- **message.send()** - Send new message  
- **api.sendMessage()** - Send message to specific thread
- **api.getUserInfo()** - Get user information
- **api.getThreadInfo()** - Get group information
- **getLang()** - Get localized text
- **global.db.get()** - Database operations
- **utils.** - Utility functions

### Example Command

```javascript
module.exports = {
    config: {
        name: "hello",
        aliases: ["hi", "greet"],
        version: "1.0.0",
        author: "Sheikh Tamim",
        countDown: 3,
        role: 0,
        description: "Greet users with a friendly message",
        category: "fun",
        guide: "{pn} [name] - Greet someone or everyone"
    },

    onStart: async function({ message, args }) {
        const name = args.join(" ") || "everyone";
        message.reply(`Hello ${name}! 👋 Welcome to ST-Bot!`);
    }
};
```

---

## 🌐 Web Dashboard

The bot includes a real-time web dashboard accessible at `http://localhost:3001`. Features include:

- **Live Statistics** - Real-time bot metrics
- **User Management** - View and manage users
- **Group Management** - Monitor group activities  
- **Command Analytics** - Track command usage
- **System Monitoring** - Server status and performance

---

## 🚀 Deployment on Render

This bot is optimized for Render deployment:

1. **Fork** this repository to GitHub.
2. **Create a new Web Service** on Render and connect your forked repository.
3. **Set Build Command:** `npm install`
4. **Set Start Command:** `npm start`
5. **Deploy!** - Render will automatically build and deploy your bot.
6. **Scaling:** Configure auto-scaling and other settings to manage server load as needed.

Render provides reliable hosting, automated deployments, and easy scaling for your bot.

---

## 📚 Command Categories

- **Admin** - Bot administration commands
- **Fun** - Entertainment and games
- **Utility** - Useful tools and information
- **Economy** - Virtual currency system
- **Media** - Image, video, audio processing
- **AI** - Artificial intelligence integrations
- **Group** - Group management features

---

## 🔄 Regular Updates

This project receives regular updates with:
- **New Features** - Enhanced functionality
- **Bug Fixes** - Stability improvements  
- **Security Patches** - Keep your bot safe
- **Performance Optimizations** - Faster response times

Stay updated by watching this repository or joining our support group!

---

## 📄 License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software, but please maintain the original credits.

**Original GoatBot V2** by NTKhang  
**Enhanced & Maintained** by Sheikh Tamim

---

## ❤️ Support the Project

If you find this project helpful:
- ⭐ Star this repository
- 🍴 Fork and contribute
- 📢 Share with others
- 💬 Join our community

**Happy Botting! 🤖✨**
