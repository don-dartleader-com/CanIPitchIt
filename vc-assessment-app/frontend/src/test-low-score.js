// Test script to simulate low score assessment submission
const API_BASE = 'http://localhost:5001/api';

async function testLowScoreSubmission() {
  console.log('🧪 Testing low score frontend submission...');
  
  try {
    // Step 1: Get questions
    console.log('📋 Fetching questions...');
    const questionsResponse = await fetch(`${API_BASE}/questions`);
    const questionsData = await questionsResponse.json();
    const questions = questionsData.data;
    console.log(`Found ${questions.length} questions`);
    
    // Step 2: Create low score responses (all answers = 1)
    const responses = {};
    questions.forEach(question => {
      responses[question.id] = 1; // Lowest scoring option
    });
    console.log(`📝 Created ${Object.keys(responses).length} low-score responses`);
    
    // Step 3: Submit assessment
    console.log('🚀 Submitting assessment...');
    const submitResponse = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        responses: responses,
        sessionId: `frontend_test_${Date.now()}`
      })
    });
    
    if (!submitResponse.ok) {
      throw new Error(`HTTP ${submitResponse.status}: ${submitResponse.statusText}`);
    }
    
    const submitData = await submitResponse.json();
    console.log('✅ Assessment submitted successfully!');
    console.log(`   Assessment ID: ${submitData.data.id}`);
    console.log(`   Total Score: ${submitData.data.totalScore}/100`);
    console.log(`   Percentile: ${submitData.data.percentileRank}th`);
    
    // Step 4: Fetch results (simulating what frontend does)
    console.log('🔍 Fetching assessment results...');
    const resultsResponse = await fetch(`${API_BASE}/assessments/${submitData.data.id}`);
    const resultsData = await resultsResponse.json();
    
    console.log('✅ Results fetched successfully!');
    console.log(`   Score: ${resultsData.data.total_score}/100`);
    console.log(`   Strengths: ${JSON.parse(resultsData.data.strengths).length}`);
    console.log(`   Weaknesses: ${JSON.parse(resultsData.data.weaknesses).length}`);
    console.log(`   Recommendations: ${JSON.parse(resultsData.data.recommendations).length}`);
    
    console.log('\n🎉 Frontend low score test completed successfully!');
    console.log(`🌐 View results at: http://localhost:3000/results/${submitData.data.id}`);
    
    return submitData.data.id;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testLowScoreSubmission()
  .then(assessmentId => {
    console.log(`\n✅ Test Assessment ID: ${assessmentId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
