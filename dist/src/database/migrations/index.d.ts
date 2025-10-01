import { D1Database } from '@cloudflare/workers-types';
export interface Migration {
    id: string;
    name: string;
    description: string;
    up: (db: D1Database) => Promise<void>;
    down: (db: D1Database) => Promise<void>;
    timestamp: string;
}
declare class MigrationRegistry {
    private migrations;
    register(migration: Migration): void;
    getMigration(id: string): Migration | undefined;
    getAllMigrations(): Migration[];
    getUnappliedMigrations(appliedMigrationIds: string[]): Migration[];
}
export declare const migrationRegistry: MigrationRegistry;
/**
 * Migration manager handles applying and tracking database migrations
 */
export declare class MigrationManager {
    private db;
    private registry;
    constructor(db: D1Database, registry?: MigrationRegistry);
    /**
     * Creates the necessary tables for tracking migrations
     */
    initialize(): Promise<void>;
    /**
     * Gets a list of already applied migrations
     */
    getAppliedMigrations(): Promise<string[]>;
    /**
     * Applies all unapplied migrations
     */
    runMigrations(): Promise<void>;
    /**
     * Rolls back the last migration
     */
    rollbackLastMigration(): Promise<void>;
}
export declare const initialSchemaMigration: Migration;
export {};
