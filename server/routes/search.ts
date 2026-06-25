import express from 'express';
import { SearchService } from '../services/search.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { advancedSearchSchema } from '../types/search.js';
import { getDatabase } from '../index.js';

const router = express.Router();

// Advanced search endpoint
router.post('/expenses', authenticateToken, (req, res) => {
  try {
    const validatedParams = advancedSearchSchema.parse(req.body);
    const db = getDatabase();
    const searchService = new SearchService(db);
    
    const results = searchService.searchExpenses(req.user!.id, validatedParams);
    res.json(results);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;