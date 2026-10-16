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

// --- আপনার সিক্রেট তথ্যগুলো এখানে সেট করে দিয়েছি ---
const DISCORD_TOKEN = "MTU2MDM5NzA1ODM2MjU4MTA2Mg.GwJSaI.ghJps0hKLmQBI7RgwVK1i9CS1Fx18-eFio2ewc"; 
const SERVER_ID = "1550169907868602469";
const CATEGORY_ID = "1560645166660853811";
const ADMIN_ROLE_ID = "1560650609386983424";

client.once('ready', () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
});

// সার্ভার লাইভ আছে কিনা চেক করার জন্য
app.get('/', (req, res) => {
    res.send('BANGLA FF Panel Bot Server is live!');
});

// ওয়েবসাইট থেকে অর্ডার আসলে টিকেট বানানোর API
app.post('/create-ticket', async (req, res) => {
    const { discordUserId, discordUsername, packageName, price, productTitle, category } = req.body;

    try {
        const guild = await client.guilds.fetch(SERVER_ID);
        
        // চ্যানেলের নাম ঠিক করা
        const userCleanName = (discordUsername || discordUserId || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `ticket-${userCleanName.slice(0, 10)}`;

        // প্রাইভেট পারমিশন সেটআপ
        const permissionOverwrites = [
            {
                id: guild.id, // সবার জন্য বন্ধ
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: ADMIN_ROLE_ID, // এডমিনদের জন্য খোলা
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }
        ];

        // যদি ইউজার তার সঠিক আইডি দেয়, তবে তাকে চ্যানেলে ঢোকার পারমিশন দেওয়া
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

        // টিকেট চ্যানেল তৈরি
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // টিকেটের ভেতর সুন্দর করে মেসেজ সাজানো
        const embed = new EmbedBuilder()
            .setTitle("🔔 NEW ORDER - PRIVATE TICKET")
            .setColor("#ff0066")
            .addFields(
                { name: "🎮 Product", value: productTitle || "PC PANEL", inline: true },
                { name: "📦 Package", value: packageName || "N/A", inline: true },
                { name: "💰 Price", value: price || "N/A", inline: true },
                { name: "👤 Customer", value: discordUserId ? `<@${discordUserId}>` : (discordUsername || "Guest"), inline: false }
            )
            .setFooter({ text: "BANGLA FF PANEL" })
            .setTimestamp();

        const adminMention = `<@&${ADMIN_ROLE_ID}>`;
        await ticketChannel.send({
            content: `New Order! ${adminMention}`,
            embeds: [embed]
        });

        // ওয়েবসাইটকে টিকেটের লিংক ফেরত পাঠানো
        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;
        res.json({ success: true, url: ticketUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));

client.login(DISCORD_TOKEN);
