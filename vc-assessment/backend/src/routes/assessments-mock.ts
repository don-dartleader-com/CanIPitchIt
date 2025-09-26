import { Router } from 'express';

const router = Router();

// Mock scoring function
const calculateMockScore = (responses: Record<string, number>) => {
  const scores = Object.values(responses);
  const totalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 20);
  
  return {
    totalScore,
    categoryScores: {
      'Market & Opportunity': Math.round(totalScore * 0.25),
      'Team & Leadership': Math.round(totalScore * 0.20),
      'Product & Technology': Math.round(totalScore * 0.20),
      'Traction & Business Model': Math.round(totalScore * 0.20),
      'Financial Readiness': Math.round(totalScore * 0.15)
    },
    strengths: totalScore > 70 ? ['Strong market opportunity', 'Experienced team'] : ['Clear vision'],
    weaknesses: totalScore < 50 ? ['Market validation needed', 'Team expansion required'] : ['Minor improvements needed'],
    recommendations: ['Focus on customer acquisition', 'Strengthen financial projections'],
    percentileRank: Math.min(95, Math.max(5, totalScore + Math.random() * 20 - 10))
  };
};

// POST /api/assessments - Submit a new assessment (mock version)
router.post('/', async (req, res) => {
  try {
    const { responses, sessionId, userInfo } = req.body;
    
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid responses format'
      });
    }

    // Calculate mock scores
    const scoreResult = calculateMockScore(responses);
    const assessmentId = Math.floor(Math.random() * 10000) + 1;

    console.log('Mock assessment submitted:', { assessmentId, sessionId, totalScore: scoreResult.totalScore });

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
  } catch (error) {
    console.error('Error submitting mock assessment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit assessment'
    });
  }
});

// GET /api/assessments/:id - Get assessment results (mock version)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock assessment data
    const mockAssessment = {
      id: parseInt(id),
      total_score: 75,
      category_scores: {
        'Market & Opportunity': 19,
        'Team & Leadership': 15,
        'Product & Technology': 15,
        'Traction & Business Model': 15,
        'Financial Readiness': 11
      },
      strengths: ['Strong market opportunity', 'Experienced team'],
      weaknesses: ['Minor improvements needed'],
      recommendations: ['Focus on customer acquisition', 'Strengthen financial projections'],
      percentile_rank: 78
    };

    return res.json({
      success: true,
      data: mockAssessment
    });
  } catch (error) {
    console.error('Error fetching mock assessment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment'
    });
  }
});

export default router;
