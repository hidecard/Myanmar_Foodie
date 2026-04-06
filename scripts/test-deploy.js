const { createClient } = require('@libsql/client');
require('dotenv').config();

async function testDeployment() {
    console.log('🧪 Testing Deployment Setup...\n');

    // Test 1: Environment Variables
    console.log('📋 1. Testing Environment Variables...');
    const requiredEnv = ['BOT_TOKEN', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
    let envOk = true;
    
    requiredEnv.forEach(env => {
        if (!process.env[env]) {
            console.log(`❌ Missing: ${env}`);
            envOk = false;
        } else {
            console.log(`✅ ${env}: ${env.substring(0, 10)}...`);
        }
    });

    if (!envOk) {
        console.log('\n❌ Environment variables not configured properly!');
        return;
    }

    // Test 2: Database Connection
    console.log('\n🗄️ 2. Testing Database Connection...');
    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        const result = await client.execute('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Database connected! Users: ${result.rows[0].count}`);
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return;
    }

    // Test 3: Bot Token
    console.log('\n🤖 3. Testing Bot Token...');
    try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log(`✅ Bot connected! @${data.result.username}`);
        } else {
            console.log('❌ Bot token invalid:', data.description);
        }
    } catch (error) {
        console.log('❌ Bot token test failed:', error.message);
    }

    console.log('\n🎉 Deployment test completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: npm run deploy');
    console.log('2. Set webhook: curl command from DEPLOYMENT.md');
    console.log('3. Test bot on Telegram');
}

if (require.main === module) {
    testDeployment();
}

module.exports = { testDeployment };
