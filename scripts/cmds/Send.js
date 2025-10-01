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
        if (!args[0] || !args[1]) return message.reply(getLang("usage"));

        const mentionID = args[0].replace(/[^0-9]/g, "");
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalidAmount"));

        let senderData = await usersData.get(event.senderID);
        let receiverData = await usersData.get(mentionID);

        if (!senderData) senderData = { money: 0 };
        if (!receiverData) receiverData = { money: 0 };

        if (senderData.money < amount) return message.reply(getLang("notEnough"));

        // Transfer money
        senderData.money -= amount;
        receiverData.money += amount;

        await usersData.set(event.senderID, senderData);
        await usersData.set(mentionID, receiverData);

        message.reply(getLang("success", amount, event.mentions[mentionID] || "Unknown"));
    }
};
