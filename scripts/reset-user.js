const { createClient } = require('@libsql/client');
require('dotenv').config();

async function resetUser() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const telegramId = 7398914587;
    
    try {
        // Reset role to regular user (role = 0)
        await client.execute({
            sql: 'UPDATE users SET role = 0 WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        console.log(`✅ User ${telegramId} reset to regular user (role = 0)!`);
        
        // Verify change
        const result = await client.execute({
            sql: 'SELECT telegram_id, username, role FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(`📊 User Info:`);
            console.log(`   Telegram ID: ${user.telegram_id}`);
            console.log(`   Username: ${user.username || 'N/A'}`);
            console.log(`   Role: ${user.role} (0=User, 1=Shop Admin, 2=Bot Admin)`);
        } else {
            console.log(`❌ User ${telegramId} not found in database`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting user:', error.message);
    }
}

resetUser();
