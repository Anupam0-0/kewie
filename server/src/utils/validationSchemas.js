const { z } = require("zod");

// User Validation Schemas
const userRegistrationSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be less than 50 characters")
		.trim(),
	email: z
		.string()
		.email("Please enter a valid email address")
		.toLowerCase()
		.trim(),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(100, "Password must be less than 100 characters"),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters")
		.max(15, "Phone number must be less than 15 characters"),
	branch: z.string().trim().optional(),
});

const userLoginSchema = z.object({
	email: z
		.string()
		.email("Please enter a valid email address")
		.toLowerCase()
		.trim(),
	password: z.string().min(1, "Password is required"),
});

const userUpdateSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be less than 50 characters")
		.trim()
		.optional(),
	email: z
		.string()
		.email("Please enter a valid email address")
		.toLowerCase()
		.trim()
		.optional(),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters")
		.max(15, "Phone number must be less than 15 characters")
		.trim()
		.optional(),
	branch: z.string().trim().optional(),
	avatar: z.string().url("Avatar must be a valid URL").optional(),
});

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z
		.string()
		.min(6, "New password must be at least 6 characters")
		.max(100, "New password must be less than 100 characters"),
});

// Category Validation Schemas
const categoryCreateSchema = z.object({
	name: z
		.string()
		.min(2, "Category name must be at least 2 characters")
		.max(50, "Category name must be less than 50 characters")
		.trim(),
	description: z
		.string()
		.max(200, "Description must be less than 200 characters")
		.trim()
		.optional(),
});

const categoryUpdateSchema = z.object({
	name: z
		.string()
		.min(2, "Category name must be at least 2 characters")
		.max(50, "Category name must be less than 50 characters")
		.trim()
		.optional(),
	description: z
		.string()
		.max(200, "Description must be less than 200 characters")
		.trim()
		.optional(),
});

const bulkCategoryCreateSchema = z
	.array(categoryCreateSchema)
	.min(1, "At least one category is required")
	.max(10, "Cannot create more than 10 categories at once");

// Item Validation Schemas
const itemCreateSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(200, "Title must be less than 200 characters")
		.trim(),
	description: z
		.string()
		.max(2000, "Description must be less than 2000 characters")
		.trim()
		.optional(),
	price: z
		.number()
		.min(0, "Price must be non-negative")
		.max(1000000, "Price must be less than 1,000,000"),
	category: z
		.array(z.string())
		.min(1, "At least one category is required")
		.max(5, "Cannot select more than 5 categories"),
	condition: z.enum(["new", "like-new", "good", "fair", "poor"], {
		errorMap: () => ({
			message:
				"Condition must be one of: new, like-new, good, fair, poor",
		}),
	}),
	location: z
		.string()
		.min(3, "Location must be at least 3 characters")
		.max(100, "Location must be less than 100 characters")
		.trim(),
	negotiable: z.boolean().default(true),
});

const itemUpdateSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(200, "Title must be less than 200 characters")
		.trim()
		.optional(),
	description: z
		.string()
		.max(2000, "Description must be less than 2000 characters")
		.trim()
		.optional(),
	price: z
		.number()
		.min(0, "Price must be non-negative")
		.max(1000000, "Price must be less than 1,000,000")
		.optional(),
	category: z
		.array(z.string())
		.min(1, "At least one category is required")
		.max(5, "Cannot select more than 5 categories")
		.optional(),
	condition: z
		.enum(["new", "like-new", "good", "fair", "poor"], {
			errorMap: () => ({
				message:
					"Condition must be one of: new, like-new, good, fair, poor",
			}),
		})
		.optional(),
	location: z
		.string()
		.min(3, "Location must be at least 3 characters")
		.max(100, "Location must be less than 100 characters")
		.trim()
		.optional(),
	negotiable: z.boolean().optional(),
});

const itemStatusUpdateSchema = z.object({
	status: z.enum(["available", "sold", "reserved"], {
		errorMap: () => ({
			message: "Status must be one of: available, sold, reserved",
		}),
	}),
});

const itemFiltersSchema = z.object({
	category: z.string().optional(),
	minPrice: z.number().min(0).optional(),
	maxPrice: z.number().min(0).optional(),
	condition: z.enum(["new", "like-new", "good", "fair", "poor"]).optional(),
	status: z.enum(["available", "sold", "reserved"]).optional(),
	search: z.string().trim().optional(),
	negotiable: z.boolean().optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	sort: z
		.enum(["price", "-price", "createdAt", "-createdAt", "views", "-views"])
		.optional(),
});

// Review Validation Schemas
const reviewCreateSchema = z.object({
	targetType: z.enum(["user", "item"], {
		errorMap: () => ({
			message: 'Target type must be either "user" or "item"',
		}),
	}),
	target: z.string().min(1, "Target ID is required"),
	rating: z
		.number()
		.min(1, "Rating must be at least 1")
		.max(5, "Rating must be at most 5"),
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be less than 100 characters")
		.trim(),
	content: z
		.string()
		.min(10, "Content must be at least 10 characters")
		.max(1000, "Content must be less than 1000 characters")
		.trim(),
	images: z
		.array(
			z.object({
				imageUrl: z.string().url("Image URL must be a valid URL"),
				caption: z
					.string()
					.max(100, "Caption must be less than 100 characters")
					.trim()
					.optional(),
			})
		)
		.max(5, "Cannot upload more than 5 images")
		.optional(),
});

const reviewUpdateSchema = z.object({
	rating: z
		.number()
		.min(1, "Rating must be at least 1")
		.max(5, "Rating must be at most 5")
		.optional(),
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be less than 100 characters")
		.trim()
		.optional(),
	content: z
		.string()
		.min(10, "Content must be at least 10 characters")
		.max(1000, "Content must be less than 1000 characters")
		.trim()
		.optional(),
	images: z
		.array(
			z.object({
				imageUrl: z.string().url("Image URL must be a valid URL"),
				caption: z
					.string()
					.max(100, "Caption must be less than 100 characters")
					.trim()
					.optional(),
			})
		)
		.max(5, "Cannot upload more than 5 images")
		.optional(),
});

const reviewVoteSchema = z.object({
	isHelpful: z.boolean(),
});

const reviewModerationSchema = z.object({
	status: z.enum(["pending", "approved", "rejected"], {
		errorMap: () => ({
			message: "Status must be one of: pending, approved, rejected",
		}),
	}),
	moderationReason: z
		.string()
		.max(500, "Moderation reason must be less than 500 characters")
		.trim()
		.optional(),
});

const reviewFiltersSchema = z.object({
	status: z.enum(["pending", "approved", "rejected"]).optional(),
	rating: z.number().min(1).max(5).optional(),
	helpful: z.boolean().optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(50).default(10),
});

// Wishlist Validation Schemas
const wishlistAddSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
});

const bulkWishlistSchema = z.object({
	itemIds: z
		.array(z.string())
		.min(1, "At least one item ID is required")
		.max(10, "Cannot add more than 10 items at once"),
});

// Cart Validation Schemas
const cartAddSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
	quantity: z
		.number()
		.min(1, "Quantity must be at least 1")
		.max(10, "Quantity cannot exceed 10")
		.default(1),
});

const cartUpdateQuantitySchema = z.object({
	quantity: z
		.number()
		.min(1, "Quantity must be at least 1")
		.max(10, "Quantity cannot exceed 10"),
});

const bulkCartSchema = z.object({
	items: z
		.array(
			z.object({
				itemId: z.string().min(1, "Item ID is required"),
				quantity: z.number().min(1).max(10).default(1),
			})
		)
		.min(1, "At least one item is required")
		.max(10, "Cannot add more than 10 items at once"),
});

// Chat Validation Schemas
const chatCreateSchema = z.object({
	sellerId: z.string().min(1, "Seller ID is required"),
	itemId: z.string().min(1, "Item ID is required"),
});

const messageCreateSchema = z.object({
	content: z
		.string()
		.min(1, "Message content is required")
		.max(1000, "Message must be less than 1000 characters")
		.trim(),
	messageType: z.enum(["text", "image", "offer"]).default("text"),
	attachments: z
		.array(z.string().url())
		.max(5, "Cannot attach more than 5 files")
		.optional(),
	offerAmount: z
		.number()
		.min(0, "Offer amount must be non-negative")
		.optional(),
});

const chatFiltersSchema = z.object({
	status: z.enum(["active", "archived", "blocked"]).optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(50).default(10),
});

// Admin Validation Schemas
const userUpdateByAdminSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be less than 50 characters")
		.trim()
		.optional(),
	email: z
		.string()
		.email("Please enter a valid email address")
		.toLowerCase()
		.trim()
		.optional(),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters")
		.max(15, "Phone number must be less than 15 characters")
		.trim()
		.optional(),
	branch: z.string().trim().optional(),
	role: z.enum(["Student", "Admin"]).optional(),
	isVerified: z.boolean().optional(),
	isActive: z.boolean().optional(),
});

// Pagination and Query Schemas
const paginationSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
});

const searchSchema = z.object({
	query: z
		.string()
		.min(1, "Search query is required")
		.max(100, "Search query must be less than 100 characters")
		.trim(),
});

// ID Parameter Schemas
const idParamSchema = z.object({
	id: z
		.string()
		.min(1, "ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
});

const itemIdParamSchema = z.object({
	itemId: z
		.string()
		.min(1, "Item ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format"),
});

const categoryIdParamSchema = z.object({
	categoryId: z
		.string()
		.min(1, "Category ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
});

const reviewIdParamSchema = z.object({
	reviewId: z
		.string()
		.min(1, "Review ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid review ID format"),
});

const chatIdParamSchema = z.object({
	chatId: z
		.string()
		.min(1, "Chat ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid chat ID format"),
});

const userIdParamSchema = z.object({
	userId: z
		.string()
		.min(1, "User ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

const sellerIdParamSchema = z.object({
	sellerId: z
		.string()
		.min(1, "Seller ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid seller ID format"),
});

// Target ID and Type Schemas
const targetIdTypeSchema = z.object({
	targetId: z
		.string()
		.min(1, "Target ID is required")
		.regex(/^[0-9a-fA-F]{24}$/, "Invalid target ID format"),
	targetType: z.enum(["user", "item"], {
		errorMap: () => ({
			message: 'Target type must be either "user" or "item"',
		}),
	}),
});

module.exports = {
	// User schemas
	userRegistrationSchema,
	userLoginSchema,
	userUpdateSchema,
	changePasswordSchema,

	// Category schemas
	categoryCreateSchema,
	categoryUpdateSchema,
	bulkCategoryCreateSchema,

	// Item schemas
	itemCreateSchema,
	itemUpdateSchema,
	itemStatusUpdateSchema,
	itemFiltersSchema,

	// Review schemas
	reviewCreateSchema,
	reviewUpdateSchema,
	reviewVoteSchema,
	reviewModerationSchema,
	reviewFiltersSchema,

	// Wishlist schemas
	wishlistAddSchema,
	bulkWishlistSchema,

	// Cart schemas
	cartAddSchema,
	cartUpdateQuantitySchema,
	bulkCartSchema,

	// Chat schemas
	chatCreateSchema,
	messageCreateSchema,
	chatFiltersSchema,

	// Admin schemas
	userUpdateByAdminSchema,

	// Utility schemas
	paginationSchema,
	searchSchema,

	// Parameter schemas
	idParamSchema,
	itemIdParamSchema,
	categoryIdParamSchema,
	reviewIdParamSchema,
	chatIdParamSchema,
	userIdParamSchema,
	sellerIdParamSchema,
	targetIdTypeSchema,
};
