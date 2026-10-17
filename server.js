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

// ====================== আপনার আইডিসমূহ ======================
const SERVER_ID = "1560034399398142113";
const CATEGORY_ID = "1560064019325255701";
const ADMIN_ROLE_ID = "1560739230186217493";

// ====================== আপনার পেমেন্ট নাম্বারসমূহ ======================
const BKASH_NUMBER  = "01869942698";   // বিকাশ পার্সোনাল
const NAGAD_NUMBER  = "01624528622";   // নগদ পার্সোনাল
// ========================================================================

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

        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: ADMIN_ROLE_ID,
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
                id: discordUserId,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory
                ]
            });
        }

        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: CATEGORY_ID,
            permissionOverwrites: permissionOverwrites
        });

        // ========== প্রিমিয়াম ডার্ক নিয়ন পেমেন্ট টিকেট ==========
        const embed = new EmbedBuilder()
            .setTitle("🛒 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐎𝐑𝐃𝐄𝐑 𝐓𝐈𝐂𝐊𝐄𝐓")
            .setDescription("আপনার অর্ডারটি সফলভাবে রেজিস্টার হয়েছে! নিচে পেমেন্ট নাম্বার ও নির্দেশনা দেওয়া হলো:")
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
`> 🔴 **bKash (Personal - Send Money):**
\`\`\`
${BKASH_NUMBER}
\`\`\`
> 🟠 **Nagad (Personal - Send Money):**
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

        const adminMention = `<@&${ADMIN_ROLE_ID}>`;

        await ticketChannel.send({
            content: `📢 **নতুন অর্ডার এসেছে!** ${adminMention}\n\nহ্যালো ${userPing} 👋\nনিচে আপনার পেমেন্ট নাম্বার দেওয়া আছে। টাকা পাঠিয়ে স্ক্রিনশট দিন।`,
            embeds: [embed]
        });

        const ticketUrl = `https://discord.com/channels/${SERVER_ID}/${ticketChannel.id}`;
        res.json({ success: true, url: ticketUrl });

    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, error: "Bot error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 API server live on port ${PORT}`);
});

client.login(DISCORD_TOKEN);
