// For Node.js - make sure to install the 'ws' and 'bufferutil' packages
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) throw new Error("No Database Url Provider");

const db = drizzle({
  connection: DATABASE_URL,
  ws: ws,
});

export default db;
