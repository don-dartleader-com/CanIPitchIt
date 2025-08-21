"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_postgres_1 = require("../config/database-postgres");
const scoringService_1 = require("../services/scoringService");
async function testCompleteAssessment() {
    console.log('🧪 Testing complete assessment flow...');
    try {
        const pool = await (0, database_postgres_1.getDatabase)();
        const client = await pool.connect();
        try {
            const result = await client.query(`
        SELECT id, options FROM questions 
        WHERE is_active = true 
        ORDER BY order_index
      `);
            const questions = result.rows;
            console.log(`📋 Found ${questions.length} questions`);
            const responses = {};
            for (const question of questions) {
                const options = JSON.parse(question.options);
                const selectedOption = options[Math.min(3, options.length - 1)];
                responses[question.id] = selectedOption.value;
            }
            console.log('📝 Created sample responses:', Object.keys(responses).length, 'answers');
            console.log('🧮 Calculating assessment score...');
            const results = await scoringService_1.scoringService.calculateScore(responses, 1);
            console.log('✅ Assessment Results:');
            console.log(`   Total Score: ${results.totalScore}/100`);
            console.log(`   Percentile Rank: ${results.percentileRank}th`);
            console.log(`   Categories: ${Object.keys(results.categoryScores).length}`);
            console.log(`   Strengths: ${results.strengths.length}`);
            console.log(`   Weaknesses: ${results.weaknesses.length}`);
            console.log(`   Recommendations: ${results.recommendations.length}`);
            console.log('💾 Saving assessment to database...');
            const assessmentResult = await client.query(`
        INSERT INTO assessments (
          template_id, session_id, responses, total_score, 
          category_scores, is_completed, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
                1,
                'test-session-' + Date.now(),
                JSON.stringify(responses),
                results.totalScore,
                JSON.stringify(results.categoryScores),
                true,
                new Date().toISOString()
            ]);
            const assessmentId = assessmentResult.rows[0].id;
            console.log(`✅ Assessment saved with ID: ${assessmentId}`);
            console.log('🔍 Testing assessment retrieval...');
            const savedAssessmentResult = await client.query(`
        SELECT * FROM assessments WHERE id = $1
      `, [assessmentId]);
            if (savedAssessmentResult.rows.length > 0) {
                const savedAssessment = savedAssessmentResult.rows[0];
                console.log('✅ Assessment retrieved successfully');
                console.log(`   ID: ${savedAssessment.id}`);
                console.log(`   Score: ${savedAssessment.total_score}`);
                console.log(`   Completed: ${savedAssessment.is_completed ? 'Yes' : 'No'}`);
            }
            console.log('\n🎉 Test completed successfully!');
            console.log(`🌐 You can view results at: http://localhost:3000/results/${assessmentId}`);
            return assessmentId;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}
testCompleteAssessment()
    .then((assessmentId) => {
    console.log(`\n✅ Test Assessment ID: ${assessmentId}`);
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=testAssessment.js.map