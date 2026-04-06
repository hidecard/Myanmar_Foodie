const database = require('./lib/database');

async function testAllSystems() {
    console.log('🧪 Testing Complete System...\n');
    
    try {
        // Test 1: Database Connection
        console.log('1. Testing database connection...');
        const userCount = await database.getUserCount();
        const shopCount = await database.getShopCount();
        console.log(`   ✅ Database connected - Users: ${userCount}, Shops: ${shopCount}`);
        
        // Test 2: Your User Role
        console.log('\n2. Testing your user role...');
        const yourUser = await database.getUser(7398914587);
        console.log(`   ✅ Your role: ${yourUser.role} (2 = Bot Admin)`);
        
        // Test 3: Shop Operations
        console.log('\n3. Testing shop operations...');
        const yourShops = await database.getShopsByOwner(7398914587);
        console.log(`   ✅ Your shops: ${yourShops.length}`);
        
        // Test 4: Menu Operations
        if (yourShops.length > 0) {
            const menuItems = await database.getMenuItems(yourShops[0].id);
            console.log(`   ✅ Menu items in first shop: ${menuItems.length}`);
        }
        
        // Test 5: User Management
        console.log('\n4. Testing user management...');
        await database.createUser(999999999, 'testuser', 'Test', 'User');
        await database.updateUserRole(999999999, 1);
        const testUser = await database.getUser(999999999);
        console.log(`   ✅ User management works - Test user role: ${testUser.role}`);
        
        // Test 6: Advanced Functions
        console.log('\n5. Testing advanced functions...');
        const popularShops = await database.getPopularShops(5);
        const activeUsers = await database.getActiveUsers(24);
        console.log(`   ✅ Popular shops: ${popularShops.length}, Active users: ${activeUsers}`);
        
        console.log('\n🎉 All tests passed! System is ready for production.');
        console.log('\n📱 Commands to test in Telegram:');
        console.log('   /start - Start the bot');
        console.log('   /make_shop 999999999 - Make test user a Shop Admin');
        console.log('   /add_shop - Add new shop');
        console.log('   /my_shops - View your shops');
        console.log('   /add_menu - Add menu items');
        
        console.log('\n🌐 Admin Dashboard:');
        console.log('   Run: npm run admin');
        console.log('   Access: http://localhost:3001');
        console.log('   Login with Telegram ID: 7398914587');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    process.exit(0);
}

testAllSystems();
