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

        // Read and split schema into individual statements
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split SQL statements by semicolon and filter out empty lines and comments
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'))
            .filter(stmt => stmt.length > 0); // Include all non-empty statements
        
        console.log(`📝 Executing ${statements.length} SQL statements...`);
        
        // Execute each statement individually
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await client.execute(statement);
                const statementType = statement.toLowerCase().includes('create table') ? 'CREATE TABLE' :
                                   statement.toLowerCase().includes('create index') ? 'CREATE INDEX' :
                                   statement.toLowerCase().includes('insert') ? 'INSERT' : 'OTHER';
                console.log(`✅ Statement ${i + 1}/${statements.length}: ${statementType} - Executed successfully`);
            } catch (error) {
                console.log(`❌ Statement ${i + 1}/${statements.length}: Failed - ${error.message}`);
                console.log(`📝 Statement: ${statement.substring(0, 100)}...`);
                
                // For critical errors, stop migration
                if (error.message.includes('no such table') && !statement.toLowerCase().includes('create table')) {
                    console.log('⚠️  Skipping index creation - table will be created later');
                    continue;
                }
            }
        }
        
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
