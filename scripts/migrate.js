const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    try {
        console.log('🔄 Starting database migration...');
        
        // Initialize Turso client
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await client.execute(schema);
        
        console.log('✅ Database migration completed successfully!');
        
        // Test connection
        const result = await client.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users table created with ${result.rows[0].count} initial records`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
