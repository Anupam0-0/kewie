# 🔒 Zod Validation Implementation

This document explains the comprehensive Zod validation implementation throughout the Kewie marketplace application.

## 📋 Overview

Zod is a TypeScript-first schema declaration and validation library that provides:
- **Runtime type checking** with excellent TypeScript integration
- **Automatic error messages** with detailed validation feedback
- **Schema composition** for complex validation rules
- **Type inference** for TypeScript support

## 🏗️ Architecture

### 1. Validation Schemas (`src/utils/validationSchemas.js`)

All validation schemas are centralized in one file for easy maintenance and reuse.

#### User Validation Schemas
```javascript
const userRegistrationSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters')
        .trim(),
    email: z.string()
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
    phone: z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be less than 15 characters')
        .trim(),
    branch: z.string()
        .optional()
        .trim()
});
```

#### Item Validation Schemas
```javascript
const itemCreateSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be less than 200 characters')
        .trim(),
    description: z.string()
        .max(2000, 'Description must be less than 2000 characters')
        .trim()
        .optional(),
    price: z.number()
        .min(0, 'Price must be non-negative')
        .max(1000000, 'Price must be less than 1,000,000'),
    category: z.array(z.string())
        .min(1, 'At least one category is required')
        .max(5, 'Cannot select more than 5 categories'),
    condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']),
    location: z.string()
        .min(3, 'Location must be at least 3 characters')
        .max(100, 'Location must be less than 100 characters')
        .trim(),
    negotiable: z.boolean()
        .default(true)
});
```

#### Review Validation Schemas
```javascript
const reviewCreateSchema = z.object({
    targetType: z.enum(['user', 'item']),
    target: z.string()
        .min(1, 'Target ID is required'),
    rating: z.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters')
        .trim(),
    content: z.string()
        .min(10, 'Content must be at least 10 characters')
        .max(1000, 'Content must be less than 1000 characters')
        .trim(),
    images: z.array(z.object({
        imageUrl: z.string().url('Image URL must be a valid URL'),
        caption: z.string().max(100).trim().optional()
    }))
    .max(5, 'Cannot upload more than 5 images')
    .optional()
});
```

### 2. Validation Middleware (`src/middlewares/validation.middleware.js`)

The validation middleware provides flexible validation for different request parts:

#### Generic Validation Middleware
```javascript
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            let data;
            
            switch (target) {
                case 'body':
                    data = req.body;
                    break;
                case 'query':
                    data = req.query;
                    break;
                case 'params':
                    data = req.params;
                    break;
                default:
                    data = req.body;
            }

            // Parse and validate the data
            const validatedData = schema.parse(data);
            
            // Replace the original data with validated data
            switch (target) {
                case 'body':
                    req.body = validatedData;
                    break;
                case 'query':
                    req.query = validatedData;
                    break;
                case 'params':
                    req.params = validatedData;
                    break;
            }
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod validation errors
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                
                return res.status(400).json({
                    error: 'Validation failed',
                    message: 'Please check your input data',
                    details: formattedErrors
                });
            }
            
            // Handle other errors
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'An error occurred during validation'
            });
        }
    };
};
```

#### Specialized Validation Functions
```javascript
// Validate request body
const validateBody = (schema) => validate(schema, 'body');

// Validate request query parameters
const validateQuery = (schema) => validate(schema, 'query');

// Validate request parameters
const validateParams = (schema) => validate(schema, 'params');

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({
                error: 'Missing parameter',
                message: `${paramName} parameter is required`
            });
        }
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                error: 'Invalid ID format',
                message: `${paramName} must be a valid MongoDB ObjectId`
            });
        }
        
        next();
    };
};
```

## 🛣️ Route Implementation

### Authentication Routes
```javascript
// Public routes
router.post("/register", validateBody(userRegistrationSchema), register);
router.post("/login", validateBody(userLoginSchema), login);

// Protected routes
router.put("/profile", protect, validateBody(userUpdateSchema), updateProfile);
router.put("/change-password", protect, validateBody(changePasswordSchema), changePassword);
```

### Item Routes
```javascript
// Public routes
router.get("/", validateQuery(itemFiltersSchema), getItems);
router.get("/:itemId", validateParams(itemIdParamSchema), getItemById);

// Protected routes
router.post("/", protect, validateBody(itemCreateSchema), createItem);
router.put("/:itemId", protect, validateParams(itemIdParamSchema), validateBody(itemUpdateSchema), updateItemById);
router.patch("/:itemId/status", protect, validateParams(itemIdParamSchema), validateBody(itemStatusUpdateSchema), updateStatusById);
```

### Category Routes
```javascript
// Public routes
router.get("/search", validateQuery(searchSchema), searchCategories);
router.get("/:categoryId", validateParams(categoryIdParamSchema), getCategoryById);

// Admin routes
router.post("/", protect, requireRole("Admin"), validateBody(categoryCreateSchema), createCategory);
router.post("/bulk", protect, requireRole("Admin"), validateBody(bulkCategoryCreateSchema), bulkCreateCategories);
router.put("/:categoryId", protect, requireRole("Admin"), validateParams(categoryIdParamSchema), validateBody(categoryUpdateSchema), updateCategory);
```

### Wishlist Routes
```javascript
router.get("/category/:categoryId", validateParams(categoryIdParamSchema), getWishlistByCategory);
router.get("/check/:itemId", validateParams(itemIdParamSchema), checkWishlistStatus);
router.post("/", validateBody(wishlistAddSchema), addToWishlist);
router.post("/bulk", validateBody(bulkWishlistSchema), bulkAddToWishlist);
router.delete("/:itemId", validateParams(itemIdParamSchema), removeFromWishlist);
router.post("/:itemId/move-to-cart", validateParams(itemIdParamSchema), moveToCart);
```

### Cart Routes
```javascript
router.get("/seller/:sellerId", validateParams(sellerIdParamSchema), getCartBySeller);
router.get("/check/:itemId", validateParams(itemIdParamSchema), checkCartStatus);
router.post("/", validateBody(cartAddSchema), addToCart);
router.post("/bulk", validateBody(bulkCartSchema), bulkAddToCart);
router.put("/:itemId/quantity", validateParams(itemIdParamSchema), validateBody(cartUpdateQuantitySchema), updateCartItemQuantity);
router.delete("/:itemId", validateParams(itemIdParamSchema), removeFromCart);
router.post("/:itemId/move-to-wishlist", validateParams(itemIdParamSchema), moveToWishlist);
```

## 🔍 Validation Features

### 1. Input Sanitization
- **Automatic trimming** of string inputs
- **Case normalization** (email to lowercase)
- **Type coercion** where appropriate
- **Default values** for optional fields

### 2. Comprehensive Validation
- **Required field validation**
- **Length constraints** (min/max)
- **Format validation** (email, URL, ObjectId)
- **Enum validation** for predefined values
- **Array validation** with size limits
- **Nested object validation**

### 3. Error Handling
```javascript
// Example error response
{
    "error": "Validation failed",
    "message": "Please check your input data",
    "details": [
        {
            "field": "email",
            "message": "Please enter a valid email address",
            "code": "invalid_string"
        },
        {
            "field": "price",
            "message": "Price must be non-negative",
            "code": "too_small"
        }
    ]
}
```

### 4. Parameter Validation
```javascript
// MongoDB ObjectId validation
const itemIdParamSchema = z.object({
    itemId: z.string()
        .min(1, 'Item ID is required')
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format')
});

// Target ID and type validation
const targetIdTypeSchema = z.object({
    targetId: z.string()
        .min(1, 'Target ID is required')
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID format'),
    targetType: z.enum(['user', 'item'], {
        errorMap: () => ({ message: 'Target type must be either "user" or "item"' })
    })
});
```

## 🧪 Testing Validation

### Test Invalid Registration
```bash
POST /api/auth/register
{
    "name": "a",  // Too short
    "email": "invalid-email",  // Invalid format
    "password": "123",  // Too short
    "phone": "123"  // Too short
}
```

**Response:**
```json
{
    "error": "Validation failed",
    "message": "Please check your input data",
    "details": [
        {
            "field": "name",
            "message": "Name must be at least 2 characters",
            "code": "too_small"
        },
        {
            "field": "email",
            "message": "Please enter a valid email address",
            "code": "invalid_string"
        },
        {
            "field": "password",
            "message": "Password must be at least 6 characters",
            "code": "too_small"
        },
        {
            "field": "phone",
            "message": "Phone number must be at least 10 characters",
            "code": "too_small"
        }
    ]
}
```

### Test Invalid Item Creation
```bash
POST /api/items
{
    "title": "ab",  // Too short
    "price": -100,  // Negative price
    "category": [],  // Empty array
    "condition": "excellent"  // Invalid enum value
}
```

**Response:**
```json
{
    "error": "Validation failed",
    "message": "Please check your input data",
    "details": [
        {
            "field": "title",
            "message": "Title must be at least 3 characters",
            "code": "too_small"
        },
        {
            "field": "price",
            "message": "Price must be non-negative",
            "code": "too_small"
        },
        {
            "field": "category",
            "message": "At least one category is required",
            "code": "too_small"
        },
        {
            "field": "condition",
            "message": "Condition must be one of: new, like-new, good, fair, poor",
            "code": "invalid_enum_value"
        }
    ]
}
```

## 🔧 Benefits

### 1. **Type Safety**
- Runtime type checking ensures data integrity
- Automatic TypeScript type inference
- Prevents type-related bugs

### 2. **Security**
- Input sanitization prevents XSS attacks
- Validation prevents injection attacks
- Consistent error handling

### 3. **Developer Experience**
- Clear error messages for debugging
- Centralized validation logic
- Easy to maintain and extend

### 4. **API Consistency**
- Standardized error responses
- Consistent validation across all endpoints
- Better API documentation

### 5. **Performance**
- Early validation prevents unnecessary database queries
- Efficient error handling
- Reduced server load

## 📝 Best Practices

### 1. **Schema Design**
- Keep schemas focused and reusable
- Use descriptive error messages
- Implement proper defaults where appropriate

### 2. **Error Handling**
- Provide clear, actionable error messages
- Include field-specific validation details
- Maintain consistent error response format

### 3. **Validation Order**
- Validate parameters first (fastest)
- Then validate query parameters
- Finally validate request body

### 4. **Middleware Composition**
- Combine validation with authentication
- Apply role-based validation where needed
- Use conditional validation based on user roles

## 🚀 Future Enhancements

### 1. **Custom Validators**
```javascript
// Custom business logic validation
const validateItemOwnership = z.object({
    itemId: z.string().refine(async (id) => {
        const item = await Item.findById(id);
        return item && item.user.toString() === req.user._id.toString();
    }, 'You can only modify your own items')
});
```

### 2. **Conditional Validation**
```javascript
// Validate based on user role
const adminUpdateSchema = z.object({
    ...baseUpdateSchema.shape,
    role: z.enum(['Student', 'Admin']).optional()
}).refine((data) => {
    return req.user.role === 'Admin' || !data.role;
}, 'Only admins can change user roles');
```

### 3. **Async Validation**
```javascript
// Validate unique constraints
const uniqueEmailSchema = z.object({
    email: z.string().email().refine(async (email) => {
        const exists = await User.findOne({ email });
        return !exists;
    }, 'Email already exists')
});
```

This comprehensive Zod validation implementation ensures data integrity, security, and provides excellent developer experience throughout the Kewie marketplace application. 