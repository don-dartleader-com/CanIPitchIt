import { Router } from 'express';
import { getDatabase } from '../config/database';

const router = Router();

// GET /api/questions - Get all questions
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const questions = await db.all(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      ORDER BY q.category_id, q.order_index
    `);

    // Parse JSON options for each question
    const parsedQuestions = questions.map(question => ({
      ...question,
      options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
    }));

    res.json({
      success: true,
      data: parsedQuestions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// GET /api/questions/:id - Get a specific question
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    const question = await db.get(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Parse JSON options
    const parsedQuestion = {
      ...question,
      options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
    };

    return res.json({
      success: true,
      data: parsedQuestion
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

// GET /api/questions/category/:categoryId - Get questions by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const db = await getDatabase();
    
    const questions = await db.all(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      WHERE q.category_id = ?
      ORDER BY q.order_index
    `, [categoryId]);

    // Parse JSON options for each question
    const parsedQuestions = questions.map(question => ({
      ...question,
      options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
    }));

    res.json({
      success: true,
      data: parsedQuestions
    });
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions by category'
    });
  }
});

export default router;
