
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

const SERVER_ID = "1560034399398142113";
const CATEGORY_ID = "1560064019325255701";
const FOUNDER_ROLE_ID = "1560738050743468135";
const CO_OWNER_ROLE_ID = "1560738926581252248";

const BKASH_NUMBER = "01869942698";
const NAGAD_NUMBER = "01624528622";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 10000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`BANGLA FF BOT online as ${client.user.tag}`);
});

app.get("/", (req, res) => {
    res.send("BANGLA FF Bot API is Running Successfully!");
});

app.post("/create-ticket", async (req, res) => {
    let ticketChannel;

    try {
        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                error: "BOT_NOT_READY"
            });
        }

        const { discordUserId, packageName, price, productTitle } =
            req.body || {};

        const customerInput = String(discordUserId || "").trim();

        if (!customerInput || customerInput.length > 100) {
            return res.status(400).json({
                success: false,
                error: "MISSING_CUSTOMER"
            });
        }

        if (
            !productTitle ||
            !packageName ||
            price === undefined ||
            price === null ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return res.status(400).json({
                success: false,
                error: "MISSING_ORDER_DETAILS"
            });
        }

        const guild = await client.guilds.fetch(SERVER_ID);

        let buyer = null;

        // First try an exact numeric Discord ID.
        if (/^\d{17,20}$/.test(customerInput)) {
            try {
                buyer = await guild.members.fetch(customerInput);
            } catch {
                buyer = null;
            }
        } else {
            // Search server members by username/display name/nickname.
            try {
                const results = await guild.members.fetch({
                    query: customerInput,
                    limit: 100
                });

                const query = customerInput.toLowerCase();

                const exactMatches = results.filter(member => {
                    const user = member.user;

                    return (
                        user.username.toLowerCase() === query ||
                        user.globalName?.toLowerCase() === query ||
                        member.displayName.toLowerCase() === query
                    );
                });

                if (exactMatches.size === 1) {
                    buyer = exactMatches.first();
                } else if (exactMatches.size > 1) {
                    return res.status(409).json({
                        success: false,
                        error: "USERNAME_NOT_UNIQUE"
                    });
                }
            } catch (error) {
                console.error("Member search error:", error);
            }
        }

        if (!buyer) {
            return res.status(403).json({
                success: false,
                error: "MEMBER_NOT_FOUND"
            });
        }

        const category = await guild.channels.fetch(CATEGORY_ID);

        if (!category || category.type !== ChannelType.GuildCategory) {
            throw new Error("Ticket category is missing or invalid.");
        }

        const founderRole = await guild.roles.fetch(FOUNDER_ROLE_ID);
        const coOwnerRole = await guild.roles.fetch(CO_OWNER_ROLE_ID);

        if (!founderRole || !coOwnerRole) {
            throw new Error("Founder or Co-owner role was not found.");
        }

        ticketChannel = await guild.channels.create({
            name: `order-${Date.now().toString().slice(-6)}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
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

        const product = String(productTitle).slice(0, 200);
        const duration = String(packageName).slice(0, 200);
        const amount = String(price).slice(0, 50);

        const embed = new EmbedBuilder()
            .setTitle("🛒 PREMIUM ORDER TICKET")
            .setDescription(
                "আপনার অর্ডার তৈরি হয়েছে!\n" +
                "পেমেন্ট করে Screenshot ও TrxID এই চ্যানেলে পাঠান।"
            )
            .setColor("#00ff99")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "📦 প্রোডাক্ট", value: product },
                { name: "⏳ মেয়াদ", value: duration, inline: true },
                { name: "💰 মোট টাকা", value: `${amount} BDT`, inline: true },
                { name: "👤 কাস্টমার", value: `<@${buyer.id}>` },
                { name: "💖 bKash Personal", value: BKASH_NUMBER, inline: true },
                { name: "🟧 Nagad Personal", value: NAGAD_NUMBER, inline: true },
                {
                    name: "📌 পেমেন্ট করার নিয়ম",
                    value:
                        `১. bKash অথবা Nagad-এ Send Money করুন।\n` +
                        `২. ${amount} টাকা পাঠান।\n` +
                        "৩. Screenshot ও TrxID এই Ticket-এ দিন।"
                }
            )
            .setFooter({ text: "BANGLA FF PANEL • Secure Ticket System" })
            .setTimestamp();

        await ticketChannel.send({
            content:
                `📢 নতুন অর্ডার! <@&${FOUNDER_ROLE_ID}> <@&${CO_OWNER_ROLE_ID}>\n` +
                `হ্যালো <@${buyer.id}> 👋`,
            embeds: [embed]
        });

        return res.status(201).json({
            success: true,
            url: `https://discord.com/channels/${guild.id}/${ticketChannel.id}`
        });

    } catch (error) {
        console.error("Ticket creation error:", error);

        if (ticketChannel) {
            try {
                await ticketChannel.delete("Incomplete ticket cleanup");
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

app.listen(PORT, () => {
    console.log(`BANGLA FF API running on port ${PORT}`);
});

if (!DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN is missing from environment variables.");
} else {
    client.login(DISCORD_TOKEN).catch(console.error);
}
