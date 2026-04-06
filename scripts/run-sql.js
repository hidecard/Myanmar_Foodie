const { createClient } = require('@libsql/client');
require('dotenv').config();

// Get SQL query from command line arguments
const sqlQuery = process.argv[2];

if (!sqlQuery) {
    console.log('Usage: node scripts/run-sql.js "YOUR_SQL_QUERY"');
    console.log('Example: node scripts/run-sql.js "SELECT * FROM users WHERE role = 2"');
    process.exit(1);
}

async function runCustomQuery() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        const result = await client.execute(sqlQuery);
        console.log('✅ Query executed successfully!');
        console.log('📊 Results:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('❌ Error running query:', error.message);
    }
}

runCustomQuery();
