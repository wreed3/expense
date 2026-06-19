import express from 'express';
import cors from 'cors';
import { Database } from './database.js';
import { expenseRoutes } from './routes/expenses.js';
import { categoryRoutes } from './routes/categories.js';

const app = express();
const PORT = 3001;

// Initialize database
const db = Database.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});