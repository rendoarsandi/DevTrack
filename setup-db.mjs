import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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