import { getDatabase } from '../config/database';
import { scoringService } from '../services/scoringService';

async function testLowScoreAssessment() {
  console.log('🧪 Testing low score assessment flow...');
  
  try {
    const db = await getDatabase();
    
    // Get all questions
    const questions = await db.all(`
      SELECT * FROM questions 
      WHERE is_active = 1 
      ORDER BY category_id, order_index
    `);
    
    console.log(`📋 Found ${questions.length} questions`);
    
    // Create responses with lowest possible scores (value 1 for all questions)
    const responses: Record<number, number> = {};
    questions.forEach(question => {
      responses[question.id] = 1; // Always select the lowest scoring option
    });
    
    console.log(`📝 Created low-score responses: ${Object.keys(responses).length} answers`);
    
    // Calculate score
    console.log('🧮 Calculating assessment score...');
    const scoreResult = await scoringService.calculateScore(responses, 1);
    
    console.log('✅ Assessment Results:');
    console.log(`   Total Score: ${scoreResult.totalScore}/100`);
    console.log(`   Percentile Rank: ${scoreResult.percentileRank}th`);
    console.log(`   Categories: ${Object.keys(scoreResult.categoryScores).length}`);
    console.log(`   Strengths: ${scoreResult.strengths.length}`);
    console.log(`   Weaknesses: ${scoreResult.weaknesses.length}`);
    console.log(`   Recommendations: ${scoreResult.recommendations.length}`);
    
    // Save to database
    console.log('💾 Saving assessment to database...');
    const result = await db.run(`
      INSERT INTO assessments (
        session_id, responses, total_score, category_scores, 
        is_completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `low_score_test_${Date.now()}`,
      JSON.stringify(responses),
      scoreResult.totalScore,
      JSON.stringify(scoreResult.categoryScores),
      1,
      new Date().toISOString()
    ]);

    const assessmentId = result.lastID;
    console.log(`✅ Assessment saved with ID: ${assessmentId}`);

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

    // Test retrieval
    console.log('🔍 Testing assessment retrieval...');
    const assessment = await db.get(`
      SELECT 
        a.*,
        r.strengths,
        r.weaknesses,
        r.recommendations,
        r.percentile_rank
      FROM assessments a
      LEFT JOIN assessment_results r ON a.id = r.assessment_id
      WHERE a.id = ?
    `, [assessmentId]);

    if (assessment) {
      console.log('✅ Assessment retrieved successfully');
      console.log(`   ID: ${assessment.id}`);
      console.log(`   Score: ${assessment.total_score}`);
      console.log(`   Completed: ${assessment.is_completed ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Failed to retrieve assessment');
    }

    console.log('\n🎉 Low score test completed successfully!');
    console.log(`🌐 You can view results at: http://localhost:3000/results/${assessmentId}`);
    console.log(`\n✅ Test Assessment ID: ${assessmentId}`);
    
  } catch (error) {
    console.error('❌ Error during low score test:', error);
    throw error;
  }
}

// Run the test
testLowScoreAssessment().catch(console.error);
