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
- **Instagram**: [@sheikh.tamim_lover](https://www.instagram.com/sheikhtamim_lover/)
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

## ⭐ Special Features

### 🔐 Thread Approval System
Control which groups the bot can respond in with the thread approval system:

```json
"threadApproval": {
  "enable": true,
  "adminNotificationThreads": ["thread_id_1", "thread_id_2"],
  "autoApproveExisting": true
}
```

- **enable**: Turn on/off thread approval requirement
- **adminNotificationThreads**: Array of thread IDs where admins receive approval notifications
- **autoApproveExisting**: Automatically approve all existing threads when first enabled
- **Usage**: Use `.thread` command to manage pending, approve, or reject threads
- **Workflow**: Bot added to new group → Admin notification → Use `.thread` to approve/reject

### 🚀 Bot Startup Notifications
Get notified when your bot comes online:

```json
"botStartupNotification": {
  "enable": false,
  "sendToThreads": {
    "enable": true,
    "threadIds": ["thread_id_1", "thread_id_2"]
  },
  "sendToAdmin": {
    "enable": false,
    "adminId": "admin_user_id"
  },
  "message": "🤖 Bot is now online and ready to serve!"
}
```

- **sendToThreads**: Send startup message to specific group chats
- **sendToAdmin**: Send private message to bot admin
- **Custom Message**: Customize the startup notification message

### 🌐 Webview Dashboard Protection
Secure your dashboard with password protection:

```json
"dashBoard": {
  "enable": true,
  "port": 3001,
  "password": {
    "enable": true,
    "password": "your_secure_password"
  }
}
```

- **Dashboard Access**: Protected by password when enabled
- **Secure Login**: Enter password to access bot management interface
- **Real-time Monitoring**: Live statistics and bot control

### ⚡ AntiReact System
Advanced message management through reactions:

```json
"antiReact": {
  "enable": true,
  "reactByUnsend": {
    "enable": true,
    "emojis": ["👍"]
  },
  "reactByRemove": {
    "enable": true,
    "emoji": "⚠"
  },
  "onlyAdminBot": true
}
```

- **reactByUnsend**: React with specified emojis to unsend bot messages
- **reactByRemove**: React to remove users from group
- **Admin Only**: Only bot admins can use reaction controls

### 🆔 Bot Account Cookie System
Automatic cookie management for bot account:

```json
"botAccountCookie": {
  "enable": false,
  "email": "bot_account_email",
  "password": "bot_account_password",
  "autoUseWhenEmpty": true
}
```

- **Auto Login**: Automatically fetch cookies when account.txt is empty
- **Backup System**: Falls back to manual login if auto-login fails
- **No 2FA Support**: Use accounts without two-factor authentication

### 📝 Bio Update System
Automatically update bot's profile bio:

```json
"bioUpdate": {
  "enable": false,
  "bioText": "Your custom bio text",
  "updateOnce": true
}
```

- **Custom Bio**: Set personalized bio text
- **One-time Update**: Option to update only once or on every restart
- **Auto Management**: Handles bio updates seamlessly

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

## 🚀 Deployment on Replit

This bot is perfectly optimized for Replit deployment with zero configuration needed:

### 🎯 One-Click Deployment
1. **Fork/Import** this repository to Replit
2. **Run** - Simply click the Run button, Replit handles everything automatically
3. **Dashboard Access** - Your dashboard will be available at your Replit URL on port 3001
4. **Always On** - Use Replit's Always On feature for 24/7 bot operation

### 🔧 Replit-Optimized Features
- **Auto-Installation** - Dependencies install automatically on first run
- **Port Forwarding** - Dashboard automatically accessible via Replit's built-in port forwarding  
- **Environment Variables** - Use Replit's Secrets for sensitive configuration
- **File Persistence** - Database and configuration files persist across restarts
- **Live Reload** - Code changes trigger automatic restarts

### 🌐 Production Ready
- **Built-in SSL** - HTTPS automatically provided by Replit
- **Global CDN** - Fast worldwide access to your bot dashboard
- **Monitoring** - Built-in performance monitoring and logging
- **Scaling** - Automatic resource scaling based on usage

Replit provides the most reliable and easiest deployment experience for ST-Bot with no complex configuration required.

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
