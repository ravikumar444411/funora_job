require("../config/loadEnv");
require("../config/db")();

require("./whatsappMessage.worker");

console.log("WhatsApp worker server started");
