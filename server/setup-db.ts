import { Database } from './database.js';

console.log('Setting up database...');
const db = Database.getInstance();
console.log('Database initialized successfully!');
console.log('Default categories have been created.');
process.exit(0);