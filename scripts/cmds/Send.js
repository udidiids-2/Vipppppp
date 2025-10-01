module.exports = {
    config: {
        name: "send",
        aliases: ["pay"],
        version: "1.0",
        author: "Rahat × ChatGPT",
        countDown: 5,
        role: 0,
        description: {
            vi: "Gửi tiền cho người dùng khác",
            en: "Send money to another user"
        },
        category: "economy",
        guide: {
            vi: "{pn} <@user> <số tiền>: Gửi tiền cho người dùng",
            en: "{pn} <@user> <amount>: Send money to another user"
        }
    },

    langs: {
        vi: {
            success: "✅ Bạn đã gửi %1$ cho %2",
            notEnough: "❌ Không đủ tiền",
            invalidAmount: "❌ Số tiền không hợp lệ",
            usage: "Cách dùng: {pn} <@user> <số tiền>"
        },
        en: {
            success: "✅ Successfully sent %1$ to %2",
            notEnough: "❌ Insufficient balance",
            invalidAmount: "❌ Invalid amount",
            usage: "Usage: {pn} <@user> <amount>"
        }
    },

    onStart: async function({ message, event, args, usersData, getLang }) {
        // Check if user mention and amount exist
        if (!args[0] || !args[1]) return message.reply(getLang("usage"));

        // Extract mention ID
        const mentionID = Object.keys(event.mentions)[0] || args[0].replace(/[^0-9]/g, "");
        if (!mentionID) return message.reply(getLang("usage"));

        // Clean and parse amount
        let amount = args[1].replace(/[^0-9]/g, '');
        amount = parseInt(amount, 10);
        if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));

        try {
            // Ensure both users exist
            await usersData.create(event.senderID);
            await usersData.create(mentionID);

            // Get sender money
            const senderMoney = await usersData.getMoney(event.senderID);
            if (senderMoney < amount) return message.reply(getLang("notEnough"));

            // Subtract from sender, add to receiver
            await usersData.subtractMoney(event.senderID, amount);
            await usersData.addMoney(mentionID, amount);

            // Reply success
            message.reply(getLang("success", amount, event.mentions[mentionID] || "Unknown"));
        }
        catch (err) {
            console.error(err);
            message.reply("❌ Something went wrong while sending money.");
        }
    }
};
