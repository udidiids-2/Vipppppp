const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "cmd",
    aliases: ["command"],
    version: "2.0",
    author: "GoatBot (Modified by Dipto)",
    role: 2,
    shortDescription: {
      en: "Install or update command"
    },
    longDescription: {
      en: "Install new command or update existing command from github raw link (auto overwrite)"
    },
    category: "system",
    guide: {
      en: "{pn} install <raw_url>\n{pn} update <commandName>"
    }
  },

  langs: {
    en: {
      installSuccess: "✅ | Installed new command \"%1\" successfully",
      overwrite: "⚡ | Overwritten old command file \"%1\" successfully",
      updateSuccess: "🔄 | Updated command \"%1\" successfully",
      notFound: "❌ | Command \"%1\" not found",
      invalidUrl: "❌ | Invalid url, must be github raw link",
      error: "❌ | An error occurred: %1"
    }
  },

  onStart: async function ({ message, args, getLang }) {
    const type = args[0];
    if (!["install", "update"].includes(type))
      return message.SyntaxError();

    // ---------- INSTALL ----------
    if (type == "install") {
      const url = args[1];
      if (!url || !url.startsWith("https://raw.githubusercontent.com/"))
        return message.reply(getLang("invalidUrl"));

      const fileName = path.basename(url).replace(/\?.*$/, "");
      const filePath = path.join(__dirname, fileName);

      try {
        const rawCode = (await axios.get(url)).data;

        const isExist = fs.existsSync(filePath);
        fs.writeFileSync(filePath, rawCode);

        const commandName = fileName.replace(".js", "");
        if (isExist) {
          message.reply(getLang("overwrite", commandName));
        } else {
          message.reply(getLang("installSuccess", commandName));
        }
      } catch (e) {
        message.reply(getLang("error", e.message));
      }
    }

    // ---------- UPDATE ----------
    if (type == "update") {
      const commandName = args[1];
      if (!commandName)
        return message.SyntaxError();

      const filePath = path.join(__dirname, `${commandName}.js`);
      if (!fs.existsSync(filePath))
        return message.reply(getLang("notFound", commandName));

      try {
        // 👉 এখানে তোমার গিটহাব raw লিঙ্ক সেট করতে হবে
        const url = `https://raw.githubusercontent.com/YourRepo/${commandName}.js`;
        const rawCode = (await axios.get(url)).data;
        fs.writeFileSync(filePath, rawCode);

        message.reply(getLang("updateSuccess", commandName));
      } catch (e) {
        message.reply(getLang("error", e.message));
      }
    }
  }
};
