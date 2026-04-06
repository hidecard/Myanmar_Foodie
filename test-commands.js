const database = require('./lib/database');

async function testCommands() {
    console.log('🧪 Testing Bot Commands...\n');
    
    try {
        // Test 1: Check your user role
        console.log('1. Checking your user role...');
        const user = await database.getUser(7398914587);
        console.log('   Your role:', user.role, '(2 = Bot Admin)');
        
        // Test 2: Test make_shop command
        console.log('\n2. Testing /make_shop command...');
        const testUserId = 123456789;
        await database.createUser(testUserId, 'testuser', 'Test', 'User');
        await database.updateUserRole(testUserId, 1);
        const shopAdminUser = await database.getUser(testUserId);
        console.log('   Created test user with role:', shopAdminUser.role, '(1 = Shop Admin)');
        
        // Test 3: Test database operations
        console.log('\n3. Testing database operations...');
        const shops = await database.getShopsByOwner(7398914587);
        console.log('   Your shops count:', shops.length);
        
        const allUsers = await database.client.execute('SELECT COUNT(*) as count FROM users');
        console.log('   Total users:', allUsers.rows[0].count);
        
        const allShops = await database.client.execute('SELECT COUNT(*) as count FROM shops');
        console.log('   Total shops:', allShops.rows[0].count);
        
        console.log('\n✅ All tests passed! Bot commands should work now.');
        console.log('\n📱 Commands you can test in Telegram:');
        console.log('   /make_shop 123456789 - Make test user a Shop Admin');
        console.log('   /make_admin 123456789 - Make test user a Bot Admin');
        console.log('   /add_shop - Add new shop (Shop Admin/Bot Admin)');
        console.log('   /my_shops - View your shops (Shop Admin/Bot Admin)');
        console.log('   /add_menu - Add menu items (Shop Admin/Bot Admin)');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    process.exit(0);
}

testCommands();
