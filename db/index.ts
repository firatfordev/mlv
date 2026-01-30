import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schema"; // 1. Şemayı import et


import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const connectionString = process.env.DATABASE_URL;

const sql = neon(connectionString!);

// 2. Şemayı drizzle fonksiyonuna ikinci parametre olarak ver
export const db = drizzle(sql, { schema });



