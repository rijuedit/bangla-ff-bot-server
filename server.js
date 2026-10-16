const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- আপনার সার্ভারের আইডি সেটআপ ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "YOUR_BOT_TOKEN_HERE"; 
const SERVER_ID = "1550169907868602469";
const CATEGORY_ID = "1560645166660853811";
const ADMIN_ROLE_ID = "1560650609386983424";

client.once('ready', () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
});

// সার্ভার চালু আছে কিনা চেক করার রুট
app.get('/', (req, res) => {
    res.send('BANGLA FF Panel Bot Server is live and ready!');
});

// ওয়েবসাইট থেকে অর্ডার আসলে প্রাইভেট টিকেট বানানোর API
app.post('/create-ticket', async (req, res) => {
    const { discordUserId, discordUsername, packageName, price, productTitle, category } = req.body;

    try {
        const guild = await client.guilds.fetch(SERVER_ID);
        if (!guild) {
            return res.status(404).json({ success: false, message: "Server/Guild not found" });
        }

        // ইউনিক টিকেট চ্যানেলের নাম
        const userCleanName = (discordUsername || discordUserId || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `ticket-${userCleanName.slice(0, 10)}-${Date.now().toString().slice(-4)}`;

        // প্রাইভেট পারমিশন লজিক (কেউ দেখতে পাবে না, শুধু এডমিন ও অর্ডারকারী ইউজার ছাড়া)
        const permissionOverwrites = [
            {
                id: guild.id, // @everyone (সবাই ব্লক)
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: ADMIN_ROLE_ID, // Admin (এডমিন দেখতে পাবে)
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }
        ];

        // ইউজার আইডি থাকলে তাকেও চ্যানেলে এক্সেস দেওয়া হবে
        if (discordUserId && /^\d{17,19}$/.test(discordUserId)) {
            permissionOverwrites.push({
                id: discordUserId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            });
        }

        // ক্যাটাগরির অধীনে প্রাইভেট টিকেট তৈরি
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0, // GuildText
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // টিকেটের ভেতরে Neon Embed মেসেজ তৈরি
        const embed = new EmbedBuilder()
            .setTitle("🚨 NEW TICKET CREATED FROM WEBSITE")
            .setColor("#ff0066")
            .setDescription("An order request has been made. Ticket is private between User and Staff.")
            .addFields(
                { name: "📌 Panel Type", value: category || "BUY PANEL", inline: true },
                { name: "🎮 Product Name", value: productTitle || "BANGLA FF PANEL", inline: true },
                { name: "📦 Selected Package", value: packageName || "N/A", inline: true },
                { name: "💰 Price", value: price || "N/A", inline: true },
                { name: "👤 Order By User", value: discordUserId ? `<@${discordUserId}> (${discordUserId})` : (discordUsername || "Guest Customer"), inline: false },
                { name: "⏰ Date & Time", value: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }), inline: false }
            )
            .setFooter({ text: "BANGLA FF PANEL • Automatic Ticket System" })
            .setTimestamp();

        const userMention = (discordUserId && /^\d{17,19}$/.test(discordUserId)) ? `<@${discordUserId}>` : "";
        const adminMention = `<@&${ADMIN_ROLE_ID}>`;

        await ticketChannel.send({
            content: `🔔 ${adminMention} ${userMention} New order ticket ready!`,
            embeds: [embed]
        });

        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;

        return res.json({
            success: true,
            ticketUrl: ticketUrl,
            channelId: ticketChannel.id
        });

    } catch (error) {
        console.error("Ticket Creation Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Bot API running on port ${PORT}`);
});

client.login(DISCORD_TOKEN);
