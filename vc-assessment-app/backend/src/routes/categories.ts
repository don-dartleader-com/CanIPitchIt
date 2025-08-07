import { Router } from 'express';
import { getDatabase } from '../config/database';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const categories = await db.all(`
      SELECT * FROM assessment_categories 
      WHERE is_active = 1 
      ORDER BY order_index
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// GET /api/categories/:id - Get a specific category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    const category = await db.get(`
      SELECT * FROM assessment_categories 
      WHERE id = ? AND is_active = 1
    `, [id]);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    return res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

// GET /api/categories/:id/questions - Get questions for a specific category
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    const questions = await db.all(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      JOIN assessment_categories c ON q.category_id = c.id
      WHERE q.category_id = ? AND q.is_active = 1 AND c.is_active = 1
      ORDER BY q.order_index
    `, [id]);

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions for category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions for category'
    });
  }
});

export default router;
