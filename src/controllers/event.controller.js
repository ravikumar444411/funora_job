const eventQueue = require("../queue/eventQueue");

// this is use for create and update event alert
exports.createAndUpdateEventQueue = async (req, res) => {
    try {
        const eventData = req.body;
        let jobName = "new_event_added_job"
        if (eventData.useFor === "UPDATE_EVENT_NOTIFICATION") {
            jobName = "update_event_added_job"
        }

        // Validate required fields
        if (!eventData.eventId || !eventData.title || !eventData.body) {
            return res.status(400).json({ message: "Missing required fields" });
        }


        let priorityLevel;
        if (eventData.priority === "high") priorityLevel = 1;
        else if (eventData.priority === "medium") priorityLevel = 3;
        else priorityLevel = 5;
        // Add notification data to queue
        await eventQueue.add(
            jobName,
            {
                eventId: eventData.eventId,
                title: eventData.title,
                body: eventData.body,
                type: eventData.type || "general",
                imageUrl: eventData.imageUrl || null,
                deepLink: eventData.deepLink || null,
                status: eventData.status || "pending",
                priority: eventData.priority || "low",
                source: eventData.source || "system",
                metadata: eventData.metadata || {}
            },
            {
                attempts: 1, // retry up to 1 times
                removeOnComplete: { age: 3600 }, // remove after 1 hour,
                removeOnFail: false,
                priority: priorityLevel
            }
        );

        res.status(200).json({ message: "✅ Notification queued successfully!" });
    } catch (error) {
        console.error("❌ Error adding notification to queue:", error);
        res.status(500).json({ message: "Server error" });
    }
};
