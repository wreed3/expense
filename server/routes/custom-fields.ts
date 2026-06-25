import express from 'express';
import { CustomFieldsService } from '../services/custom-fields.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { createCustomFieldSchema, updateCustomFieldSchema } from '../types/custom-fields.js';
import { getDatabase } from '../index.js';

const router = express.Router();

// Get all custom fields for user
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    const fields = customFieldsService.getAllCustomFields(req.user!.id);
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get custom field by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    const field = customFieldsService.getCustomFieldById(Number(req.params.id), req.user!.id);
    
    if (!field) {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    
    res.json(field);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom field
router.post('/', authenticateToken, (req, res) => {
  try {
    const validatedData = createCustomFieldSchema.parse(req.body);
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    
    const field = customFieldsService.createCustomField(req.user!.id, validatedData);
    res.status(201).json(field);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid custom field data', details: error.errors });
    }
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Custom field with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update custom field
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const validatedData = updateCustomFieldSchema.parse(req.body);
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    
    const field = customFieldsService.updateCustomField(Number(req.params.id), req.user!.id, validatedData);
    res.json(field);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid custom field data', details: error.errors });
    }
    if (error.message === 'Custom field not found') {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete custom field
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    customFieldsService.deleteCustomField(Number(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Custom field not found') {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get custom fields for an expense
router.get('/expense/:expenseId', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    const fields = customFieldsService.getCustomFieldsByExpenseId(Number(req.params.expenseId), req.user!.id);
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set custom field values for an expense
router.put('/expense/:expenseId/values', authenticateToken, (req, res) => {
  try {
    const { values } = req.body;
    
    if (!Array.isArray(values)) {
      return res.status(400).json({ error: 'Values must be an array' });
    }
    
    const db = getDatabase();
    const customFieldsService = new CustomFieldsService(db);
    customFieldsService.setCustomFieldValues(Number(req.params.expenseId), values);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;