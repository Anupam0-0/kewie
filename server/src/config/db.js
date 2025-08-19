const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		mongoose.connect(process.env.MONGODB_URI);
		console.log("DB connected");
	} catch (error) {
		console.error("DB connection failed", error.message);
		process.exit(1);
	}
};

module.exports = connectDB;
