// Import required modules
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

// Import custom modules
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.route");
const itemRoutes = require("./routes/item.route");
// const chatRoutes = require("./routes/chat.route");
// const protectedRoutes = require("./routes/protected");
const { errorHandler } = require("./middlewares/error.middleware");
const { protect } = require("./middlewares/auth.middleware");

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize Express app
const app = express();

// Set server port
const PORT = process.env.PORT || 3000;

// Middleware: Enable CORS for all routes
app.use(cors());

// Middleware: Set security-related HTTP headers
app.use(helmet());

// Middleware: Parse incoming JSON requests
app.use(express.json());

// Middleware: Parse cookies from incoming requests
app.use(cookieParser());

// Middleware: HTTP request logger (only in development)
if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}

// Rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute window
	max: 20, // limit each IP to 20 requests per windowMs
	message: { error: "Too many requests, try again later." },
});
app.use("/api/auth", authLimiter);

// Routes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/listings", itemRoutes); // Item/listing routes
// app.use("/api/chats", chatRoutes); // Chat routes (uncomment if needed)
// app.use("/api/protected", protectedRoutes); // Protected routes (uncomment if needed)

// Test route for backend status
app.get("/", (req, res) => {
	console.log("Hi from Backend!");
	res.send("Hi from Backend!");
});

// Example protected route
app.get("/protect", protect, (req, res) => {
	console.log("Sup from protected Backend!", req.user);
	res.json({ message: "Sup from protected Backend!", user: req.user });
});

// Global error handler middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on PORT: ${PORT}`);
});
