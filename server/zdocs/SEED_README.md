# 🌱 Database Seed Data

This file contains comprehensive seed data for testing all endpoints in the Kewie marketplace application.

## 🚀 Quick Start

### 1. Run the Seed Script
```bash
npm run seed
```

### 2. Test Credentials
After running the seed script, you can use these credentials to test the API:

#### Admin User
- **Email**: `admin@kewie.com`
- **Password**: `admin123`
- **Role**: Admin

#### Student Users
- **Email**: `john@student.com`
- **Password**: `password123`
- **Role**: Student

<br>

- **Email**: `sarah@student.com`
- **Password**: `password123`
- **Role**: Student

<br>

- **Email**: `mike@student.com`
- **Password**: `password123`
- **Role**: Student

<br>

- **Email**: `emma@student.com`
- **Password**: `password123`
- **Role**: Student

<br>

- **Email**: `alex@student.com`
- **Password**: `password123`
- **Role**: Student

## 📊 Seed Data Summary

### Users (6 total)
- 1 Admin user
- 5 Student users
- All users are verified and active

### Categories (10 total)
- Electronics, Books, Clothing, Sports, Furniture
- Vehicles, Musical Instruments, Art & Crafts, Tools, Other

### Items (10 total)
- MacBook Pro, Calculus Textbook, Gaming Laptop
- Bicycle, Guitar, Study Desk, iPhone 13
- Lab Coat, Coffee Maker, Soccer Ball
- Distributed among different users and categories

### Additional Data
- Item Images (1 per item)
- Reviews (8 reviews with various ratings)
- Wishlists (1-4 items per user)
- Shopping Carts (1-3 items per user)
- Chats (between buyers and sellers)
- Messages (2-6 messages per chat)

## 🧪 Testing Endpoints

### 1. Authentication Endpoints

#### Register a new user
```bash
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+1234567899",
  "branch": "Computer Science"
}
```

#### Login
```bash
POST /api/auth/login
{
  "email": "john@student.com",
  "password": "password123"
}
```

#### Get current user
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### 2. Item Endpoints

#### Get all items
```bash
GET /api/items
```

#### Get items with filters
```bash
GET /api/items?category=Electronics&minPrice=100&maxPrice=1000&condition=like-new
```

#### Get item by ID
```bash
GET /api/items/<itemId>
```

#### Create new item (requires auth)
```bash
POST /api/items
Authorization: Bearer <token>
{
  "title": "Test Item",
  "description": "Test description",
  "price": 100,
  "category": ["<categoryId>"],
  "condition": "good",
  "location": "Test Location",
  "negotiable": true
}
```

### 3. Category Endpoints

#### Get all categories
```bash
GET /api/categories
```

#### Get popular categories
```bash
GET /api/categories/popular
```

#### Create category (Admin only)
```bash
POST /api/categories
Authorization: Bearer <admin_token>
{
  "name": "New Category",
  "description": "New category description"
}
```

### 4. Review Endpoints

#### Get reviews for an item
```bash
GET /api/reviews/target/<itemId>/item
```

#### Create review (requires auth)
```bash
POST /api/reviews
Authorization: Bearer <token>
{
  "targetType": "item",
  "target": "<itemId>",
  "rating": 5,
  "title": "Great item!",
  "content": "Excellent condition and fast delivery."
}
```

### 5. Wishlist Endpoints

#### Get user's wishlist (requires auth)
```bash
GET /api/wishlist
Authorization: Bearer <token>
```

#### Add item to wishlist (requires auth)
```bash
POST /api/wishlist
Authorization: Bearer <token>
{
  "itemId": "<itemId>"
}
```

### 6. Cart Endpoints

#### Get user's cart (requires auth)
```bash
GET /api/cart
Authorization: Bearer <token>
```

#### Add item to cart (requires auth)
```bash
POST /api/cart
Authorization: Bearer <token>
{
  "itemId": "<itemId>",
  "quantity": 1
}
```

### 7. Chat Endpoints

#### Get user's chats (requires auth)
```bash
GET /api/chat
Authorization: Bearer <token>
```

#### Get or create chat (requires auth)
```bash
POST /api/chat
Authorization: Bearer <token>
{
  "sellerId": "<sellerId>",
  "itemId": "<itemId>"
}
```

#### Send message (requires auth)
```bash
POST /api/chat/<chatId>/messages
Authorization: Bearer <token>
{
  "content": "Hello! Is this still available?"
}
```

### 8. Admin Endpoints

#### Get admin dashboard (Admin only)
```bash
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### Get all users (Admin only)
```bash
GET /api/admin/users
Authorization: Bearer <admin_token>
```

#### Get pending reviews (Admin only)
```bash
GET /api/reviews/admin/pending
Authorization: Bearer <admin_token>
```

## 🔧 Environment Setup

Make sure you have the following environment variables set:

```env
MONGODB_URI=mongodb://localhost:27017/kewie
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
NODE_ENV=development
```

## 🧹 Clearing Data

The seed script automatically clears all existing data before seeding. If you want to clear data manually:

```bash
# Connect to MongoDB and run:
use kewie
db.users.deleteMany({})
db.categories.deleteMany({})
db.items.deleteMany({})
db.reviews.deleteMany({})
db.chats.deleteMany({})
db.messages.deleteMany({})
db.wishlists.deleteMany({})
db.addtocarts.deleteMany({})
```

## 📝 Notes

- All passwords are hashed using bcryptjs
- Item images use Unsplash URLs for testing
- Reviews are distributed among different users and items
- Wishlists and carts are randomly assigned to users
- Chats are created between buyers and sellers for each item
- All timestamps are automatically generated
- Some reviews are marked as "pending" for admin moderation testing

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check your MONGODB_URI environment variable

2. **Permission Errors**
   - Ensure you have write permissions to the database
   - Check if the database exists

3. **Duplicate Key Errors**
   - The seed script clears existing data, so this shouldn't happen
   - If it does, manually clear the collections first

### Reset Database
```bash
# Stop the application
# Clear all collections
# Run the seed script again
npm run seed
```

## 🎯 Testing Scenarios

### Test User Roles
1. Login as admin and test admin-only endpoints
2. Login as student and verify access restrictions
3. Test role-based access control

### Test Item Operations
1. Create, read, update, delete items
2. Test item filtering and search
3. Test item ownership validation

### Test Review System
1. Create reviews for items
2. Test review moderation (admin)
3. Test review voting system

### Test Shopping Features
1. Add/remove items from wishlist
2. Add/remove items from cart
3. Test quantity updates
4. Test moving items between wishlist and cart

### Test Chat System
1. Create chats between users
2. Send messages
3. Test message history

This seed data provides a comprehensive testing environment for all your API endpoints! 