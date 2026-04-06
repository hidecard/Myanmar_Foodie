const { createClient } = require('@libsql/client');
require('dotenv').config();

async function diagnoseIssue() {
    const telegramId = 7398914587;
    
    console.log('🔍 Diagnosing database issue...');
    console.log(`📊 Database URL: ${process.env.TURSO_DATABASE_URL}`);
    console.log(`🔑 Auth Token: ${process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Missing'}`);
    
    try {
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Test 1: Count all records for this user
        console.log('\n📋 Test 1: Counting records...');
        const countResult = await client.execute({
            sql: 'SELECT COUNT(*) as count FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        console.log(`   Found ${countResult.rows[0].count} records`);

        // Test 2: Get all records for this user
        console.log('\n📋 Test 2: All records...');
        const allResult = await client.execute({
            sql: 'SELECT * FROM users WHERE telegram_id = ?',
            args: [telegramId]
        });
        
        allResult.rows.forEach((row, index) => {
            console.log(`   Record ${index + 1}:`);
            console.log(`     Telegram ID: ${row.telegram_id}`);
            console.log(`     Username: ${row.username}`);
            console.log(`     Role: ${row.role}`);
            console.log(`     Created: ${row.created_at}`);
            console.log(`     Updated: ${row.updated_at}`);
        });

        // Test 3: Try to get latest record
        console.log('\n📋 Test 3: Latest record...');
        const latestResult = await client.execute({
            sql: 'SELECT * FROM users WHERE telegram_id = ? ORDER BY updated_at DESC LIMIT 1',
            args: [telegramId]
        });
        
        if (latestResult.rows.length > 0) {
            const latest = latestResult.rows[0];
            console.log(`   Latest Role: ${latest.role}`);
            console.log(`   Latest Updated: ${latest.updated_at}`);
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

diagnoseIssue();
