const { createClient } = require('@libsql/client');
require('dotenv').config();

async function checkCurrentRole() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const telegramId = 7398914587;
    
    try {
        // Get fresh data from database
        const result = await client.execute({
            sql: 'SELECT telegram_id, username, role, updated_at FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('📊 Current User Status:');
            console.log(`   Telegram ID: ${user.telegram_id}`);
            console.log(`   Username: ${user.username || 'N/A'}`);
            console.log(`   Role: ${user.role} (0=User, 1=Shop Admin, 2=Bot Admin)`);
            console.log(`   Last Updated: ${user.updated_at}`);
            
            // Force refresh by updating timestamp
            await client.execute({
                sql: 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
                args: [telegramId]
            });
            console.log('✅ Refreshed user timestamp');
            
        } else {
            console.log(`❌ User ${telegramId} not found in database`);
        }
        
    } catch (error) {
        console.error('❌ Error checking role:', error.message);
    }
}

checkCurrentRole();
