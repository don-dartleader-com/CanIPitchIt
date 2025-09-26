import { Router } from 'express';
import { getDatabase } from '../config/database';
import { scoringService } from '../services/scoringService';

const router = Router();

// POST /api/assessments - Submit a new assessment
router.post('/', async (req, res) => {
  try {
    const { responses, sessionId, userInfo } = req.body;
    
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid responses format'
      });
    }

    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      // Calculate scores
      const scoreResult = await scoringService.calculateScore(responses, 1);
      
      // Insert assessment
      const assessmentResult = await client.query(`
        INSERT INTO assessments (
          session_id, responses, total_score, category_scores, 
          is_completed, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        sessionId || `session_${Date.now()}`,
        JSON.stringify(responses),
        scoreResult.totalScore,
        JSON.stringify(scoreResult.categoryScores),
        true,
        new Date().toISOString()
      ]);

      const assessmentId = assessmentResult.rows[0].id;

      // Insert assessment results
      await client.query(`
        INSERT INTO assessment_results (
          assessment_id, strengths, weaknesses, recommendations, percentile_rank
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        assessmentId,
        JSON.stringify(scoreResult.strengths),
        JSON.stringify(scoreResult.weaknesses),
        JSON.stringify(scoreResult.recommendations),
        scoreResult.percentileRank
      ]);

      return res.json({
        success: true,
        data: {
          id: assessmentId,
          totalScore: scoreResult.totalScore,
          categoryScores: scoreResult.categoryScores,
          strengths: scoreResult.strengths,
          weaknesses: scoreResult.weaknesses,
          recommendations: scoreResult.recommendations,
          percentileRank: scoreResult.percentileRank
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit assessment'
    });
  }
});

// GET /api/assessments/:id - Get assessment results
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          a.*,
          r.strengths,
          r.weaknesses,
          r.recommendations,
          r.percentile_rank,
          r.industry_comparison
        FROM assessments a
        LEFT JOIN assessment_results r ON a.id = r.assessment_id
        WHERE a.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      const assessment = result.rows[0];

      // Parse JSON fields - PostgreSQL JSONB fields are already parsed
      const parsedResult = {
        ...assessment,
        responses: typeof assessment.responses === 'string' ? JSON.parse(assessment.responses) : assessment.responses,
        category_scores: typeof assessment.category_scores === 'string' ? JSON.parse(assessment.category_scores) : assessment.category_scores,
        strengths: typeof assessment.strengths === 'string' ? JSON.parse(assessment.strengths || '[]') : assessment.strengths || [],
        weaknesses: typeof assessment.weaknesses === 'string' ? JSON.parse(assessment.weaknesses || '[]') : assessment.weaknesses || [],
        recommendations: typeof assessment.recommendations === 'string' ? JSON.parse(assessment.recommendations || '[]') : assessment.recommendations || [],
        industry_comparison: assessment.industry_comparison && typeof assessment.industry_comparison === 'string' ? JSON.parse(assessment.industry_comparison) : assessment.industry_comparison
      };

      return res.json({
        success: true,
        data: parsedResult
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment'
    });
  }
});

// GET /api/assessments/session/:sessionId - Get assessment by session ID
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          a.*,
          r.strengths,
          r.weaknesses,
          r.recommendations,
          r.percentile_rank,
          r.industry_comparison
        FROM assessments a
        LEFT JOIN assessment_results r ON a.id = r.assessment_id
        WHERE a.session_id = $1
        ORDER BY a.created_at DESC
        LIMIT 1
      `, [sessionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      const assessment = result.rows[0];

      // Parse JSON fields - PostgreSQL JSONB fields are already parsed
      const parsedResult = {
        ...assessment,
        responses: typeof assessment.responses === 'string' ? JSON.parse(assessment.responses) : assessment.responses,
        category_scores: typeof assessment.category_scores === 'string' ? JSON.parse(assessment.category_scores) : assessment.category_scores,
        strengths: typeof assessment.strengths === 'string' ? JSON.parse(assessment.strengths || '[]') : assessment.strengths || [],
        weaknesses: typeof assessment.weaknesses === 'string' ? JSON.parse(assessment.weaknesses || '[]') : assessment.weaknesses || [],
        recommendations: typeof assessment.recommendations === 'string' ? JSON.parse(assessment.recommendations || '[]') : assessment.recommendations || [],
        industry_comparison: assessment.industry_comparison && typeof assessment.industry_comparison === 'string' ? JSON.parse(assessment.industry_comparison) : assessment.industry_comparison
      };

      return res.json({
        success: true,
        data: parsedResult
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching assessment by session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment'
    });
  }
});

export default router;
