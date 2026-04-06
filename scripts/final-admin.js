const { createClient } = require('@libsql/client');
require('dotenv').config();

async function finalAdminSet() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const telegramId = 7398914587;
    
    try {
        console.log('🔧 Final admin setup - Step by Step...');
        
        // Step 1: Completely clear any existing records
        console.log('🗑️ Step 1: Clearing existing records...');
        const deleteResult = await client.execute({
            sql: 'DELETE FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        console.log(`   Deleted ${deleteResult.rowsAffected} records`);
        
        // Step 2: Insert admin record with explicit role
        console.log('➕ Step 2: Inserting admin record...');
        const insertResult = await client.execute({
            sql: 'INSERT INTO users (telegram_id, username, role) VALUES (?, ?, 2)',
            args: [telegramId, 'hidecard1']
        });
        console.log(`   Inserted record ID: ${insertResult.lastInsertRowid}`);
        
        // Step 3: Immediate verification
        console.log('🔍 Step 3: Verifying insertion...');
        const verifyResult = await client.execute({
            sql: 'SELECT telegram_id, username, role FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        if (verifyResult.rows.length > 0) {
            const user = verifyResult.rows[0];
            console.log('✅ Final Admin Status:');
            console.log(`   Record ID: ${insertResult.lastInsertRowid}`);
            console.log(`   Telegram ID: ${user.telegram_id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Role: ${user.role} (0=User, 1=Shop Admin, 2=Bot Admin)`);
            
            if (user.role === 2) {
                console.log('🎉 SUCCESS! You are now permanently a Bot Admin!');
                console.log('📱 Test your bot on Telegram now.');
            } else {
                console.log('❌ FAILED! Role is not 2, it is:', user.role);
            }
        } else {
            console.log('❌ Could not verify inserted record');
        }
        
    } catch (error) {
        console.error('❌ Error in final admin setup:', error.message);
        console.error('Stack:', error.stack);
    }
}

finalAdminSet();
