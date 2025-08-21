"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_postgres_1 = require("../config/database-postgres");
const scoringService_1 = require("../services/scoringService");
async function testLowScoreAssessment() {
    console.log('🧪 Testing low score assessment flow...');
    try {
        const pool = await (0, database_postgres_1.getDatabase)();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT * FROM questions 
        WHERE is_active = true 
        ORDER BY category_id, order_index
      `);
            const questions = result.rows;
            console.log(`📋 Found ${questions.length} questions`);
            const responses = {};
            questions.forEach(question => {
                responses[question.id] = 1;
            });
            console.log(`📝 Created low-score responses: ${Object.keys(responses).length} answers`);
            console.log('🧮 Calculating assessment score...');
            const scoreResult = await scoringService_1.scoringService.calculateScore(responses, 1);
            console.log('✅ Assessment Results:');
            console.log(`   Total Score: ${scoreResult.totalScore}/100`);
            console.log(`   Percentile Rank: ${scoreResult.percentileRank}th`);
            console.log(`   Categories: ${Object.keys(scoreResult.categoryScores).length}`);
            console.log(`   Strengths: ${scoreResult.strengths.length}`);
            console.log(`   Weaknesses: ${scoreResult.weaknesses.length}`);
            console.log(`   Recommendations: ${scoreResult.recommendations.length}`);
            console.log('💾 Saving assessment to database...');
            const assessmentResult = await client.query(`
        INSERT INTO assessments (
          session_id, responses, total_score, category_scores, 
          is_completed, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
                `low_score_test_${Date.now()}`,
                JSON.stringify(responses),
                scoreResult.totalScore,
                JSON.stringify(scoreResult.categoryScores),
                true,
                new Date().toISOString()
            ]);
            const assessmentId = assessmentResult.rows[0].id;
            console.log(`✅ Assessment saved with ID: ${assessmentId}`);
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
            console.log('🔍 Testing assessment retrieval...');
            const assessmentRetrievalResult = await client.query(`
        SELECT 
          a.*,
          r.strengths,
          r.weaknesses,
          r.recommendations,
          r.percentile_rank
        FROM assessments a
        LEFT JOIN assessment_results r ON a.id = r.assessment_id
        WHERE a.id = $1
      `, [assessmentId]);
            if (assessmentRetrievalResult.rows.length > 0) {
                const assessment = assessmentRetrievalResult.rows[0];
                console.log('✅ Assessment retrieved successfully');
                console.log(`   ID: ${assessment.id}`);
                console.log(`   Score: ${assessment.total_score}`);
                console.log(`   Completed: ${assessment.is_completed ? 'Yes' : 'No'}`);
            }
            else {
                console.log('❌ Failed to retrieve assessment');
            }
            console.log('\n🎉 Low score test completed successfully!');
            console.log(`🌐 You can view results at: http://localhost:3000/results/${assessmentId}`);
            console.log(`\n✅ Test Assessment ID: ${assessmentId}`);
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Error during low score test:', error);
        throw error;
    }
}
testLowScoreAssessment().catch(console.error);
//# sourceMappingURL=testLowScore.js.map