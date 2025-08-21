import { Pool } from 'pg';
export declare const initializeConnection: () => Promise<Pool>;
export declare const getDatabase: () => Promise<Pool>;
export declare const testConnection: () => Promise<boolean>;
export declare const initializeDatabase: () => Promise<void>;
export declare const seedDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
//# sourceMappingURL=database-postgres.d.ts.map