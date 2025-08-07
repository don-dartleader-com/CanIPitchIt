import { Router } from 'express';
import { getDatabase } from '../config/database';
import { scoringService } from '../services/scoringService';

const router = Router();

// POST /api/assessments - Submit a new assessment
router.post('/', async (req, res) => {
  try {
    const { responses, sessionId } = req.body;
    
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid responses format'
      });
    }

    const db = await getDatabase();
    
    // Calculate scores
    const scoreResult = await scoringService.calculateScore(responses, 1);
    
    // Insert assessment
    const result = await db.run(`
      INSERT INTO assessments (
        session_id, responses, total_score, category_scores, 
        is_completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      sessionId || `session_${Date.now()}`,
      JSON.stringify(responses),
      scoreResult.totalScore,
      JSON.stringify(scoreResult.categoryScores),
      1,
      new Date().toISOString()
    ]);

    const assessmentId = result.lastID;

    // Insert assessment results
    await db.run(`
      INSERT INTO assessment_results (
        assessment_id, strengths, weaknesses, recommendations, percentile_rank
      ) VALUES (?, ?, ?, ?, ?)
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
        assessmentId,
        totalScore: scoreResult.totalScore,
        categoryScores: scoreResult.categoryScores,
        strengths: scoreResult.strengths,
        weaknesses: scoreResult.weaknesses,
        recommendations: scoreResult.recommendations,
        percentileRank: scoreResult.percentileRank
      }
    });
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
    const db = await getDatabase();
    
    const assessment = await db.get(`
      SELECT 
        a.*,
        r.strengths,
        r.weaknesses,
        r.recommendations,
        r.percentile_rank,
        r.industry_comparison
      FROM assessments a
      LEFT JOIN assessment_results r ON a.id = r.assessment_id
      WHERE a.id = ?
    `, [id]);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    // Parse JSON fields
    const result = {
      ...assessment,
      responses: JSON.parse(assessment.responses || '[]'),
      category_scores: JSON.parse(assessment.category_scores || '{}'),
      strengths: JSON.parse(assessment.strengths || '[]'),
      weaknesses: JSON.parse(assessment.weaknesses || '[]'),
      recommendations: JSON.parse(assessment.recommendations || '[]'),
      industry_comparison: assessment.industry_comparison ? JSON.parse(assessment.industry_comparison) : null
    };

    return res.json({
      success: true,
      data: result
    });
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
    const db = await getDatabase();
    
    const assessment = await db.get(`
      SELECT 
        a.*,
        r.strengths,
        r.weaknesses,
        r.recommendations,
        r.percentile_rank,
        r.industry_comparison
      FROM assessments a
      LEFT JOIN assessment_results r ON a.id = r.assessment_id
      WHERE a.session_id = ?
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [sessionId]);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    // Parse JSON fields
    const result = {
      ...assessment,
      responses: JSON.parse(assessment.responses || '[]'),
      category_scores: JSON.parse(assessment.category_scores || '{}'),
      strengths: JSON.parse(assessment.strengths || '[]'),
      weaknesses: JSON.parse(assessment.weaknesses || '[]'),
      recommendations: JSON.parse(assessment.recommendations || '[]'),
      industry_comparison: assessment.industry_comparison ? JSON.parse(assessment.industry_comparison) : null
    };

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching assessment by session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment'
    });
  }
});

export default router;
