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

// Server & Category Configuration
const SERVER_ID        = "1560034399398142113";
const CATEGORY_ID      = "1560064019325255701";

// Role IDs for Mentions & Channel Permissions
const FOUNDER_ROLE_ID  = "1560738050743468135"; 
const CO_OWNER_ROLE_ID = "1560738926581252248"; 

// Payment Numbers
const BKASH_NUMBER  = "01869942698";   // bKash Personal
const NAGAD_NUMBER  = "01624528622";   // Nagad Personal

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

        // Base Channel Permissions (Admins only by default)
        const permissionOverwrites = [
            {
                id: guild.id, // Hide channel from @everyone
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: FOUNDER_ROLE_ID, // FOUNDER Access
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ReadMessageHistory]
            },
            {
                id: CO_OWNER_ROLE_ID, // CO-OWNER Access
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ReadMessageHistory]
            }
        ];

        let targetUserId = null;
        let userPing = `**${discordUserId || "Not Provided"}**`;

        // 🌟 স্মার্ট ইউজারনেম এবং আইডি ফাইন্ডার (Smart Search)
        if (discordUserId) {
            if (/^\d{17,19}$/.test(discordUserId)) {
                // If it's already an 18-digit ID
                targetUserId = discordUserId;
            } else {
                // If user typed their username, search the server for their ID
                try {
                    const members = await guild.members.fetch({ query: discordUserId, limit: 1 });
                    const member = members.first();
                    if (member) {
                        targetUserId = member.id;
                    }
                } catch(err) {
                    console.log("Member search error (Not in server yet).");
                }
            }
        }

        // কাস্টমার সার্ভারে থাকলে তাকে পারমিশন দেওয়া
        if (targetUserId) {
            userPing = `<@${targetUserId}>`;
            permissionOverwrites.push({
                id: targetUserId,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            });
        }

        // Create Private Ticket Channel
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
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "📦 ━【 প্রোডাক্ট 】", value: `\`\`\`fix\n👉 ${productTitle || "Paid Panel"}\n\`\`\``, inline: false },
                { name: "⏳ ━【 মেয়াদ 】", value: `\`\`\`yaml\n${packageName || "N/A"}\n\`\`\``, inline: true },
                { name: "💰 ━【 মোট টাকা 】", value: `\`\`\`diff\n+ ${price || "0"} BDT\n\`\`\``, inline: true },
                { name: "👤 ━【 কাস্টমার 】", value: `> **ID/Name:** \`${discordUserId || "N/A"}\`\n> **Mention:** ${userPing}`, inline: false },
                { name: "💳 ━【 পেমেন্ট নাম্বার (কপি করতে নাম্বারে চাপ দিন) 】", value: `> 💖 **bKash (Personal - Send Money):**\n\`\`\`\n${BKASH_NUMBER}\n\`\`\`\n> 🟧 **Nagad (Personal - Send Money):**\n\`\`\`\n${NAGAD_NUMBER}\n\`\`\``, inline: false },
                { name: "📌 ━【 কীভাবে পেমেন্ট করবেন 】", value: `> **১.** বিকাশ অথবা নগদের নাম্বারটি কপি করে নিন\n> **২.** **Send Money** অপশন থেকে **\`${price || "0"}\`** টাকা পাঠান\n> **৩.** পেমেন্ট সম্পন্ন হলে এই চ্যানেলে **স্ক্রিনশট** ও **TrxID** পাঠান`, inline: false }
            )
            .setFooter({ text: "BANGLA FF PANEL • Secure Ticket System", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const roleMentions = `<@&${FOUNDER_ROLE_ID}> <@&${CO_OWNER_ROLE_ID}>`;

        await ticketChannel.send({
            content: `📢 **নতুন অর্ডার এসেছে!** ${roleMentions}\n\nহ্যালো ${userPing} 👋\nনিচে আপনার পেমেন্ট নাম্বার দেওয়া আছে। টাকা পাঠিয়ে স্ক্রিনশট দিন।`,
            embeds: [embed]
        });

        // 🌟 জেনারেট ইনভাইট লিংক (নতুন মেম্বারদের সার্ভারে জয়েন করানোর জন্য)
        const invite = await ticketChannel.createInvite({
            maxAge: 86400, // 24 hours validity
            maxUses: 0 // Unlimited uses
        });

        res.json({ success: true, url: invite.url });

    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, error: "Bot error creating channel" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 API server live on port ${PORT}`);
});

client.login(DISCORD_TOKEN);
