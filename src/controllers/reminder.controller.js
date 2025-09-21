const reminderQueue = require("../queue/reminderQueue"); // your BullMQ queue

exports.createReminderQueue = async (req, res) => {
    try {
        const eventData = req.body;

        // Validate required fields
        if (!eventData.eventId || !eventData.title || !eventData.body || !eventData.eventDateFrom) {
            return res.status(400).json({ message: "❌ Missing required fields" });
        }

        let eventStartTime;

        if (eventData.eventTimeFrom) {
            // Case 1: eventTimeFrom in HH:mm format
            const [hours, minutes] = eventData.eventTimeFrom.split(":").map(Number);
            const eventDate = new Date(eventData.eventDateFrom);
            eventDate.setHours(hours, minutes, 0, 0);
            eventStartTime = eventDate.getTime();
        } else {
            // Case 2: Only eventDateFrom is given
            eventStartTime = new Date(eventData.eventDateFrom).getTime();
        }

        const now = Date.now();
        const fourHoursBefore = eventStartTime - 4 * 60 * 60 * 1000;
        // let delay = fourHoursBefore - now;
        let delay = 2 * 60 * 1000; // 2

        if (delay < 0) {
            return res.status(400).json({ message: "Event already started or less than 4 hours left" });
        }


        let priorityLevel;
        if (eventData.priority === "high") priorityLevel = 1;
        else if (eventData.priority === "medium") priorityLevel = 3;
        else priorityLevel = 5;
        // Add reminder job to queue with delay
        await reminderQueue.add(
            "new_event_reminder_added_job",
            {
                userId: eventData.userId,
                eventId: eventData.eventId,
                title: eventData.title,
                body: eventData.body,
                type: eventData.type || "reminder",
                imageUrl: eventData.imageUrl || null,
                deepLink: eventData.deepLink || null,
                status: eventData.status || "pending",
                priority: eventData.priority || "high",
                source: eventData.source || "system",
                metadata: eventData.metadata || {}
            },
            {
                delay, // job will run at (eventStartTime - 4 hours)
                attempts: 1,
                removeOnComplete: { age: 3600 }, // remove 1 hr after completion
                removeOnFail: false,
                priority: priorityLevel
            }
        );

        res.status(200).json({
            message: "✅ Reminder queued successfully!",
            scheduledFor: new Date(fourHoursBefore),
        });
    } catch (error) {
        console.error("❌ Error adding reminder to queue:", error);
        res.status(500).json({ message: "Server error" });
    }
};

