const axios = require('axios');
const { WebhookClient, MessageEmbed } = require('discord.js');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const WEBSITE_URL = process.env.WEBSITE_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MONGODB_URI = process.env.MONGODB_URI;

if (!WEBSITE_URL || !WEBHOOK_URL || !MONGODB_URI) {
    console.error("Please provide WEBSITE_URL, WEBHOOK_URL, and MONGODB_URI in the .env file.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    });

const messageSchema = new mongoose.Schema({
    status: String,
    messageId: String,
    timestamp: Date
});

const Message = mongoose.model('Message', messageSchema);

const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
let previousStatus = null; // Variable to store the previous status

async function sendDiscordMessage(title, description, color, timestamp) {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp(timestamp);

    try {
        const message = await webhookClient.send({ embeds: [embed] });
        console.log("Discord message sent successfully. Message ID:", message.id);
        return message.id; // Return the message ID
    } catch (error) {
        console.error("Failed to send Discord message:", error);
        return null;
    }
}

async function getPreviousMessage(status) {
    try {
        return await Message.findOne({ status });
    } catch (error) {
        console.error("Failed to get previous message from database:", error);
        return null;
    }
}

async function saveMessage(status, messageId) {
    try {
        // Remove any existing message for this status
        await Message.deleteOne({ status });

        // Save the new message
        const message = new Message({ status, messageId, timestamp: new Date() });
        await message.save();
        console.log("Message saved to database. Status:", status, "Message ID:", messageId);
    } catch (error) {
        console.error("Failed to save message to database:", error);
    }
}

async function deleteMessage(status) {
    try {
        await Message.deleteOne({ status });
        console.log("Message deleted from database. Status:", status);
    } catch (error) {
        console.error("Failed to delete message from database:", error);
    }
}

async function checkMessageExists(messageId) {
    try {
        const message = await webhookClient.fetchMessage(messageId);
        console.log("Message exists. ID:", messageId);
        return message !== null;
    } catch (error) {
        if (error.code === 10008) { // Unknown Message error code
            console.log("Message does not exist. ID:", messageId);
            return false;
        } else {
            console.error("Error fetching message:", error);
            return true; // Assuming message exists if other errors occur
        }
    }
}

async function monitorWebsite() {
    while (true) {
        try {
            const response = await axios.get(WEBSITE_URL);
            console.log("Website is available.");
            if (previousStatus !== "up") {
                console.log("Status changed to up. Sending new message.");
                const messageId = await sendDiscordMessage(
                    "Dantotsu is Available",
                    "Available",
                    '#dedede',
                    new Date()
                );
                if (messageId) {
                    await saveMessage("up", messageId);
                }
                previousStatus = "up";
            } else {
                const previousMessage = await getPreviousMessage("up");
                if (previousMessage) {
                    const exists = await checkMessageExists(previousMessage.messageId);
                    if (!exists) {
                        console.log("Previous message deleted. Resending message.");
                        const messageId = await sendDiscordMessage(
                            "Dantotsu is Available",
                            "Available",
                            '#dedede',
                            new Date()
                        );
                        if (messageId) {
                            await saveMessage("up", messageId);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Website is down:", error.message);
            if (previousStatus !== "down") {
                console.log("Status changed to down. Sending new message.");
                const messageId = await sendDiscordMessage(
                    "Dantotsu is Reporting Error",
                    `HTTP ERROR ${error.response ? error.response.status : 'Unknown'}`,
                    '#dedede',
                    new Date()
                );
                if (messageId) {
                    await saveMessage("down", messageId);
                }
                previousStatus = "down";
            } else {
                const previousMessage = await getPreviousMessage("down");
                if (previousMessage) {
                    const exists = await checkMessageExists(previousMessage.messageId);
                    if (!exists) {
                        console.log("Previous message deleted. Resending message.");
                        const messageId = await sendDiscordMessage(
                            "Dantotsu is Reporting Error",
                            `HTTP ERROR ${error.response ? error.response.status : 'Unknown'}`,
                            '#dedede',
                            new Date()
                        );
                        if (messageId) {
                            await saveMessage("down", messageId);
                        }
                    }
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
    }
}

console.log("Starting website monitoring...");
monitorWebsite();
