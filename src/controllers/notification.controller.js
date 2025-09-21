const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Attendee = require("../models/attendee.model");

// Endpoint to send bulk notification
exports.bulkPushNotification = async (jobName, eventData, userId) => {
    try {
        let users = [];

        if (userId) {
            // ✅ Directly push the given userId
            users = [{ _id: userId }];
        } else {
            // ✅ Fallback: Fetch all active users

            if (jobName === "new_event_added_job") {
                users = await User.find({ status: "active" }).select("_id");

            } else if (jobName === "update_event_added_job") {
                const attendees = await Attendee.find({ eventId: eventData.eventId, isActive: true })
                    .select("userId"); // fetch only userId
                // Transform into the desired format
                users = attendees.map(att => ({ _id: att.userId }));
            }
        }

        if (!users.length) {
            console.log("⚠️ No users found");
            return [];
        }

        const results = [];
        const chunkSize = 500; // batch insert size

        for (let i = 0; i < users.length; i += chunkSize) {
            const userChunk = users.slice(i, i + chunkSize);

            // Prepare notifications
            const bulkNotifications = userChunk.map(user => ({
                userId: user._id,
                eventId: eventData.eventId,
                title: eventData.title,
                body: eventData.body,
                type: eventData.type,
                imageUrl: eventData.imageUrl,
                deepLink: eventData.deepLink,
                status: eventData.status || "sent",
                priority: eventData.priority || "low",
                source: eventData.source || "system",
                metadata: eventData.metadata || {},
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            // Insert into DB
            const inserted = await Notification.insertMany(bulkNotifications);
            results.push(...inserted);
        }

        console.log("✅ Bulk notification process completed");
        return results;
    } catch (error) {
        console.error("❌ Error in bulkPushNotification:", error);
        throw error;
    }
};



