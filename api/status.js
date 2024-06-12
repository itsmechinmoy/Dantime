import { monitorWebsite } from './index.js'; // Import the monitoring function from index.js

export default async function handler(req, res) {
  try {
    // Call the monitoring function from index.js
    await monitorWebsite();

    // Return a success message indicating that the monitoring function was executed
    res.status(200).json({ message: 'Monitoring function executed successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error executing monitoring function:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
