const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
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
        GatewayIntentBits.GuildMembers,
    ]
});

// টোকেনটি Render এর Environment থেকে অটোমেটিক আসবে
const TOKEN = process.env.DISCORD_TOKEN; 
const GUILD_ID = '1560034399398142113';
const CATEGORY_ID = '1560064623430864987';

client.once('ready', () => {
    console.log(`Bot is logged in as ${client.user.tag}`);
});

app.post('/create-ticket', async (req, res) => {
    const { userName, panelName, price } = req.body;
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const channel = await guild.channels.create({
            name: `ticket-${userName.replace(/\s+/g, '-').toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ],
        });

        const embed = new EmbedBuilder()
            .setColor('#7000FF')
            .setTitle('New Purchase Ticket')
            .setDescription(`হ্যালো **${userName}**, BANGLA FF PANEL এ আপনাকে স্বাগতম।`)
            .addFields(
                { name: 'Selected Panel', value: panelName, inline: true },
                { name: 'Price', value: price, inline: true }
            )
            .setTimestamp();

        await channel.send({ content: `@everyone নতুন টিকিট খোলা হয়েছে!`, embeds: [embed] });
        res.status(200).send({ success: true, url: `https://discord.com/channels/${GUILD_ID}/${channel.id}` });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

client.login(TOKEN);
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
