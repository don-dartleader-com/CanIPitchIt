"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_postgres_1 = require("../config/database-postgres");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const db = await (0, database_postgres_1.getDatabase)();
        const client = await db.connect();
        const result = await client.query(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      ORDER BY q.category_id, q.order_index
    `);
        client.release();
        const questions = result.rows;
        const parsedQuestions = questions.map(question => ({
            ...question,
            options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
        }));
        res.json({
            success: true,
            data: parsedQuestions
        });
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await (0, database_postgres_1.getDatabase)();
        const client = await db.connect();
        const result = await client.query(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      WHERE q.id = $1
    `, [id]);
        client.release();
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }
        const question = result.rows[0];
        const parsedQuestion = {
            ...question,
            options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
        };
        return res.json({
            success: true,
            data: parsedQuestion
        });
    }
    catch (error) {
        console.error('Error fetching question:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch question'
        });
    }
});
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const db = await (0, database_postgres_1.getDatabase)();
        const client = await db.connect();
        const result = await client.query(`
      SELECT 
        q.*,
        c.name as category_name,
        c.description as category_description
      FROM questions q
      LEFT JOIN assessment_categories c ON q.category_id = c.id
      WHERE q.category_id = $1
      ORDER BY q.order_index
    `, [categoryId]);
        client.release();
        const questions = result.rows;
        const parsedQuestions = questions.map((question) => ({
            ...question,
            options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
        }));
        res.json({
            success: true,
            data: parsedQuestions
        });
    }
    catch (error) {
        console.error('Error fetching questions by category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions by category'
        });
    }
});
exports.default = router;
//# sourceMappingURL=questions.js.map