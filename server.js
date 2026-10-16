const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ডিসকর্ড বট ক্লায়েন্ট সেটআপ
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// আপনার সার্ভারের আইডিগুলো এখানে সেট করা হলো
const SERVER_ID = "1550169907868602469";
const CATEGORY_ID = "1560645166660853811";
const ADMIN_ROLE_ID = "1560650609386983424";

// Render-এর এনভায়রনমেন্ট ভেরিয়েবল থেকে টোকেন নেওয়া
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ BANGLA FF BOT is online as ${client.user.tag}`);
});

// সার্ভার ঠিক আছে কিনা চেক করার রুট
app.get('/', (req, res) => {
    res.send('BANGLA FF Bot API is Running Successfully!');
});

// টিকেট তৈরির মূল কোড (অর্ডার রিসিভ)
app.post('/create-ticket', async (req, res) => {
    const { discordUserId, packageName, price, productTitle } = req.body;

    try {
        const guild = await client.guilds.fetch(SERVER_ID);
        
        // চ্যানেলের নাম তৈরি
        const channelName = `order-${Date.now().toString().slice(-4)}`;

        // প্রাইভেট পারমিশন লজিক
        const permissionOverwrites = [
            {
                id: guild.id, // @everyone সবার জন্য বন্ধ
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

        // যদি ইউজার তার সঠিক আইডি দেয়, তবে তাকেও পারমিশন দেওয়া হবে
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
            type: 0, // GuildText
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // টিকেটের ভেতরে মেসেজ পাঠানো
        const embed = new EmbedBuilder()
            .setTitle("🎮 NEW PREMIUM ORDER RECEIVED")
            .setColor("#ff0066")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "📦 Product:", value: productTitle || "Paid Panel", inline: true },
                { name: "⏳ Package:", value: packageName || "N/A", inline: true },
                { name: "💰 Price:", value: price || "N/A", inline: true },
                { name: "👤 Customer:", value: discordUserId ? `<@${discordUserId}>` : "Not Provided", inline: false }
            )
            .setFooter({ text: "BANGLA FF PANEL • Secure Ticket System" })
            .setTimestamp();

        const adminMention = `<@&${ADMIN_ROLE_ID}>`;
        await ticketChannel.send({
            content: `📢 New order request! ${adminMention}`,
            embeds: [embed]
        });

        // ওয়েবসাইটকে টিকেটের ডিরেক্ট লিংক পাঠানো
        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;
        res.json({ success: true, url: ticketUrl });

    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, error: "Bot couldn't create channel. Check permissions." });
    }
});

// Render-এর পোর্টের জন্য কনফিগারেশন
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 API server live on port ${PORT}`);
});

// বট লগইন
client.login(DISCORD_TOKEN);
