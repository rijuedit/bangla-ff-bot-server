
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

// ==================================================
// CONFIGURATION
// ==================================================

const SERVER_ID = "1560034399398142113";
const CATEGORY_ID = "1560064019325255701";

const FOUNDER_ROLE_ID = "1560738050743468135";
const CO_OWNER_ROLE_ID = "1560738926581252248";

const BKASH_NUMBER = "01869942698";
const NAGAD_NUMBER = "01624528622";

// PANEL LOGOS
const PC_LOGO_URL = "https://i.postimg.cc/vT10fNnJ/image.png";
const MOBILE_LOGO_URL = "https://i.postimg.cc/Gh8fyHJy/image.png";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 10000;

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`✅ BANGLA FF BOT online as ${client.user.tag}`);
});

// ==================================================
// API HOME
// ==================================================

app.get("/", (req, res) => {
    res.status(200).send(
        "BANGLA FF Bot API is Running Successfully!"
    );
});

// ==================================================
// FIND CUSTOMER IN DISCORD SERVER
// ==================================================

async function findCustomer(guild, input) {
    const value = String(input || "").trim();

    if (!value) {
        return { member: null, reason: "MISSING_CUSTOMER" };
    }

    // Exact Discord User ID
    if (/^\d{17,20}$/.test(value)) {
        try {
            const member = await guild.members.fetch(value);
            return { member, reason: null };
        } catch {
            return {
                member: null,
                reason: "MEMBER_NOT_FOUND"
            };
        }
    }

    // Search current server members
    try {
        const results = await guild.members.fetch({
            query: value,
            limit: 100
        });

        const query = value.toLowerCase();

        const exactMatches = results.filter((member) => {
            return (
                member.user.username.toLowerCase() === query ||
                (member.user.globalName || "").toLowerCase() === query ||
                member.displayName.toLowerCase() === query
            );
        });

        if (exactMatches.size === 1) {
            return {
                member: exactMatches.first(),
                reason: null
            };
        }

        if (exactMatches.size > 1) {
            return {
                member: null,
                reason: "USERNAME_NOT_UNIQUE"
            };
        }

        return {
            member: null,
            reason: "MEMBER_NOT_FOUND"
        };
    } catch (error) {
        console.error("Discord member search failed:", error);

        return {
            member: null,
            reason: "MEMBER_NOT_FOUND"
        };
    }
}

// ==================================================
// DETECT PANEL TYPE
// ==================================================

function detectPanelType(productTitle) {
    const text = String(productTitle || "").toLowerCase();

    const mobileKeywords = [
        "mobile",
        "phone",
        "android",
        "ios",
        "iphone",
        "মোবাইল"
    ];

    const pcKeywords = [
        "pc",
        "computer",
        "windows",
        "desktop",
        "পিসি"
    ];

    if (mobileKeywords.some(word => text.includes(word))) {
        return "mobile";
    }

    if (pcKeywords.some(word => text.includes(word))) {
        return "pc";
    }

    return "default";
}

// ==================================================
// CREATE ORDER EMBED
// ==================================================

function createOrderEmbed({
    panelType,
    product,
    duration,
    amount,
    buyer,
    client
}) {
    let title;
    let description;
    let color;
    let emoji;
    let platformName;

    let logoUrl = client.user.displayAvatarURL();

    if (panelType === "mobile") {
        title = "📱 MOBILE PANEL ORDER";

        description =
            "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
            "     📱 **MOBILE PANEL**\n" +
            "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
            "আপনার Mobile Panel অর্ডার তৈরি হয়েছে!\n" +
            "নিচের তথ্য দেখে পেমেন্ট সম্পন্ন করুন।";

        color = 0x9B59B6;
        emoji = "📱";
        platformName = "MOBILE PANEL";
        logoUrl = MOBILE_LOGO_URL;

    } else if (panelType === "pc") {
        title = "🖥️ PC PANEL ORDER";

        description =
            "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
            "     🖥️ **PC PANEL**\n" +
            "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
            "আপনার PC Panel অর্ডার তৈরি হয়েছে!\n" +
            "নিচের তথ্য দেখে পেমেন্ট সম্পন্ন করুন।";

        color = 0x3498DB;
        emoji = "🖥️";
        platformName = "PC PANEL";
        logoUrl = PC_LOGO_URL;

    } else {
        title = "🛒 PREMIUM ORDER TICKET";

        description =
            "আপনার অর্ডারটি সফলভাবে তৈরি হয়েছে!\n" +
            "নিচের পেমেন্ট তথ্য অনুসরণ করুন।";

        color = 0x00CC99;
        emoji = "📦";
        platformName = "PREMIUM ORDER";
    }

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setThumbnail(logoUrl)
        .addFields(
            {
                name: `${emoji} ━【 PLATFORM 】`,
                value: `**${platformName}**`,
                inline: false
            },
            {
                name: "📦 ━【 PRODUCT 】",
                value: `\`\`\`\n${product}\n\`\`\``,
                inline: false
            },
            {
                name: "⏳ ━【 PACKAGE / DURATION 】",
                value: `\`\`\`\n${duration}\n\`\`\``,
                inline: true
            },
            {
                name: "💰 ━【 TOTAL PRICE 】",
                value: `\`\`\`\n${amount} BDT\n\`\`\``,
                inline: true
            },
            {
                name: "👤 ━【 CUSTOMER DETAILS 】",
                value:
                    `**Username:** ${buyer.user.username}\n` +
                    `**User ID:** \`${buyer.id}\`\n` +
                    `**Customer:** <@${buyer.id}>`,
                inline: false
            },
            {
                name: "💗 ━【 bKash Personal 】",
                value: `\`\`\`\n${BKASH_NUMBER}\n\`\`\``,
                inline: true
            },
            {
                name: "🟠 ━【 Nagad Personal 】",
                value: `\`\`\`\n${NAGAD_NUMBER}\n\`\`\``,
                inline: true
            },
            {
                name: "📌 ━【 PAYMENT INSTRUCTIONS 】",
                value:
                    "```1. bKash অথবা Nagad নম্বর কপি করুন।\n" +
                    "2. Send Money থেকে সঠিক টাকা পাঠান।\n" +
                    "3. পেমেন্টের Screenshot ও TrxID পাঠান।```",
                inline: false
            },
            {
                name: "⚠️ ━【 IMPORTANT 】",
                value:
                    "পেমেন্ট করার আগে টাকার পরিমাণ যাচাই করুন।\n" +
                    "Staff যাচাই করার পর আপনার অর্ডার প্রসেস করা হবে।",
                inline: false
            }
        )
        .setFooter({
            text: `BANGLA FF PANEL • ${platformName} • Secure Ticket`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();
}

// ==================================================
// CREATE PRIVATE ORDER TICKET
// ==================================================

app.post("/create-ticket", async (req, res) => {
    let ticketChannel = null;

    try {
        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                error: "BOT_NOT_READY",
                message: "Bot is starting. Please try again."
            });
        }

        const {
            discordUserId,
            discordUsername,
            packageName,
            price,
            productTitle,
            category
        } = req.body || {};

        const customerInput = String(
            discordUsername || discordUserId || ""
        ).trim();

        if (!customerInput || customerInput.length > 100) {
            return res.status(400).json({
                success: false,
                error: "MISSING_CUSTOMER"
            });
        }

        if (
            typeof productTitle !== "string" ||
            !productTitle.trim() ||
            productTitle.length > 200
        ) {
            return res.status(400).json({
                success: false,
                error: "MISSING_ORDER_DETAILS"
            });
        }

        if (
            typeof packageName !== "string" ||
            !packageName.trim() ||
            packageName.length > 200 ||
            price === "" ||
            price === null ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                success: false,
                error: "MISSING_ORDER_DETAILS"
            });
        }

        // Fetch configured Discord server
        const guild = await client.guilds.fetch(SERVER_ID);

        // Customer must already be a server member
        const result = await findCustomer(guild, customerInput);

        if (!result.member) {
            const statusCode =
                result.reason === "USERNAME_NOT_UNIQUE" ? 409 : 403;

            return res.status(statusCode).json({
                success: false,
                error: result.reason || "MEMBER_NOT_FOUND"
            });
        }

        const buyer = result.member;

        // Verify ticket category
        const ticketCategory = await guild.channels.fetch(CATEGORY_ID);

        if (
            !ticketCategory ||
            ticketCategory.type !== ChannelType.GuildCategory
        ) {
            throw new Error("Configured ticket category is invalid.");
        }

        // Verify staff roles
        const founderRole = await guild.roles.fetch(FOUNDER_ROLE_ID);
        const coOwnerRole = await guild.roles.fetch(CO_OWNER_ROLE_ID);

        if (!founderRole || !coOwnerRole) {
            throw new Error("Founder or Co-owner role is missing.");
        }

        // Create private ticket channel
        const safeUsername = buyer.user.username
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 12) || "customer";

        const channelName =
            `order-${safeUsername}-${Date.now().toString().slice(-5)}`;

        ticketChannel = await guild.channels.create({
            name: channelName,
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
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                },
                {
                    id: FOUNDER_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                },
                {
                    id: CO_OWNER_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                }
            ]
        });

        const product = productTitle.trim();
        const duration = packageName.trim();
        const amount = Number(price).toLocaleString("en-US");

        // Category is the primary signal; title is the fallback.
        const orderCategory = String(category || "")
            .trim()
            .toLowerCase();

        const panelType =
            orderCategory === "mobile panel"
                ? "mobile"
                : ["buy pc panel", "pc panel"].includes(orderCategory)
                    ? "pc"
                    : detectPanelType(product);

        const embed = createOrderEmbed({
            panelType,
            product,
            duration,
            amount,
            buyer,
            client
        });

        // Notify staff and customer
        await ticketChannel.send({
            content:
                `📢 **NEW ${panelType.toUpperCase()} ORDER!**\n` +
                `<@&${FOUNDER_ROLE_ID}> <@&${CO_OWNER_ROLE_ID}>\n\n` +
                `হ্যালো <@${buyer.id}> 👋\n` +
                "আপনার অর্ডারের তথ্য ও পেমেন্ট নির্দেশনা নিচে দেওয়া হয়েছে।",

            embeds: [embed],

            allowedMentions: {
                users: [buyer.id],
                roles: [FOUNDER_ROLE_ID, CO_OWNER_ROLE_ID]
            }
        });

        const ticketUrl =
            `https://discord.com/channels/${guild.id}/${ticketChannel.id}`;

        return res.status(201).json({
            success: true,
            message: "Ticket created successfully.",
            url: ticketUrl,
            channelId: ticketChannel.id
        });

    } catch (error) {
        console.error("❌ Ticket creation error:", error);

        // Clean up incomplete ticket
        if (ticketChannel) {
            try {
                await ticketChannel.delete(
                    "Cleaning up incomplete order ticket"
                );
            } catch (cleanupError) {
                console.error(
                    "Ticket cleanup error:",
                    cleanupError
                );
            }
        }

        return res.status(500).json({
            success: false,
            error: "TICKET_CREATION_FAILED",
            message: "Could not create the ticket. Please try again later."
        });
    }
});

// ==================================================
// ERROR HANDLING
// ==================================================

app.use((error, req, res, next) => {
    console.error("API error:", error);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST"
    });
});

// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {
    console.log(`🚀 BANGLA FF API running on port ${PORT}`);
});

if (!DISCORD_TOKEN) {
    console.error(
        "❌ DISCORD_TOKEN is missing. Set it in your Render Environment Variables."
    );
} else {
    client.login(DISCORD_TOKEN).catch((error) => {
        console.error("❌ Discord login failed:", error);
    });
}
