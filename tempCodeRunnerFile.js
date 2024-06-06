const axios = require('axios');
const { WebhookClient, MessageEmbed } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const WEBSITE_URL = process.env.WEBSITE_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!WEBSITE_URL || !WEBHOOK_URL) {
    console.error("Please provide WEBSITE_URL and WEBHOOK_URL in the .env file.");
    process.exit(1);
}

const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
let previousStatus = null; // Variable to store the previous status

function sendDiscordMessage(title, description, color, timestamp) {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp(timestamp);

    webhookClient.send({ embeds: [embed] })
        .then(() => console.log("Discord message sent successfully."))
        .catch(error => console.error("Failed to send Discord message:", error));
}

async function monitorWebsite() {
    while (true) {
        try {
            const response = await axios.get(WEBSITE_URL);
            console.log("Website is available.");
            if (previousStatus !== "up") {
                // If previous status was not "up", it means status changed to "up"
                sendDiscordMessage(
                    "Dantotsu is Available",
                    "Available",
                    '#dedede',
                    new Date()
                );
                previousStatus = "up";
            }
        } catch (error) {
            console.error("Website is down:", error.message);
            if (previousStatus !== "down") {
                // If previous status was not "down", it means status changed to "down"
                sendDiscordMessage(
                    "Dantotsu is Reporting Error",
                    `HTTP ERROR ${error.response ? error.response.status : 'Unknown'}`,
                    '#dedede',
                    new Date()
                );
                previousStatus = "down";
            }
        }
        await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
    }
}

console.log("Starting website monitoring...");
monitorWebsite();