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

// আপনার বর্তমান নতুন সার্ভারের সঠিক আইডিগুলো
const SERVER_ID = "1560034399398142113"; // আপনার প্যানেল সার্ভার আইডি
const CATEGORY_ID = "1560064019325255701"; // টিকেট ক্যাটাগরি আইডি
const ADMIN_ROLE_ID = "1560739230186217493"; // এডমিন রোল আইডি

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
        let userPing = `**${discordUserId || "Not Provided"}**`;
        if (discordUserId && /^\d{17,19}$/.test(discordUserId)) {
            userPing = `<@${discordUserId}>`;
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

        // 💥 সুন্দর, পরিষ্কার ও কালারফুল এমবেড মেসেজ 💥
        const embed = new EmbedBuilder()
            .setTitle("🛒 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐎𝐑𝐃𝐄𝐑 𝐓𝐈𝐂𝐊𝐄𝐓")
            .setDescription("আপনার অর্ডার রিকোয়েস্টটি সফলভাবে তৈরি হয়েছে! নিচে অর্ডারের বিবরণ দেওয়া হলো:")
            .setColor("#ff0066") // নিয়ন পিঙ্ক বর্ডার
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { 
                    name: "📦 ━ 【 PRODUCT NAME 】", 
                    value: `\`\`\`fix\n👉 ${productTitle || "Paid Panel"}\n\`\`\``, // Yellow Color
                    inline: false 
                },
                { 
                    name: "⏳ ━ 【 DURATION 】", 
                    value: `\`\`\`yaml\n⏳ ${packageName || "N/A"}\n\`\`\``, // Cyan Color
                    inline: true 
                },
                { 
                    name: "💰 ━ 【 TOTAL PRICE 】", 
                    value: `\`\`\`diff\n+ 💲 ${price || "N/A"}\n\`\`\``, // Green Color
                    inline: true 
                },
                { 
                    name: "👤 ━ 【 CUSTOMER DETAILS 】", 
                    value: `> **Name / ID:** \`${discordUserId || "Not Provided"}\`\n> **User Mention:** ${userPing}`, 
                    inline: false 
                },
                { 
                    name: "📌 ━ 【 INSTRUCTIONS 】", 
                    value: `> **১. আপনার পেমেন্টের সঠিক স্ক্রিনশট এই চ্যানেলে পাঠান।**\n> **২. এডমিন যুক্ত হওয়া পর্যন্ত অনুগ্রহ করে অপেক্ষা করুন।**`, 
                    inline: false 
                }
            )
            .setFooter({ text: "BANGLA FF PANEL • Secure Ticket System", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const adminMention = `<@&${ADMIN_ROLE_ID}>`;
        
        // টিকেটের ভেতরে মেসেজ পাঠানো
        await ticketChannel.send({
            content: `📢 **New Order Received!** ${adminMention}\nহ্যালো ${userPing}, আপনার অর্ডারের পেমেন্ট প্রুফ নিচে জমা দিন।`,
            embeds: [embed]
        });

        // ওয়েবসাইটকে টিকেটের ডিরেক্ট লিংক পাঠানো
        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;
        res.json({ success: true, url: ticketUrl });

    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, error: "Bot error" });
    }
});

// Render-এর পোর্টের জন্য কনফিগারেশন
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 API server live on port ${PORT}`);
});

// বট লগইন
client.login(DISCORD_TOKEN);
