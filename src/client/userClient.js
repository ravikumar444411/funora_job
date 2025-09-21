const axios = require("axios");
require("../config/loadEnv");

const EVENT_SERVICE_BASE_URL = process.env.EVENT_SERVICE_BASE_URL;

exports.getAllUsers = async () => {
    try {
        const response = await axios.get(`${EVENT_SERVICE_BASE_URL}/api/users/`);

        if (response.data && response.data.success) {
            return response.data.data; // array of user objects
        } else {
            console.error("❌ Failed to fetch users:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("❌ Error fetching users:", error.message);
        return [];
    }
}

