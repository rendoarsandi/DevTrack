const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Read schema SQL
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function createTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Execute the schema SQL directly
    await pool.query(schemaSql);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating database tables:', err);
  } finally {
    await pool.end();
  }
}

createTables().catch(console.error);