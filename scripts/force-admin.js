const { createClient } = require('@libsql/client');
require('dotenv').config();

async function forceAdminRole() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const telegramId = 7398914587;
    
    try {
        console.log('🔄 Setting permanent admin role...');
        
        // First, delete any existing records to avoid conflicts
        await client.execute({
            sql: 'DELETE FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        console.log('🗑️ Deleted existing user record');
        
        // Insert fresh admin record
        await client.execute({
            sql: 'INSERT INTO users (telegram_id, username, role, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            args: [telegramId, 'hidecard1', 2]
        });
        console.log('➕ Created new admin record');
        
        // Verify the change
        const result = await client.execute({
            sql: 'SELECT telegram_id, username, role, created_at, updated_at FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Permanent Admin Status:');
            console.log(`   Telegram ID: ${user.telegram_id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Role: ${user.role} (0=User, 1=Shop Admin, 2=Bot Admin)`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Updated: ${user.updated_at}`);
            console.log('🎯 Role is now permanently set to Bot Admin!');
        } else {
            console.log('❌ Failed to create admin record');
        }
        
    } catch (error) {
        console.error('❌ Error forcing admin role:', error.message);
    }
}

forceAdminRole();
