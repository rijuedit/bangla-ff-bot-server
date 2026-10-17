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

// --- কনফিগারেশন (নিচের আইডিগুলো চেক করুন) ---
const SERVER_ID        = "1560034399398142113";
const CATEGORY_ID      = "1560064019325255701";

// ⚠️ এখানে আপনার রোলের আসল ID বসান (ডিসকর্ড থেকে কপি করে)
const FOUNDER_ROLE_ID  = "1560738050743468135"; // আপনার Founder রোলের ID দিন
const CO_OWNER_ROLE_ID = "1560738926581252248"; // আপনার Co-Owner রোলের ID দিন

// পেমেন্ট নাম্বার
const BKASH_NUMBER  = "01869942698"; 
const NAGAD_NUMBER  = "01624528622"; 

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ BANGLA FF BOT is online as ${client.user.tag}`);
});

app.get('/', (req, res) => {
    res.send('BANGLA FF Bot API is Running Successfully!');
});

app.post('/create-ticket', async (req, res) => {
    const { discordUserId, packageName, price, productTitle } = req.body;

    try {
        const guild = await client.guilds.fetch(SERVER_ID);
        const channelName = `order-${Date.now().toString().slice(-4)}`;

        // পারমিশন সেটআপ
        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            }
        ];

        // Founder Role Permission
        if (FOUNDER_ROLE_ID.match(/^\d+$/)) {
            permissionOverwrites.push({
                id: FOUNDER_ROLE_ID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            });
        }

        // Co-Owner Role Permission
        if (CO_OWNER_ROLE_ID.match(/^\d+$/)) {
            permissionOverwrites.push({
                id: CO_OWNER_ROLE_ID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            });
        }

        // Customer Permission
        let userPing = `**${discordUserId || "Not Provided"}**`;
        if (discordUserId && /^\d{17,19}$/.test(discordUserId)) {
            userPing = `<@${discordUserId}>`;
            permissionOverwrites.push({
                id: discordUserId,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            });
        }

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        const embed = new EmbedBuilder()
            .setTitle("🛒 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐎𝐑𝐃𝐄𝐑 𝐓𝐈𝐂𝐊𝐄𝐓")
            .setDescription("আপনার অর্ডারটি সফলভাবে তৈরি হয়েছে! নিচে পেমেন্ট নাম্বার ও নিয়মাবলী দেওয়া হলো:")
            .setColor("#00ff99")
            .addFields(
                { name: "📦 ━【 প্রোডাক্ট 】", value: `\`\`\`fix\n👉 ${productTitle || "Paid Panel"}\n\`\`\``, inline: false },
                { name: "⏳ ━【 মেয়াদ 】", value: `\`\`\`yaml\n${packageName || "N/A"}\n\`\`\``, inline: true },
                { name: "💰 ━【 মোট টাকা 】", value: `\`\`\`diff\n+ ${price || "0"} BDT\n\`\`\``, inline: true },
                { name: "👤 ━【 কাস্টমার 】", value: `> **ID:** \`${discordUserId || "N/A"}\`\n> **Mention:** ${userPing}`, inline: false },
                { name: "💳 ━【 পেমেন্ট নাম্বার (কপি করতে চাপ দিন) 】", value: `> 💖 **bKash (Personal):**\n\`\`\`\n${BKASH_NUMBER}\n\`\`\`\n> 🟧 **Nagad (Personal):**\n\`\`\`\n${NAGAD_NUMBER}\n\`\`\``, inline: false },
                { name: "📌 ━【 কীভাবে পেমেন্ট করবেন 】", value: `> **১.** উপরে দেওয়া নাম্বার কপি করুন\n> **২.** **Send Money** করুন **\`${price || "0"}\`** টাকা\n> **৩.** পেমেন্ট শেষে **Transaction ID** বা **স্ক্রিনশট** এখানে দিন`, inline: false }
            )
            .setFooter({ text: "BANGLA FF PANEL • Secure System" })
            .setTimestamp();

        // মেনশন মেসেজ
        let mentionContent = `📢 **নতুন অর্ডার!** `;
        if (FOUNDER_ROLE_ID.match(/^\d+$/)) mentionContent += `<@&${FOUNDER_ROLE_ID}> `;
        if (CO_OWNER_ROLE_ID.match(/^\d+$/)) mentionContent += `<@&${CO_OWNER_ROLE_ID}> `;
        
        await ticketChannel.send({
            content: `${mentionContent}\nহ্যালো ${userPing}, এডমিন খুব দ্রুত আপনার সাথে যোগাযোগ করবে।`,
            embeds: [embed]
        });

        res.json({ success: true, url: `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}` });

    } catch (error) {
        console.error("Ticket Error:", error);
        res.status(500).json({ success: false, error: "Bot could not create channel" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

client.login(DISCORD_TOKEN);
