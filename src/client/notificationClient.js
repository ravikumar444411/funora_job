const axios = require("axios");
require("../config/loadEnv");

const EVENT_SERVICE_BASE_URL = process.env.EVENT_SERVICE_BASE_URL;


exports.sendNotification = async (user, eventData) => {
    try {
        const payload = {
            userId: user._id, // required for notification
            eventId: eventData.eventId,
            title: eventData.title,
            body: eventData.body,
            type: eventData.type,
            imageUrl: eventData.imageUrl,
            deepLink: eventData.deepLink,
            status: eventData.status,
            priority: eventData.priority,
            source: eventData.source,
            metadata: eventData.metadata
        };

        // Call your notification API
        await axios.post(`${EVENT_SERVICE_BASE_URL}/api/notification/send`, payload, {
            headers: { "Content-Type": "application/json" }
        });

        console.log(`✅ Notification sent to ${user.fullName} (${user.email})`);
    } catch (error) {
        console.error(`❌ Failed to send notification to ${user.fullName}:`, error.message);
        throw error; // Let the queue retry
    }
}
