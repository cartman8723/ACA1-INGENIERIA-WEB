require("dotenv").config();
const { sendRegistrationEmail } = require("./utils/email");

sendRegistrationEmail("carolcarva7@gmail.com", "Prueba SmartCV");
