const monitorWebsite = require('./api/monitor.js');

// Handle incoming HTTP requests
module.exports = async (req, res) => {
    try {
        await monitorWebsite();
        res.status(200).send('Monitoring started successfully.');
    } catch (error) {
        console.error('Error starting monitoring:', error);
        res.status(500).send('Internal server error.');
    }
};
