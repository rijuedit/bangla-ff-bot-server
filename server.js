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

        // Base Channel Permissions Setup
        const permissionOverwrites = [
            {
                id: guild.id, // Hide channel from @everyone
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: FOUNDER_ROLE_ID, // FOUNDER Access
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            },
            {
                id: CO_OWNER_ROLE_ID, // CO-OWNER Access
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            }
        ];

        let userPing = `**${discordUserId || "Not Provided"}**`;
        if (discordUserId && /^\d{17,19}$/.test(discordUserId)) {
            userPing = `<@${discordUserId}>`;
            permissionOverwrites.push({
                id: discordUserId, // Customer Access
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            });
        }

        // Create Private Ticket Channel under Category
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0, // Text Channel
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // Construct Embed
        const embed = new EmbedBuilder()
            .setTitle("🛒 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐎𝐑𝐃𝐄𝐑 𝐓𝐈𝐂𝐊𝐄𝐓")
            .setDescription("আপনার অর্ডারটি সফলভাবে তৈরি হয়েছে! নিচে পেমেন্ট নাম্বার ও নিয়মাবলী দেওয়া হলো:")
            .setColor("#00ff99")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: "📦 ━【 প্রোডাক্ট 】",
                    value: `\`\`\`fix\n👉 ${productTitle || "Paid Panel"}\n\`\`\``,
                    inline: false
                },
                {
                    name: "⏳ ━【 মেয়াদ 】",
                    value: `\`\`\`yaml\n${packageName || "N/A"}\n\`\`\``,
                    inline: true
                },
                {
                    name: "💰 ━【 মোট টাকা 】",
                    value: `\`\`\`diff\n+ ${price || "0"} BDT\n\`\`\``,
                    inline: true
                },
                {
                    name: "👤 ━【 কাস্টমার 】",
                    value: `> **ID:** \`${discordUserId || "N/A"}\`\n> **Mention:** ${userPing}`,
                    inline: false
                },
                {
                    name: "💳 ━【 পেমেন্ট নাম্বার (কপি করতে নাম্বারে চাপ দিন) 】",
                    value: 
`> 💖 **bKash (Personal - Send Money):**
\`\`\`
${BKASH_NUMBER}
\`\`\`
> 🟧 **Nagad (Personal - Send Money):**
\`\`\`
${NAGAD_NUMBER}
\`\`\``,
                    inline: false
                },
                {
                    name: "📌 ━【 কীভাবে পেমেন্ট করবেন 】",
                    value: 
`> **১.** বিকাশ অথবা নগদের নাম্বারটি কপি করে নিন  
> **২.** **Send Money** অপশন থেকে **\`${price || "0"}\`** টাকা পাঠান  
> **৩.** পেমেন্ট সম্পন্ন হলে এই চ্যানেলে **স্ক্রিনশট** ও **TrxID** পাঠান  
> **৪.** এডমিন খুব দ্রুত ভেরিফাই করে প্যানেল অ্যাকসেস দিয়ে দেবে`,
                    inline: false
                },
                {
                    name: "⚠️ ━【 বিশেষ সতর্কতা 】",
                    value: `> • অবশ্যই **Send Money** করতে হবে (Cash Out নয়)  
> • ভুল নাম্বারে টাকা পাঠালে আমরা দায়ী থাকব না`,
                    inline: false
                }
            )
            .setFooter({ 
                text: "BANGLA FF PANEL • Secure Ticket System", 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Tag Founder & Co-Owner simultaneously
        const roleMentions = `<@&${FOUNDER_ROLE_ID}> <@&${CO_OWNER_ROLE_ID}>`;

        await ticketChannel.send({
            content: `📢 **নতুন অর্ডার এসেছে!** ${roleMentions}\n\nহ্যালো ${userPing} 👋\nনিচে আপনার পেমেন্ট নাম্বার দেওয়া আছে। টাকা পাঠিয়ে স্ক্রিনশট দিন।`,
            embeds: [embed]
        });

        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;
        res.json({ success: true, url: ticketUrl });

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
