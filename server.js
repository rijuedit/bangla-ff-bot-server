
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// ================= CONFIGURATION =================

const SERVER_ID = "1560034399398142113";
const CATEGORY_ID = "1560064019325255701";

const FOUNDER_ROLE_ID = "1560738050743468135";
const CO_OWNER_ROLE_ID = "1560738926581252248";

const BKASH_NUMBER = "01869942698";
const NAGAD_NUMBER = "01624528622";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 10000;

// ================= DISCORD CLIENT =================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`BANGLA FF BOT is online as ${client.user.tag}`);
});

// ================= API HOME =================

app.get("/", (req, res) => {
    res.send("BANGLA FF Bot API is Running Successfully!");
});

// ================= CREATE ORDER TICKET =================

app.post("/create-ticket", async (req, res) => {
    let ticketChannel;

    try {
        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                error: "Bot is starting. Please try again."
            });
        }

        const {
            discordUserId,
            packageName,
            price,
            productTitle
        } = req.body || {};

        // Require a numeric Discord User ID
        const userId = String(discordUserId || "").trim();

        if (!/^\d{17,20}$/.test(userId)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_DISCORD_ID"
            });
        }

        // Validate basic order information
        if (!productTitle || !packageName || price === undefined || price === null) {
            return res.status(400).json({
                success: false,
                error: "MISSING_ORDER_DETAILS"
            });
        }

        const guild = await client.guilds.fetch(SERVER_ID);

        // Buyer must already be a member of this server
        let buyer;

        try {
            buyer = await guild.members.fetch(userId);
        } catch {
            return res.status(403).json({
                success: false,
                error: "JOIN_SERVER_FIRST"
            });
        }

        // Check whether the ticket category exists
        const category = await guild.channels.fetch(CATEGORY_ID);

        if (
            !category ||
            category.type !== ChannelType.GuildCategory
        ) {
            return res.status(500).json({
                success: false,
                error: "INVALID_TICKET_CATEGORY"
            });
        }

        const safeProduct = String(productTitle).slice(0, 200);
        const safePackage = String(packageName).slice(0, 200);
        const safePrice = String(price).slice(0, 50);

        // Create private ticket channel
        ticketChannel = await guild.channels.create({
            name: `order-${Date.now().toString().slice(-6)}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,

            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel
                    ]
                },
                {
                    id: buyer.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: FOUNDER_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: CO_OWNER_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });

        // Build order embed
        const embed = new EmbedBuilder()
            .setTitle("🛒 PREMIUM ORDER TICKET")
            .setDescription(
                "আপনার অর্ডার টিকিট সফলভাবে তৈরি হয়েছে!\n\n" +
                "নিচের নাম্বারে Send Money করে পেমেন্টের Screenshot ও TrxID দিন।"
            )
            .setColor("#00ff99")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: "📦 প্রোডাক্ট",
                    value: safeProduct,
                    inline: false
                },
                {
                    name: "⏳ মেয়াদ",
                    value: safePackage,
                    inline: true
                },
                {
                    name: "💰 মোট টাকা",
                    value: `${safePrice} BDT`,
                    inline: true
                },
                {
                    name: "👤 কাস্টমার",
                    value: `<@${buyer.id}>`,
                    inline: false
                },
                {
                    name: "💖 bKash Personal",
                    value: `\`${BKASH_NUMBER}\``,
                    inline: true
                },
                {
                    name: "🟧 Nagad Personal",
                    value: `\`${NAGAD_NUMBER}\``,
                    inline: true
                },
                {
                    name: "📌 পেমেন্ট করার নিয়ম",
                    value:
                        "১. bKash অথবা Nagad-এ Send Money করুন।\n" +
                        `২. ঠিক ${safePrice} টাকা পাঠান।\n` +
                        "৩. পেমেন্টের Screenshot ও TrxID এই চ্যানেলে পাঠান।",
                    inline: false
                }
            )
            .setFooter({
                text: "BANGLA FF PANEL • Secure Ticket System"
            })
            .setTimestamp();

        // Send order details to the ticket
        await ticketChannel.send({
            content:
                `📢 **নতুন অর্ডার এসেছে!**\n` +
                `<@&${FOUNDER_ROLE_ID}> <@&${CO_OWNER_ROLE_ID}>\n\n` +
                `হ্যালো <@${buyer.id}> 👋`,
            embeds: [embed]
        });

        // Direct link to the exact private ticket channel
        const ticketUrl =
            `https://discord.com/channels/${guild.id}/${ticketChannel.id}`;

        return res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            url: ticketUrl
        });

    } catch (error) {
        console.error("Ticket creation error:", error);

        // Delete incomplete ticket if creation partially failed
        if (ticketChannel) {
            try {
                await ticketChannel.delete(
                    "Cleaning up an incomplete order ticket"
                );
            } catch (cleanupError) {
                console.error("Ticket cleanup error:", cleanupError);
            }
        }

        return res.status(500).json({
            success: false,
            error: "TICKET_CREATION_FAILED"
        });
    }
});

// ================= START API SERVER =================

app.listen(PORT, () => {
    console.log(`BANGLA FF API running on port ${PORT}`);
});

// ================= LOGIN BOT =================

if (!DISCORD_TOKEN) {
    console.error("ERROR: DISCORD_TOKEN is missing from environment variables.");
} else {
    client.login(DISCORD_TOKEN).catch((error) => {
        console.error("Discord login failed:", error);
    });
}
