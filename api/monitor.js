const axios = require('axios');
const { WebhookClient, MessageEmbed } = require('discord.js');

const WEBSITE_URL = process.env.WEBSITE_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
let previousStatus = null; // Variable to store the previous status
let previousMessageId = null; // Variable to store the previous message ID

async function sendDiscordMessage(title, description, color, timestamp) {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp(timestamp);

    try {
        const message = await webhookClient.send({ embeds: [embed] });
        console.log("Discord message sent successfully.");
        return message.id; // Return the message ID
    } catch (error) {
        console.error("Failed to send Discord message:", error);
        return null;
    }
}

async function checkMessageExists(messageId) {
    try {
        const message = await webhookClient.fetchMessage(messageId);
        return message !== null;
    } catch (error) {
        if (error.code === 10008) { // Unknown Message error code
            return false;
        } else {
            console.error("Error fetching message:", error);
            return true; // Assuming message exists if other errors occur
        }
    }
}

async function monitorWebsite(req, res) {
    try {
        const response = await axios.get(WEBSITE_URL);
        console.log("Website is available.");
        if (previousStatus !== "up") {
            // If previous status was not "up", it means status changed to "up"
            previousMessageId = await sendDiscordMessage(
                "Dantotsu is Available",
                "Available",
                '#dedede',
                new Date()
            );
            previousStatus = "up";
        } else if (previousMessageId) {
            const exists = await checkMessageExists(previousMessageId);
            if (!exists) {
                // Resend the message if the previous message is deleted
                previousMessageId = await sendDiscordMessage(
                    "Dantotsu is Available",
                    "Available",
                    '#dedede',
                    new Date()
                );
            }
        }
    } catch (error) {
        console.error("Website is down:", error.message);
        if (previousStatus !== "down") {
            // If previous status was not "down", it means status changed to "down"
            previousMessageId = await sendDiscordMessage(
                "Dantotsu is Reporting Error",
                `HTTP ERROR ${error.response ? error.response.status : 'Unknown'}`,
                '#dedede',
                new Date()
            );
            previousStatus = "down";
        } else if (previousMessageId) {
            const exists = await checkMessageExists(previousMessageId);
            if (!exists) {
                // Resend the message if the previous message is deleted
                previousMessageId = await sendDiscordMessage(
                    "Dantotsu is Reporting Error",
                    `HTTP ERROR ${error.response ? error.response.status : 'Unknown'}`,
                    '#dedede',
                    new Date()
                );
            }
        }
    }
    res.status(200).send('Monitoring completed');
}

module.exports = (req, res) => monitorWebsite(req, res);
