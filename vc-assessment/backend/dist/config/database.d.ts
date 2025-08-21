import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
export declare const initializeConnection: () => Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare const getDatabase: () => Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare const testConnection: () => Promise<boolean>;
export declare const initializeDatabase: () => Promise<void>;
export declare const seedDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map