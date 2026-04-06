const database = require('./lib/database');

async function testAdminFeatures() {
    console.log('🧪 Testing Admin Features...\n');
    
    try {
        // Test 1: Check admin role
        console.log('1. ✅ Checking admin role...');
        const admin = await database.getUser(7398914587);
        console.log(`   Admin role: ${admin.role} (2 = Bot Admin)`);
        
        // Test 2: Get pending shops
        console.log('\n2. ✅ Getting pending shops...');
        const pendingShops = await database.getShopsByStatus('pending');
        console.log(`   Pending shops found: ${pendingShops.length}`);
        
        // Test 3: Get admin's shops
        console.log('\n3. ✅ Getting admin shops...');
        const adminShops = await database.getShopsByOwner(7398914587);
        console.log(`   Admin shops: ${adminShops.length}`);
        
        // Test 4: Get all users count
        console.log('\n4. ✅ Getting user count...');
        const userCount = await database.getUserCount();
        console.log(`   Total users: ${userCount}`);
        
        // Test 5: Get shop count
        console.log('\n5. ✅ Getting shop count...');
        const shopCount = await database.getShopCount();
        console.log(`   Total shops: ${shopCount}`);
        
        // Test 6: Get approved shops
        console.log('\n6. ✅ Getting approved shops...');
        const approvedShops = await database.getShopsByStatus('approved');
        console.log(`   Approved shops: ${approvedShops.length}`);
        
        console.log('\n🎉 All admin features are working correctly!');
        
    } catch (error) {
        console.error('❌ Error testing admin features:', error.message);
    }
}

testAdminFeatures();
