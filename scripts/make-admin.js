const { createClient } = require('@libsql/client');
require('dotenv').config();

async function makeAdmin() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const telegramId = 7398914587;
    
    try {
        await client.execute({
            sql: 'UPDATE users SET role = 2 WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        console.log(`✅ User ${telegramId} is now a Bot Admin!`);
        
        // Verify the change
        const result = await client.execute({
            sql: 'SELECT role FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        console.log(`📊 Current role: ${result.rows[0].role} (2 = Bot Admin)`);
        
    } catch (error) {
        console.error('❌ Error making admin:', error.message);
        
        // Try to create user first
        try {
            await client.execute({
                sql: 'INSERT OR IGNORE INTO users (telegram_id, username, role) VALUES (?, ?, ?)',
                args: [telegramId, 'admin_user', 2]
            });
            console.log(`✅ Created user ${telegramId} as Bot Admin!`);
        } catch (insertError) {
            console.error('❌ Error creating user:', insertError.message);
        }
    }
}

makeAdmin();
