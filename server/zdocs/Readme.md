# Kewie - MERN Stack Application Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [Database Models](#database-models)
4. [Controllers](#controllers)
5. [Routes](#routes)
6. [Middleware](#middleware)
7. [API Endpoints](#api-endpoints)
8. [Error Handling](#error-handling)
9. [Security Features](#security-features)

---

## 🎯 Overview

**Kewie** is a MERN (MongoDB, Express.js, SvelteKit, Node.js) stack application that appears to be a marketplace platform for students. The application supports user authentication, item listings, reviews, wishlists, shopping carts, and chat functionality.

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Role-Based Access Control**: Custom RBAC middleware
- **Postman link**: [Postman Collection](https://kewie6-2676.postman.co/workspace/Kewie-Workspace~b72aef03-87f7-4246-8b85-4b53ade3fa52/collection/36196413-0fa02f84-9b89-4246-af21-d156628e608e?action=share&creator=36196413)

---

## 🔐 Authentication System

### JWT Token Structure
- **Access Token**: Short-lived token for API access
- **Refresh Token**: Long-lived token for token renewal
- **Token Storage**: HTTP-only cookies or Authorization header

### Authentication Flow
1. User registers/logs in
2. Server generates JWT tokens
3. Access token sent in Authorization header: `Bearer <token>`
4. Middleware validates token on protected routes
5. User object attached to `req.user` for route handlers

### Token Utilities (utils/generateToken.js)
- `signAccess(payload)`: Generate access token
- `signRefresh(payload)`: Generate refresh token
- `verifyAccess(token)`: Verify access token
- `verifyRefresh(token)`: Verify refresh token
- `hashToken(token)`: Hash token for storage

---

## 🗄️ Database Models

### 1. User Model (`user.model.js`)

**Purpose**: Store user account information and authentication data

**Schema Fields**:
```javascript
{
  name: String (required, 2-50 chars),
  email: String (unique, required, lowercase),
  password: String (required, min 6 chars, hashed),
  phone: String (required, trimmed),
  branch: String (optional),
  role: String (enum: ["Student", "Admin"], default: "Student"),
  isVerified: Boolean (default: false),
  avatar: String (optional, URL),
  lastLogin: Date,
  loginCount: Number (default: 0),
  isActive: Boolean (default: true)
}
```

**Methods**:
- `comparePassword(candidate)`: Compare password with hash
- `generateVerificationToken()`: Generate email verification token
- `generatePasswordResetToken()`: Generate password reset token

**Middleware**:
- `pre('save')`: Hash password before saving

### 2. Item Model (`item.model.js`)

**Purpose**: Store marketplace item listings

**Schema Fields**:
```javascript
{
  user: ObjectId (ref: User, required),
  category: [ObjectId] (ref: Category, required),
  title: String (required, max 200 chars),
  description: String (max 2000 chars),
  price: Number (required, min 0),
  status: String (enum: ["available", "sold", "reserved"]),
  condition: String (enum: ["new", "like-new", "good", "fair", "poor"]),
  location: String (required),
  negotiable: Boolean (default: true),
  views: Number (default: 0)
}
```

**Middleware**:
- `pre('save')`: Ensure at least one category is present

### 3. Category Model (`item.model.js`)

**Purpose**: Organize items into categories

**Schema Fields**:
```javascript
{
  name: String (unique, required),
  description: String (optional)
}
```

### 4. Review Model (`review.model.js`)

**Purpose**: Store user and item reviews

**Schema Fields**:
```javascript
{
  reviewer: ObjectId (ref: User, required),
  targetType: String (enum: ["user", "item"], required),
  target: ObjectId (refPath: targetModel, required),
  targetModel: String (enum: ["User", "Item"], required),
  rating: Number (1-5, required),
  title: String (required, max 100 chars),
  content: String (required, max 1000 chars),
  status: String (enum: ["pending", "approved", "rejected"]),
  helpfulVotes: Number (default: 0),
  unhelpfulVotes: Number (default: 0),
  images: [{
    imageUrl: String (required, URL validation),
    caption: String (max 100 chars)
  }],
  moderatedBy: ObjectId (ref: User),
  moderatedAt: Date,
  moderationReason: String
}
```

**Virtuals**:
- `helpfulScore`: Calculated as helpfulVotes - unhelpfulVotes

**Methods**:
- `vote(isHelpful)`: Mark review as helpful/unhelpful
- `canReview(userId)`: Check if user can review (prevent self-reviews)
- `isEditable()`: Check if review can be edited (within 24 hours)

**Static Methods**:
- `getAverageRating(targetId, targetType)`: Calculate average rating for target

### 5. Chat & Message Models (`chat.model.js`)

**Purpose**: Handle user-to-user messaging

**Chat Schema**:
```javascript
{
  buyer: ObjectId (ref: User, required),
  seller: ObjectId (ref: User, required),
  item: ObjectId (ref: Item, required),
  status: String (enum: ["active", "archived", "blocked"]),
  lastMessage: ObjectId (ref: Message),
  unreadCount: Number (default: 0)
}
```

**Message Schema**:
```javascript
{
  chat: ObjectId (ref: Chat, required),
  sender: ObjectId (ref: User, required),
  content: String (required, max 1000 chars),
  messageType: String (enum: ["text", "image", "offer"]),
  attachments: [String],
  isRead: Boolean (default: false),
  readAt: Date,
  offerAmount: Number,
  offerStatus: String (enum: ["pending", "accepted", "rejected"])
}
```

**Methods**:
- `markAsRead()`: Mark message as read

### 6. WishList Model (`item.model.js`)

**Purpose**: Store user's wishlist items

**Schema Fields**:
```javascript
{
  user: ObjectId (ref: User, required),
  item: ObjectId (ref: Item, required)
}
```

**Indexes**: Unique compound index on `{user: 1, item: 1}`

### 7. AddToCart Model (`item.model.js`)

**Purpose**: Store user's shopping cart items

**Schema Fields**:
```javascript
{
  user: ObjectId (ref: User, required),
  item: ObjectId (ref: Item, required),
  quantity: Number (default: 1, min: 1),
  addedAt: Date (default: Date.now)
}
```

**Indexes**: Unique compound index on `{user: 1, item: 1}`

---

## 🎮 Controllers

### 1. Auth Controller (`auth.controller.js`)

**Purpose**: Handle user authentication and profile management

**Functions**:

#### `register(req, res)`
- **Flow**: Validate input → Check existing email → Hash password → Create user → Generate tokens → Return user data
- **Validation**: Name (2-50 chars), email format, password (min 6 chars), phone
- **Response**: User object (without password) + tokens

#### `login(req, res)`
- **Flow**: Validate credentials → Check user active status → Compare password → Update login stats → Generate tokens → Return user data
- **Validation**: Email, password
- **Response**: User object + tokens

#### `me(req, res)`
- **Flow**: Return current user data from `req.user`
- **Response**: User object with populated fields

#### `updateProfile(req, res)`
- **Flow**: Validate input → Update user fields → Return updated user
- **Validation**: Name, email format, phone
- **Response**: Updated user object

#### `changePassword(req, res)`
- **Flow**: Validate current password → Hash new password → Update user
- **Validation**: Current password, new password (min 6 chars)
- **Response**: Success message

#### `logout(req, res)`
- **Flow**: Invalidate refresh token → Return success message
- **Response**: Success message

#### `getUserStats(req, res)`
- **Flow**: Calculate user statistics (items, reviews, etc.)
- **Response**: User statistics object

### 2. Item Controller (`item.controller.js`)

**Purpose**: Handle item listing operations

**Functions**:

#### `createItem(req, res)`
- **Flow**: Validate input → Create item → Populate user/category → Return item
- **Validation**: Title, price, category, condition, location
- **Authorization**: Requires authentication
- **Response**: Created item with populated fields

#### `getItems(req, res)`
- **Flow**: Apply filters → Paginate → Sort → Return items
- **Filters**: Category, price range, condition, status, search, negotiable
- **Pagination**: Page, limit parameters
- **Sorting**: Sort parameter
- **Response**: Items array with pagination info

#### `getItemById(req, res)`
- **Flow**: Find item → Increment views → Populate fields → Return item
- **Response**: Item with populated user, category, and images

#### `updateItemById(req, res)`
- **Flow**: Validate ownership → Update item → Return updated item
- **Authorization**: Item owner only
- **Validation**: Same as createItem
- **Response**: Updated item

#### `deleteItemById(req, res)`
- **Flow**: Validate ownership → Delete item and images → Return success
- **Authorization**: Item owner only
- **Response**: Success message

#### `searchItems(req, res)`
- **Flow**: Search items by title/description → Apply filters → Return results
- **Response**: Search results with pagination

#### `getFeaturedItems(req, res)`
- **Flow**: Get items with high views/ratings → Return featured items
- **Response**: Featured items array

#### `getItemsByCategory(req, res)`
- **Flow**: Get items by category ID → Apply filters → Return results
- **Response**: Category items with pagination

#### `getItemStats(req, res)`
- **Flow**: Calculate item statistics → Return stats
- **Response**: Item statistics object

### 3. Category Controller (`category.controller.js`)

**Purpose**: Handle category management

**Functions**:

#### `createCategory(req, res)`
- **Flow**: Validate input → Check existing → Create category → Return category
- **Validation**: Name (unique), description
- **Authorization**: Admin only
- **Response**: Created category

#### `getAllCategories(req, res)`
- **Flow**: Get all categories → Return categories
- **Response**: Categories array

#### `getCategoryById(req, res)`
- **Flow**: Find category → Return category
- **Response**: Category object

#### `updateCategory(req, res)`
- **Flow**: Validate input → Update category → Return updated category
- **Authorization**: Admin only
- **Response**: Updated category

#### `deleteCategory(req, res)`
- **Flow**: Check item count → Delete category → Return success
- **Authorization**: Admin only
- **Validation**: No items in category
- **Response**: Success message

#### `searchCategories(req, res)`
- **Flow**: Search categories by name → Return results
- **Response**: Search results

#### `getCategoryStats(req, res)`
- **Flow**: Calculate category statistics → Return stats
- **Response**: Category statistics

#### `getPopularCategories(req, res)`
- **Flow**: Get categories with most items → Return popular categories
- **Response**: Popular categories array

#### `bulkCreateCategories(req, res)`
- **Flow**: Validate array → Create multiple categories → Return results
- **Authorization**: Admin only
- **Response**: Created categories array

### 4. Review Controller (`review.controller.js`)

**Purpose**: Handle review operations

**Functions**:

#### `createReview(req, res)`
- **Flow**: Validate input → Check existing review → Create review → Return review
- **Validation**: Rating (1-5), title, content, targetType, target
- **Authorization**: Requires authentication
- **Validation**: Prevent self-reviews
- **Response**: Created review

#### `getReviewsByTarget(req, res)`
- **Flow**: Get reviews by target → Apply filters → Return reviews
- **Filters**: Status, rating, helpful
- **Response**: Reviews array with pagination

#### `getReviewById(req, res)`
- **Flow**: Find review → Return review
- **Response**: Review object

#### `updateReview(req, res)`
- **Flow**: Validate ownership → Check editability → Update review → Return review
- **Authorization**: Review owner only
- **Validation**: Within 24 hours of creation
- **Response**: Updated review

#### `deleteReview(req, res)`
- **Flow**: Validate ownership → Delete review → Return success
- **Authorization**: Review owner only
- **Response**: Success message

#### `voteOnReview(req, res)`
- **Flow**: Validate input → Update vote count → Return review
- **Authorization**: Requires authentication
- **Validation**: isHelpful boolean
- **Response**: Updated review

#### `getReviewsByUser(req, res)`
- **Flow**: Get reviews by user ID → Return reviews
- **Response**: User reviews array

#### `getPendingReviews(req, res)`
- **Flow**: Get pending reviews → Return reviews
- **Authorization**: Admin only
- **Response**: Pending reviews array

#### `moderateReview(req, res)`
- **Flow**: Validate input → Update review status → Return review
- **Authorization**: Admin only
- **Validation**: Status, moderationReason
- **Response**: Moderated review

#### `getReviewStats(req, res)`
- **Flow**: Calculate review statistics → Return stats
- **Response**: Review statistics

### 5. Wishlist Controller (`wishlist.controller.js`)

**Purpose**: Handle wishlist operations

**Functions**:

#### `addToWishlist(req, res)`
- **Flow**: Validate input → Check existing → Check item availability → Add to wishlist → Return wishlist item
- **Authorization**: Requires authentication
- **Validation**: Item exists and is available
- **Response**: Wishlist item

#### `getWishlist(req, res)`
- **Flow**: Get user's wishlist → Populate item details → Return wishlist
- **Authorization**: Requires authentication
- **Response**: Wishlist items array

#### `removeFromWishlist(req, res)`
- **Flow**: Remove item from wishlist → Return success
- **Authorization**: Requires authentication
- **Response**: Success message

#### `checkWishlistStatus(req, res)`
- **Flow**: Check if item is in wishlist → Return status
- **Authorization**: Requires authentication
- **Response**: Wishlist status boolean

#### `getWishlistStats(req, res)`
- **Flow**: Calculate wishlist statistics → Return stats
- **Authorization**: Requires authentication
- **Response**: Wishlist statistics

#### `bulkAddToWishlist(req, res)`
- **Flow**: Add multiple items to wishlist → Return results
- **Authorization**: Requires authentication
- **Response**: Added items array

#### `bulkRemoveFromWishlist(req, res)`
- **Flow**: Remove multiple items from wishlist → Return results
- **Authorization**: Requires authentication
- **Response**: Removed items array

#### `clearWishlist(req, res)`
- **Flow**: Remove all items from wishlist → Return success
- **Authorization**: Requires authentication
- **Response**: Success message

#### `getWishlistByCategory(req, res)`
- **Flow**: Get wishlist items by category → Return items
- **Authorization**: Requires authentication
- **Response**: Category wishlist items

#### `moveToCart(req, res)`
- **Flow**: Move item from wishlist to cart → Remove from wishlist → Return cart item
- **Authorization**: Requires authentication
- **Response**: Cart item

### 6. Cart Controller (`cart.controller.js`)

**Purpose**: Handle shopping cart operations

**Functions**:

#### `addToCart(req, res)`
- **Flow**: Validate input → Check existing → Check item availability → Add to cart → Return cart item
- **Authorization**: Requires authentication
- **Validation**: Item exists and is available
- **Response**: Cart item

#### `getCart(req, res)`
- **Flow**: Get user's cart → Populate item details → Calculate totals → Return cart
- **Authorization**: Requires authentication
- **Response**: Cart items with totals

#### `updateCartItemQuantity(req, res)`
- **Flow**: Update item quantity → Return updated cart item
- **Authorization**: Requires authentication
- **Validation**: Quantity > 0
- **Response**: Updated cart item

#### `removeFromCart(req, res)`
- **Flow**: Remove item from cart → Return success
- **Authorization**: Requires authentication
- **Response**: Success message

#### `clearCart(req, res)`
- **Flow**: Remove all items from cart → Return success
- **Authorization**: Requires authentication
- **Response**: Success message

#### `getCartStats(req, res)`
- **Flow**: Calculate cart statistics → Return stats
- **Authorization**: Requires authentication
- **Response**: Cart statistics

#### `bulkAddToCart(req, res)`
- **Flow**: Add multiple items to cart → Return results
- **Authorization**: Requires authentication
- **Response**: Added items array

#### `bulkRemoveFromCart(req, res)`
- **Flow**: Remove multiple items from cart → Return results
- **Authorization**: Requires authentication
- **Response**: Removed items array

#### `checkCartStatus(req, res)`
- **Flow**: Check if item is in cart → Return status
- **Authorization**: Requires authentication
- **Response**: Cart status boolean

#### `moveToWishlist(req, res)`
- **Flow**: Move item from cart to wishlist → Remove from cart → Return wishlist item
- **Authorization**: Requires authentication
- **Response**: Wishlist item

#### `getCartBySeller(req, res)`
- **Flow**: Get cart items by seller → Return items
- **Authorization**: Requires authentication
- **Response**: Seller cart items

### 7. Chat Controller (`chat.controller.js`)

**Purpose**: Handle chat and messaging operations

**Functions**:

#### `getOrCreateChat(req, res)`
- **Flow**: Find existing chat → Create if not exists → Return chat
- **Authorization**: Requires authentication
- **Validation**: Seller ID, item ID
- **Response**: Chat object

#### `getChats(req, res)`
- **Flow**: Get user's chats → Populate details → Return chats
- **Authorization**: Requires authentication
- **Response**: Chats array

#### `sendMessage(req, res)`
- **Flow**: Validate input → Create message → Update chat → Return message
- **Authorization**: Requires authentication
- **Validation**: Content, chat ID
- **Response**: Created message

#### `getMessages(req, res)`
- **Flow**: Get chat messages → Apply pagination → Return messages
- **Authorization**: Requires authentication
- **Response**: Messages array with pagination

---

## 🛣️ Routes

### Route Structure
All routes are organized by functionality and access level:

1. **Public Routes**: No authentication required
2. **Protected Routes**: Authentication required
3. **Admin Routes**: Authentication + Admin role required

### Route Files

#### 1. Auth Routes (`auth.route.js`)
```
POST   /register          - User registration
POST   /login             - User login
GET    /me                - Get current user (protected)
PUT    /profile           - Update profile (protected)
PUT    /change-password   - Change password (protected)
POST   /logout            - User logout (protected)
GET    /stats             - User statistics (protected)
GET    /admin             - Admin test route (admin only)
```

#### 2. Item Routes (`item.route.js`)
```
GET    /                  - Get all items (public)
GET    /search            - Search items (public)
GET    /featured          - Get featured items (public)
GET    /category/:categoryId - Get items by category (public)
GET    /stats             - Get item statistics (public)
GET    /user/:userId      - Get items by user (public)
GET    /:itemId           - Get item by ID (public)
POST   /                  - Create item (protected)
PUT    /:itemId           - Update item (protected)
DELETE /:itemId           - Delete item (protected)
PATCH  /:itemId/status    - Update item status (protected)
POST   /:itemId/report    - Report item (protected)
```

#### 3. Category Routes (`category.routes.js`)
```
GET    /                  - Get all categories (public)
GET    /search            - Search categories (public)
GET    /stats             - Get category statistics (public)
GET    /popular           - Get popular categories (public)
GET    /:categoryId       - Get category by ID (public)
POST   /                  - Create category (admin only)
POST   /bulk              - Bulk create categories (admin only)
PUT    /:categoryId       - Update category (admin only)
DELETE /:categoryId       - Delete category (admin only)
```

#### 4. Review Routes (`review.route.js`)
```
GET    /target/:targetId/:targetType - Get reviews by target (public)
GET    /stats/:targetId/:targetType  - Get review statistics (public)
GET    /:reviewId         - Get review by ID (public)
GET    /user/:userId      - Get reviews by user (public)
POST   /                  - Create review (protected)
PUT    /:reviewId         - Update review (protected)
DELETE /:reviewId         - Delete review (protected)
POST   /:reviewId/vote    - Vote on review (protected)
GET    /admin/pending     - Get pending reviews (admin only)
PUT    /admin/:reviewId/moderate - Moderate review (admin only)
```

#### 5. Wishlist Routes (`wishlist.route.js`)
```
GET    /                  - Get wishlist (protected)
GET    /stats             - Get wishlist statistics (protected)
GET    /category/:categoryId - Get wishlist by category (protected)
GET    /check/:itemId     - Check wishlist status (protected)
POST   /                  - Add to wishlist (protected)
POST   /bulk              - Bulk add to wishlist (protected)
DELETE /:itemId           - Remove from wishlist (protected)
DELETE /bulk              - Bulk remove from wishlist (protected)
DELETE /clear             - Clear wishlist (protected)
POST   /:itemId/move-to-cart - Move to cart (protected)
```

#### 6. Cart Routes (`addToCart.route.js`)
```
GET    /                  - Get cart (protected)
GET    /stats             - Get cart statistics (protected)
GET    /seller/:sellerId  - Get cart by seller (protected)
GET    /check/:itemId     - Check cart status (protected)
POST   /                  - Add to cart (protected)
POST   /bulk              - Bulk add to cart (protected)
PUT    /:itemId/quantity  - Update quantity (protected)
DELETE /:itemId           - Remove from cart (protected)
DELETE /bulk              - Bulk remove from cart (protected)
DELETE /clear             - Clear cart (protected)
POST   /:itemId/move-to-wishlist - Move to wishlist (protected)
```

#### 7. Chat Routes (`chatRoutes.js`)
```
GET    /                  - Get chats (protected)
POST   /                  - Get or create chat (protected)
POST   /:chatId/messages  - Send message (protected)
GET    /:chatId/messages  - Get messages (protected)
```

#### 8. Admin Routes (`admin.route.js`)
```
GET    /dashboard         - Admin dashboard (admin only)
GET    /users             - Get all users (admin only)
GET    /users/:userId     - Get user by ID (admin only)
PUT    /users/:userId     - Update user (admin only)
DELETE /users/:userId     - Delete user (admin only)
GET    /listings          - Get all listings (admin only)
GET    /listings/:listingId - Get listing by ID (admin only)
PUT    /listings/:listingId - Update listing (admin only)
DELETE /listings/:listingId - Delete listing (admin only)
GET    /stats             - System statistics (admin only)
```

---

## 🛡️ Middleware

### 1. Auth Middleware (`auth.middleware.js`)

**Purpose**: Protect routes by validating JWT tokens

**Flow**:
1. Extract Bearer token from Authorization header
2. Verify token using `verifyAccess()`
3. Find user by token payload
4. Attach user to `req.user`
5. Continue to route handler

**Error Responses**:
- `401 Unauthorized`: No token or invalid token
- `401 User not found`: Token valid but user doesn't exist

### 2. RBAC Middleware (`rbac.middleware.js`)

**Purpose**: Enforce role-based access control

**Flow**:
1. Check if user exists in `req.user`
2. Verify user has required role(s)
3. Continue to route handler or return 403

**Usage**: `requireRole("Admin")` or `requireRole("Student", "Admin")`

**Error Responses**:
- `401 Unauthorized`: No user in request
- `403 Forbidden`: Insufficient role

### 3. Error Middleware (`error.middleware.js`)

**Purpose**: Global error handling

**Flow**:
1. Catch errors from route handlers
2. Log error details
3. Return appropriate error response

**Response Format**: `{ error: "Error message" }`

---

## 🔌 API Endpoints Summary

### Authentication Endpoints
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **GET** `/api/auth/me` - Get current user
- **PUT** `/api/auth/profile` - Update profile
- **PUT** `/api/auth/change-password` - Change password
- **POST** `/api/auth/logout` - User logout

### Item Endpoints
- **GET** `/api/items` - Get all items
- **GET** `/api/items/search` - Search items
- **GET** `/api/items/featured` - Get featured items
- **GET** `/api/items/category/:categoryId` - Get items by category
- **GET** `/api/items/user/:userId` - Get items by user
- **GET** `/api/items/:itemId` - Get item by ID
- **POST** `/api/items` - Create item
- **PUT** `/api/items/:itemId` - Update item
- **DELETE** `/api/items/:itemId` - Delete item
- **PATCH** `/api/items/:itemId/status` - Update item status
- **POST** `/api/items/:itemId/report` - Report item

### Category Endpoints
- **GET** `/api/categories` - Get all categories
- **GET** `/api/categories/search` - Search categories
- **GET** `/api/categories/stats` - Get category statistics
- **GET** `/api/categories/popular` - Get popular categories
- **GET** `/api/categories/:categoryId` - Get category by ID
- **POST** `/api/categories` - Create category (admin)
- **POST** `/api/categories/bulk` - Bulk create categories (admin)
- **PUT** `/api/categories/:categoryId` - Update category (admin)
- **DELETE** `/api/categories/:categoryId` - Delete category (admin)

### Review Endpoints
- **GET** `/api/reviews/target/:targetId/:targetType` - Get reviews by target
- **GET** `/api/reviews/stats/:targetId/:targetType` - Get review statistics
- **GET** `/api/reviews/:reviewId` - Get review by ID
- **GET** `/api/reviews/user/:userId` - Get reviews by user
- **POST** `/api/reviews` - Create review
- **PUT** `/api/reviews/:reviewId` - Update review
- **DELETE** `/api/reviews/:reviewId` - Delete review
- **POST** `/api/reviews/:reviewId/vote` - Vote on review
- **GET** `/api/reviews/admin/pending` - Get pending reviews (admin)
- **PUT** `/api/reviews/admin/:reviewId/moderate` - Moderate review (admin)

### Wishlist Endpoints
- **GET** `/api/wishlist` - Get wishlist
- **GET** `/api/wishlist/stats` - Get wishlist statistics
- **GET** `/api/wishlist/category/:categoryId` - Get wishlist by category
- **GET** `/api/wishlist/check/:itemId` - Check wishlist status
- **POST** `/api/wishlist` - Add to wishlist
- **POST** `/api/wishlist/bulk` - Bulk add to wishlist
- **DELETE** `/api/wishlist/:itemId` - Remove from wishlist
- **DELETE** `/api/wishlist/bulk` - Bulk remove from wishlist
- **DELETE** `/api/wishlist/clear` - Clear wishlist
- **POST** `/api/wishlist/:itemId/move-to-cart` - Move to cart

### Cart Endpoints
- **GET** `/api/cart` - Get cart
- **GET** `/api/cart/stats` - Get cart statistics
- **GET** `/api/cart/seller/:sellerId` - Get cart by seller
- **GET** `/api/cart/check/:itemId` - Check cart status
- **POST** `/api/cart` - Add to cart
- **POST** `/api/cart/bulk` - Bulk add to cart
- **PUT** `/api/cart/:itemId/quantity` - Update quantity
- **DELETE** `/api/cart/:itemId` - Remove from cart
- **DELETE** `/api/cart/bulk` - Bulk remove from cart
- **DELETE** `/api/cart/clear` - Clear cart
- **POST** `/api/cart/:itemId/move-to-wishlist` - Move to wishlist

### Chat Endpoints
- **GET** `/api/chat` - Get chats
- **POST** `/api/chat` - Get or create chat
- **POST** `/api/chat/:chatId/messages` - Send message
- **GET** `/api/chat/:chatId/messages` - Get messages

### Admin Endpoints
- **GET** `/api/admin/dashboard` - Admin dashboard
- **GET** `/api/admin/users` - Get all users
- **GET** `/api/admin/users/:userId` - Get user by ID
- **PUT** `/api/admin/users/:userId` - Update user
- **DELETE** `/api/admin/users/:userId` - Delete user
- **GET** `/api/admin/listings` - Get all listings
- **GET** `/api/admin/listings/:listingId` - Get listing by ID
- **PUT** `/api/admin/listings/:listingId` - Update listing
- **DELETE** `/api/admin/listings/:listingId` - Delete listing
- **GET** `/api/admin/stats` - System statistics

---

## 🚨 Error Handling

### Error Response Format
```javascript
{
  "error": "Error message",
  "message": "Additional details" // Optional
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error

### Validation Errors
Controllers include comprehensive input validation:
- Required field checks
- Data type validation
- Length constraints
- Format validation (email, URL)
- Business logic validation

---

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Token Expiration**: Configurable token lifetimes
- **Refresh Tokens**: Secure token renewal mechanism

### Authorization Security
- **Role-Based Access Control**: Granular permission system
- **Resource Ownership**: Users can only modify their own resources
- **Admin Protection**: Sensitive operations require admin role

### Data Security
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization
- **Rate Limiting**: Configurable request limits

### API Security
- **CORS Configuration**: Cross-origin request handling
- **Helmet.js**: Security headers
- **Request Validation**: All inputs validated
- **Error Sanitization**: No sensitive data in error responses

---

## 📊 Database Relationships

### One-to-Many Relationships
- User → Items (one user can have many items)
- User → Reviews (one user can write many reviews)
- User → Chats (one user can have many chats)
- Category → Items (one category can have many items)

### Many-to-Many Relationships
- Users ↔ Items (through WishList)
- Users ↔ Items (through AddToCart)
- Users ↔ Users (through Chat)

### Self-Referencing
- Reviews can target Users or Items (polymorphic)

---

## 🔄 Data Flow Examples

### User Registration Flow
1. Client sends registration data
2. Server validates input
3. Server checks for existing email
4. Server hashes password
5. Server creates user document
6. Server generates JWT tokens
7. Server returns user data and tokens

### Item Creation Flow
1. Client sends item data with auth token
2. Server validates token and user
3. Server validates item data
4. Server creates item document
5. Server populates user and category data
6. Server returns created item

### Review Creation Flow
1. Client sends review data with auth token
2. Server validates token and user
3. Server checks for existing review
4. Server prevents self-reviews
5. Server creates review document
6. Server returns created review

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm start`

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/kewie
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
NODE_ENV=development
```

---

## 📝 Notes

- All timestamps are automatically managed by Mongoose
- All IDs are MongoDB ObjectIds
- Pagination is implemented on list endpoints
- Search functionality supports text search
- File uploads are handled through URLs (no local storage)
- Admin routes require proper role assignment
- Error handling is consistent across all endpoints

---

*This documentation covers the complete backend architecture of the Kewie MERN stack application. For frontend documentation, refer to the client-side documentation.*
