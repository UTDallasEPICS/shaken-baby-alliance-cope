// server/utils/prisma.ts
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// FIX 1: We added Nuxt's root alias (~~/) and explicitly pointed to index.js to stop the Rollup Error
import { PrismaClient } from "~~/prisma/generated/client/index.js"; 

// FIX 2: better-sqlite3 requires the direct file path to your database file, 
// NOT the full "file:./dev.db" connection string URL. 
// Assuming your database is named dev.db and sits in the prisma folder:
const sqlite = new Database("prisma/dev.db"); 

// FIX 3: Pass the initialized database instance into the adapter
const adapter = new PrismaBetterSqlite3(sqlite);
const prisma = new PrismaClient({ adapter });

// In Nuxt server utils, default exports are the standard way to expose the client
export default prisma;