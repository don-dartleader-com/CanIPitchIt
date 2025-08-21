"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_postgres_1 = require("../config/database-postgres");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const pool = await (0, database_postgres_1.getDatabase)();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM assessment_categories 
        WHERE is_active = true 
        ORDER BY order_index
      `);
            res.json({
                success: true,
                data: result.rows
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, database_postgres_1.getDatabase)();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM assessment_categories 
        WHERE id = $1 AND is_active = true
      `, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }
            return res.json({
                success: true,
                data: result.rows[0]
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error fetching category:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch category'
        });
    }
});
router.get('/:id/questions', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, database_postgres_1.getDatabase)();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT 
          q.*,
          c.name as category_name,
          c.description as category_description
        FROM questions q
        JOIN assessment_categories c ON q.category_id = c.id
        WHERE q.category_id = $1 AND q.is_active = true AND c.is_active = true
        ORDER BY q.order_index
      `, [id]);
            res.json({
                success: true,
                data: result.rows
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Error fetching questions for category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions for category'
        });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map