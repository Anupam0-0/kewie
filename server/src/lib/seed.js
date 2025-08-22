const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user.model');
const { Category, Item, ItemImage, WishList, AddToCart } = require('../models/item.model');
const Review = require('../models/review.model');
const { Chat, Message } = require('../models/chat.model');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kewie');
        console.log('MongoDB connected for seeding...');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Clear existing data
const clearData = async () => {
    try {
        await User.deleteMany({});
        await Category.deleteMany({});
        await Item.deleteMany({});
        await ItemImage.deleteMany({});
        await Review.deleteMany({});
        await Chat.deleteMany({});
        await Message.deleteMany({});
        await WishList.deleteMany({});
        await AddToCart.deleteMany({});
        console.log('✅ Existing data cleared');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
};

// Seed Users
const seedUsers = async () => {
    const users = [
        {
            name: 'Admin User',
            email: 'admin@kewie.com',
            password: 'admin123',
            phone: '+1234567890',
            branch: 'Computer Science',
            role: 'Admin',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            isActive: true
        },
        {
            name: 'John Student',
            email: 'john@student.com',
            password: 'password123',
            phone: '+1234567891',
            branch: 'Computer Science',
            role: 'Student',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            isActive: true
        },
        {
            name: 'Sarah Wilson',
            email: 'sarah@student.com',
            password: 'password123',
            phone: '+1234567892',
            branch: 'Electrical Engineering',
            role: 'Student',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            isActive: true
        },
        {
            name: 'Mike Johnson',
            email: 'mike@student.com',
            password: 'password123',
            phone: '+1234567893',
            branch: 'Mechanical Engineering',
            role: 'Student',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            isActive: true
        },
        {
            name: 'Emma Davis',
            email: 'emma@student.com',
            password: 'password123',
            phone: '+1234567894',
            branch: 'Computer Science',
            role: 'Student',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            isActive: true
        },
        {
            name: 'Alex Brown',
            email: 'alex@student.com',
            password: 'password123',
            phone: '+1234567895',
            branch: 'Civil Engineering',
            role: 'Student',
            isVerified: true,
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
            isActive: true
        }
    ];

    const createdUsers = [];
    for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = await User.create({
            ...userData,
            password: hashedPassword,
            lastLogin: new Date(),
            loginCount: Math.floor(Math.random() * 10) + 1
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.name} (${user.email})`);
    }
    return createdUsers;
};

// Seed Categories
const seedCategories = async () => {
    const categories = [
        { name: 'Electronics', description: 'Electronic devices and gadgets' },
        { name: 'Books', description: 'Textbooks and academic books' },
        { name: 'Clothing', description: 'Apparel and accessories' },
        { name: 'Sports', description: 'Sports equipment and gear' },
        { name: 'Furniture', description: 'Furniture and home decor' },
        { name: 'Vehicles', description: 'Cars, bikes, and transportation' },
        { name: 'Musical Instruments', description: 'Instruments and audio equipment' },
        { name: 'Art & Crafts', description: 'Art supplies and crafts' },
        { name: 'Tools', description: 'Tools and hardware' },
        { name: 'Other', description: 'Miscellaneous items' }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
        const category = await Category.create(categoryData);
        createdCategories.push(category);
        console.log(`✅ Created category: ${category.name}`);
    }
    return createdCategories;
};

// Seed Items
const seedItems = async (users, categories) => {
    const items = [
        {
            title: 'MacBook Pro 2021',
            description: 'Excellent condition MacBook Pro with M1 chip. Perfect for programming and design work.',
            price: 1200,
            condition: 'like-new',
            location: 'Computer Science Building',
            negotiable: true,
            views: 45,
            status: 'available'
        },
        {
            title: 'Calculus Textbook',
            description: 'Calculus: Early Transcendentals 8th Edition. Used but in good condition.',
            price: 25,
            condition: 'good',
            location: 'Library',
            negotiable: false,
            views: 12,
            status: 'available'
        },
        {
            title: 'Gaming Laptop',
            description: 'ASUS ROG Gaming Laptop with RTX 3060. Great for gaming and development.',
            price: 800,
            condition: 'good',
            location: 'Student Center',
            negotiable: true,
            views: 67,
            status: 'available'
        },
        {
            title: 'Bicycle',
            description: 'Mountain bike in excellent condition. Perfect for campus transportation.',
            price: 150,
            condition: 'good',
            location: 'Parking Lot A',
            negotiable: true,
            views: 23,
            status: 'available'
        },
        {
            title: 'Guitar',
            description: 'Acoustic guitar, barely used. Comes with case and extra strings.',
            price: 200,
            condition: 'like-new',
            location: 'Music Department',
            negotiable: true,
            views: 18,
            status: 'available'
        },
        {
            title: 'Study Desk',
            description: 'Wooden study desk with drawer. Perfect for dorm room.',
            price: 80,
            condition: 'good',
            location: 'Dorm Building B',
            negotiable: false,
            views: 34,
            status: 'available'
        },
        {
            title: 'iPhone 13',
            description: 'iPhone 13 128GB in perfect condition. Includes original box and charger.',
            price: 600,
            condition: 'like-new',
            location: 'Engineering Building',
            negotiable: true,
            views: 89,
            status: 'available'
        },
        {
            title: 'Lab Coat',
            description: 'White lab coat, size M. Clean and ready for chemistry lab.',
            price: 15,
            condition: 'good',
            location: 'Chemistry Building',
            negotiable: false,
            views: 7,
            status: 'available'
        },
        {
            title: 'Coffee Maker',
            description: 'Drip coffee maker with timer. Great for early morning classes.',
            price: 30,
            condition: 'good',
            location: 'Student Housing',
            negotiable: true,
            views: 21,
            status: 'available'
        },
        {
            title: 'Soccer Ball',
            description: 'Professional soccer ball, barely used. Perfect for intramural games.',
            price: 20,
            condition: 'like-new',
            location: 'Sports Complex',
            negotiable: false,
            views: 15,
            status: 'available'
        }
    ];

    const createdItems = [];
    for (let i = 0; i < items.length; i++) {
        const itemData = items[i];
        const user = users[i % users.length]; // Distribute items among users
        const category = categories[i % categories.length]; // Distribute categories

        const item = await Item.create({
            ...itemData,
            user: user._id,
            category: [category._id]
        });
        createdItems.push(item);
        console.log(`✅ Created item: ${item.title} by ${user.name}`);
    }
    return createdItems;
};

// Seed Item Images
const seedItemImages = async (items) => {
    const imageUrls = [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
    ];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const imageUrl = imageUrls[i % imageUrls.length];
        
        await ItemImage.create({
            item: item._id,
            imageUrl: imageUrl
        });
        console.log(`✅ Added image for item: ${item.title}`);
    }
};

// Seed Reviews
const seedReviews = async (users, items) => {
    const reviews = [
        {
            rating: 5,
            title: 'Excellent seller!',
            content: 'Great communication and item was exactly as described. Highly recommend!',
            status: 'approved'
        },
        {
            rating: 4,
            title: 'Good experience',
            content: 'Item was in good condition and seller was responsive. Would buy again.',
            status: 'approved'
        },
        {
            rating: 5,
            title: 'Perfect transaction',
            content: 'Fast delivery and item was like new. Very happy with the purchase.',
            status: 'approved'
        },
        {
            rating: 3,
            title: 'Okay experience',
            content: 'Item was as described but took longer than expected to meet up.',
            status: 'approved'
        },
        {
            rating: 5,
            title: 'Amazing deal!',
            content: 'Got exactly what I was looking for at a great price. Seller was very helpful.',
            status: 'approved'
        },
        {
            rating: 4,
            title: 'Smooth transaction',
            content: 'Easy to coordinate and item was in good condition. Thanks!',
            status: 'approved'
        },
        {
            rating: 2,
            title: 'Disappointed',
            content: 'Item was not in the condition described. Seller was unresponsive.',
            status: 'pending'
        },
        {
            rating: 5,
            title: 'Highly recommend',
            content: 'Professional seller with quality items. Will definitely buy again.',
            status: 'approved'
        }
    ];

    for (let i = 0; i < reviews.length; i++) {
        const reviewData = reviews[i];
        const reviewer = users[i % users.length];
        const item = items[i % items.length];
        
        // Ensure reviewer is not the item owner
        if (reviewer._id.toString() !== item.user.toString()) {
            const review = await Review.create({
                ...reviewData,
                reviewer: reviewer._id,
                targetType: 'item',
                target: item._id,
                targetModel: 'Item',
                helpfulVotes: Math.floor(Math.random() * 10),
                unhelpfulVotes: Math.floor(Math.random() * 3)
            });
            console.log(`✅ Created review by ${reviewer.name} for ${item.title}`);
        }
    }
};

// Seed Wishlists
const seedWishlists = async (users, items) => {
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const numWishlistItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per user

        for (let j = 0; j < numWishlistItems; j++) {
            const item = items[Math.floor(Math.random() * items.length)];

            // Ensure user doesn't wishlist their own item
            if (user._id.toString() !== item.user.toString()) {
                const exists = await WishList.findOne({ user: user._id, item: item._id });
                if (!exists) {
                    await WishList.create({
                        user: user._id,
                        item: item._id
                    });
                    console.log(`✅ Added ${item.title} to ${user.name}'s wishlist`);
                }
            }
        }
    }
};

// Seed Carts
const seedCarts = async (users, items) => {
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const numCartItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per user
        
        for (let j = 0; j < numCartItems; j++) {
            const item = items[Math.floor(Math.random() * items.length)];
            
            // Ensure user doesn't add their own item to cart
            if (user._id.toString() !== item.user.toString()) {
                const exists = await AddToCart.findOne({ user: user._id, item: item._id });
                if (!exists) {
                    await AddToCart.create({
                        user: user._id,
                        item: item._id,
                        quantity: Math.floor(Math.random() * 2) + 1, // 1-2 quantity
                        addedAt: new Date()
                    });
                    console.log(`✅ Added ${item.title} to ${user.name}'s cart`);
                }
            }
        }
    }
};

// Seed Chats
const seedChats = async (users, items) => {
    const chats = [];
    
    // Create chats between buyers and sellers
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const seller = users.find(u => u._id.toString() === item.user.toString());
        const buyer = users.find(u => u._id.toString() !== item.user.toString());
        
        if (seller && buyer) {
            const chat = await Chat.create({
                buyer: buyer._id,
                seller: seller._id,
                item: item._id,
                status: 'active',
                unreadCount: Math.floor(Math.random() * 3)
            });
            chats.push(chat);
            console.log(`✅ Created chat between ${buyer.name} and ${seller.name} for ${item.title}`);
        }
    }
    
    return chats;
};

// Seed Messages
const seedMessages = async (chats, users) => {
    const messageTemplates = [
        "Hi! Is this still available?",
        "What's the best price you can offer?",
        "Can I see more photos?",
        "When would be a good time to meet?",
        "Is the item in good condition?",
        "Do you accept offers?",
        "Where can we meet on campus?",
        "Thanks for the quick response!",
        "I'm interested in buying this.",
        "Can you hold it for me until tomorrow?"
    ];

    for (const chat of chats) {
        const numMessages = Math.floor(Math.random() * 5) + 2; // 2-6 messages per chat
        
        for (let i = 0; i < numMessages; i++) {
            const sender = i % 2 === 0 ? chat.buyer : chat.seller;
            const messageText = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
            
            await Message.create({
                chat: chat._id,
                sender: sender,
                content: messageText,
                messageType: 'text',
                isRead: i < numMessages - 1, // All messages except the last one are read
                readAt: i < numMessages - 1 ? new Date() : null
            });
        }
        console.log(`✅ Added ${numMessages} messages to chat ${chat._id}`);
    }
};

// Main seeding function
const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        await connectDB();
        await clearData();
        
        console.log('\n👥 Seeding users...');
        const users = await seedUsers();
        
        console.log('\n📂 Seeding categories...');
        const categories = await seedCategories();
        
        console.log('\n🛍️ Seeding items...');
        const items = await seedItems(users, categories);
        
        console.log('\n🖼️ Seeding item images...');
        await seedItemImages(items);
        
        console.log('\n⭐ Seeding reviews...');
        await seedReviews(users, items);
        
        console.log('\n❤️ Seeding wishlists...');
        await seedWishlists(users, items);
        
        console.log('\n🛒 Seeding carts...');
        await seedCarts(users, items);
        
        console.log('\n💬 Seeding chats...');
        const chats = await seedChats(users, items);
        
        console.log('\n💭 Seeding messages...');
        await seedMessages(chats, users);
        
        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- ${users.length} users created`);
        console.log(`- ${categories.length} categories created`);
        console.log(`- ${items.length} items created`);
        console.log(`- Multiple reviews, wishlists, carts, chats, and messages created`);
        console.log('\n🔑 Test Credentials:');
        console.log('Admin: admin@kewie.com / admin123');
        console.log('Student: john@student.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedData();
}

module.exports = { seedData };
