const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const itemRoutes = require("./routes/item.route");
// const chatRoutes = require("./routes/chat.route");
// const protectedRoutes = require("./routes/protected");
const { errorHandler } = require("./middlewares/error.middleware");
const rateLimit = require("express-rate-limit");

dotenv.config();
connectDB();

const app = express();
const PORT = 3000 || process.env.PORT;

// Basic security middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Logging in dev only.
if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 20,
	message: { error: "Too many requests, try again later." },
});
app.use("/api/auth", authLimiter);

// // Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
// // app.use("/api/chats", chatRoutes);


// // Global error handler
app.use(errorHandler);

app.listen(PORT, console.log(`App is running in PORT : ${PORT}`));
