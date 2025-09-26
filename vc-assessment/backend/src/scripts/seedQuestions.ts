import { getDatabase, initializeDatabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const questions = [
  // Market & Opportunity (Category 1)
  {
    categoryId: 1,
    text: "What is the size of your total addressable market (TAM)?",
    description: "Estimate the total market opportunity for your product or service",
    type: "multiple_choice",
    weight: 5,
    orderIndex: 1,
    options: [
      { value: 1, label: "Less than $100M", score: 1 },
      { value: 2, label: "$100M - $1B", score: 3 },
      { value: 3, label: "$1B - $10B", score: 4 },
      { value: 4, label: "More than $10B", score: 5 }
    ]
  },
  {
    categoryId: 1,
    text: "How would you describe your market's growth rate?",
    description: "Annual growth rate of your target market",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 2,
    options: [
      { value: 1, label: "Declining or flat (0% or less)", score: 1 },
      { value: 2, label: "Slow growth (1-5%)", score: 2 },
      { value: 3, label: "Moderate growth (6-15%)", score: 3 },
      { value: 4, label: "High growth (16-30%)", score: 4 },
      { value: 5, label: "Explosive growth (30%+)", score: 5 }
    ]
  },
  {
    categoryId: 1,
    text: "How many direct competitors do you have?",
    description: "Companies offering similar solutions to the same target market",
    type: "multiple_choice",
    weight: 3,
    orderIndex: 3,
    options: [
      { value: 1, label: "Many (10+)", score: 2 },
      { value: 2, label: "Several (5-9)", score: 3 },
      { value: 3, label: "Few (2-4)", score: 4 },
      { value: 4, label: "One main competitor", score: 4 },
      { value: 5, label: "No direct competitors", score: 5 }
    ]
  },
  {
    categoryId: 1,
    text: "What is your competitive advantage?",
    description: "What makes your solution unique and defensible",
    type: "multiple_choice",
    weight: 5,
    orderIndex: 4,
    options: [
      { value: 1, label: "No clear advantage", score: 1 },
      { value: 2, label: "Better pricing", score: 2 },
      { value: 3, label: "Better features/quality", score: 3 },
      { value: 4, label: "Proprietary technology/IP", score: 4 },
      { value: 5, label: "Network effects or strong moats", score: 5 }
    ]
  },

  // Team & Leadership (Category 2)
  {
    categoryId: 2,
    text: "How many years of relevant industry experience does the founding team have?",
    description: "Combined experience in your industry or related fields",
    type: "multiple_choice",
    weight: 5,
    orderIndex: 1,
    options: [
      { value: 1, label: "Less than 2 years", score: 1 },
      { value: 2, label: "2-5 years", score: 2 },
      { value: 3, label: "6-10 years", score: 3 },
      { value: 4, label: "11-20 years", score: 4 },
      { value: 5, label: "More than 20 years", score: 5 }
    ]
  },
  {
    categoryId: 2,
    text: "Have any founders previously built and exited a company?",
    description: "Track record of successful entrepreneurship",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 2,
    options: [
      { value: 1, label: "No, first-time founders", score: 2 },
      { value: 2, label: "Built companies but no exits", score: 3 },
      { value: 3, label: "One successful exit", score: 4 },
      { value: 4, label: "Multiple successful exits", score: 5 }
    ]
  },
  {
    categoryId: 2,
    text: "How complete is your core team?",
    description: "Key roles filled for your business model",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 3,
    options: [
      { value: 1, label: "Just founders", score: 1 },
      { value: 2, label: "Missing critical roles", score: 2 },
      { value: 3, label: "Most key roles filled", score: 3 },
      { value: 4, label: "All key roles filled", score: 4 },
      { value: 5, label: "Strong team with advisors", score: 5 }
    ]
  },
  {
    categoryId: 2,
    text: "What is the team's technical capability?",
    description: "Ability to build and scale your product",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 4,
    options: [
      { value: 1, label: "No technical co-founder", score: 1 },
      { value: 2, label: "Outsourced development", score: 2 },
      { value: 3, label: "Technical co-founder", score: 4 },
      { value: 4, label: "Strong technical team", score: 5 }
    ]
  },

  // Product & Technology (Category 3)
  {
    categoryId: 3,
    text: "What stage is your product development?",
    description: "Current state of your product or service",
    type: "multiple_choice",
    weight: 5,
    orderIndex: 1,
    options: [
      { value: 1, label: "Idea/concept stage", score: 1 },
      { value: 2, label: "Prototype/MVP", score: 2 },
      { value: 3, label: "Beta version with users", score: 3 },
      { value: 4, label: "Launched product", score: 4 },
      { value: 5, label: "Mature product with iterations", score: 5 }
    ]
  },
  {
    categoryId: 3,
    text: "How differentiated is your product?",
    description: "Uniqueness compared to existing solutions",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 2,
    options: [
      { value: 1, label: "Similar to existing products", score: 1 },
      { value: 2, label: "Minor improvements", score: 2 },
      { value: 3, label: "Significant improvements", score: 3 },
      { value: 4, label: "Novel approach", score: 4 },
      { value: 5, label: "Breakthrough innovation", score: 5 }
    ]
  },
  {
    categoryId: 3,
    text: "Do you have intellectual property protection?",
    description: "Patents, trademarks, or other IP protection",
    type: "multiple_choice",
    weight: 3,
    orderIndex: 3,
    options: [
      { value: 1, label: "No IP protection", score: 1 },
      { value: 2, label: "Trade secrets/know-how", score: 2 },
      { value: 3, label: "Trademarks", score: 3 },
      { value: 4, label: "Patents pending", score: 4 },
      { value: 5, label: "Granted patents", score: 5 }
    ]
  },
  {
    categoryId: 3,
    text: "How scalable is your technology/solution?",
    description: "Ability to handle growth without proportional cost increases",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 4,
    options: [
      { value: 1, label: "Not scalable (linear costs)", score: 1 },
      { value: 2, label: "Somewhat scalable", score: 2 },
      { value: 3, label: "Moderately scalable", score: 3 },
      { value: 4, label: "Highly scalable", score: 4 },
      { value: 5, label: "Infinitely scalable (software)", score: 5 }
    ]
  },

  // Traction & Business Model (Category 4)
  {
    categoryId: 4,
    text: "What is your current monthly recurring revenue (MRR) or monthly revenue?",
    description: "Current revenue run rate",
    type: "multiple_choice",
    weight: 5,
    orderIndex: 1,
    options: [
      { value: 1, label: "No revenue", score: 1 },
      { value: 2, label: "$1-$10K", score: 2 },
      { value: 3, label: "$10K-$100K", score: 3 },
      { value: 4, label: "$100K-$1M", score: 4 },
      { value: 5, label: "More than $1M", score: 5 }
    ]
  },
  {
    categoryId: 4,
    text: "What is your revenue growth rate?",
    description: "Month-over-month or year-over-year growth",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 2,
    options: [
      { value: 1, label: "Declining", score: 1 },
      { value: 2, label: "Flat (0%)", score: 2 },
      { value: 3, label: "Growing (1-20%)", score: 3 },
      { value: 4, label: "Fast growth (21-50%)", score: 4 },
      { value: 5, label: "Explosive growth (50%+)", score: 5 }
    ]
  },
  {
    categoryId: 4,
    text: "How many paying customers do you have?",
    description: "Current customer base size",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 3,
    options: [
      { value: 1, label: "No paying customers", score: 1 },
      { value: 2, label: "1-10 customers", score: 2 },
      { value: 3, label: "11-100 customers", score: 3 },
      { value: 4, label: "101-1000 customers", score: 4 },
      { value: 5, label: "1000+ customers", score: 5 }
    ]
  },
  {
    categoryId: 4,
    text: "What is your customer acquisition cost (CAC) to lifetime value (LTV) ratio?",
    description: "Unit economics of your business model",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 4,
    options: [
      { value: 1, label: "Don't know/haven't calculated", score: 1 },
      { value: 2, label: "LTV < CAC (negative)", score: 1 },
      { value: 3, label: "LTV = 1-3x CAC", score: 2 },
      { value: 4, label: "LTV = 3-5x CAC", score: 4 },
      { value: 5, label: "LTV > 5x CAC", score: 5 }
    ]
  },

  // Financial Readiness (Category 5)
  {
    categoryId: 5,
    text: "How much funding are you seeking?",
    description: "Amount of capital needed for next milestone",
    type: "multiple_choice",
    weight: 3,
    orderIndex: 1,
    options: [
      { value: 1, label: "Less than $100K", score: 2 },
      { value: 2, label: "$100K - $500K", score: 3 },
      { value: 3, label: "$500K - $2M", score: 4 },
      { value: 4, label: "$2M - $10M", score: 5 },
      { value: 5, label: "More than $10M", score: 4 }
    ]
  },
  {
    categoryId: 5,
    text: "How long will the funding last?",
    description: "Runway provided by the funding round",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 2,
    options: [
      { value: 1, label: "Less than 12 months", score: 1 },
      { value: 2, label: "12-18 months", score: 3 },
      { value: 3, label: "18-24 months", score: 4 },
      { value: 4, label: "24-36 months", score: 5 },
      { value: 5, label: "More than 36 months", score: 4 }
    ]
  },
  {
    categoryId: 5,
    text: "Do you have detailed financial projections?",
    description: "Quality of financial planning and forecasting",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 3,
    options: [
      { value: 1, label: "No financial projections", score: 1 },
      { value: 2, label: "Basic revenue projections", score: 2 },
      { value: 3, label: "Detailed P&L projections", score: 3 },
      { value: 4, label: "Full financial model", score: 4 },
      { value: 5, label: "Scenario-based models", score: 5 }
    ]
  },
  {
    categoryId: 5,
    text: "What will you use the funding for?",
    description: "Primary use of investment capital",
    type: "multiple_choice",
    weight: 4,
    orderIndex: 4,
    options: [
      { value: 1, label: "General operations", score: 2 },
      { value: 2, label: "Product development", score: 3 },
      { value: 3, label: "Team expansion", score: 4 },
      { value: 4, label: "Marketing/customer acquisition", score: 4 },
      { value: 5, label: "Strategic mix of above", score: 5 }
    ]
  }
];

const seedQuestions = async (): Promise<void> => {
  try {
    console.log('🌱 Starting question seeding process...');
    
    const pool = await getDatabase();
    const client = await pool.connect();

    try {
      // Check if questions already exist
      const existingQuestions = await client.query('SELECT COUNT(*) as count FROM questions');
      const questionCount = parseInt(existingQuestions.rows[0].count);

      if (questionCount > 0) {
        console.log(`📊 Found ${questionCount} existing questions. Skipping seeding.`);
        return;
      }

      console.log('📝 Inserting questions into database...');

      // Insert questions
      for (const question of questions) {
        await client.query(`
          INSERT INTO questions (
            category_id, text, description, type, weight, options, order_index, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          question.categoryId,
          question.text,
          question.description,
          question.type,
          question.weight,
          JSON.stringify(question.options),
          question.orderIndex,
          true
        ]);
      }

      console.log(`✅ Successfully seeded ${questions.length} questions!`);

      // Verify seeding
      const finalCount = await client.query('SELECT COUNT(*) as count FROM questions');
      console.log(`📊 Total questions in database: ${finalCount.rows[0].count}`);

      // Show questions by category
      const categoryCounts = await client.query(`
        SELECT 
          c.name as category_name,
          COUNT(q.id) as question_count
        FROM assessment_categories c
        LEFT JOIN questions q ON c.id = q.category_id
        GROUP BY c.id, c.name
        ORDER BY c.order_index
      `);

      console.log('\n📋 Questions by category:');
      categoryCounts.rows.forEach(row => {
        console.log(`  ${row.category_name}: ${row.question_count} questions`);
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    throw error;
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedQuestions()
    .then(() => {
      console.log('🎉 Question seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Question seeding failed:', error);
      process.exit(1);
    });
}

export { seedQuestions };
export default seedQuestions;
