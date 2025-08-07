import { pool } from '../config/database';

const assessmentQuestions = [
  // Market & Opportunity (Category ID: 1)
  {
    category_id: 1,
    text: "What is the total addressable market (TAM) for your solution?",
    description: "Consider the total market demand for your product or service",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Under $100M", points: 0 },
      { value: 1, text: "$100M - $500M", points: 1 },
      { value: 2, text: "$500M - $1B", points: 2 },
      { value: 3, text: "$1B - $10B", points: 4 },
      { value: 4, text: "Over $10B", points: 5 }
    ],
    order_index: 1
  },
  {
    category_id: 1,
    text: "What is the annual growth rate of your target market?",
    description: "Market growth indicates opportunity and timing",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Declining market", points: 0 },
      { value: 1, text: "Flat (0-2% growth)", points: 1 },
      { value: 2, text: "Growing (3-10% annually)", points: 2 },
      { value: 3, text: "Fast growth (11-25% annually)", points: 4 },
      { value: 4, text: "Explosive growth (>25% annually)", points: 5 }
    ],
    order_index: 2
  },
  {
    category_id: 1,
    text: "How well have you validated the problem you're solving?",
    description: "Problem validation is crucial for product-market fit",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No validation yet", points: 0 },
      { value: 1, text: "Based on assumptions only", points: 1 },
      { value: 2, text: "Some market research conducted", points: 2 },
      { value: 3, text: "Extensive customer interviews", points: 4 },
      { value: 4, text: "Customers paying for solution", points: 5 }
    ],
    order_index: 3
  },
  {
    category_id: 1,
    text: "What is your competitive advantage?",
    description: "Sustainable competitive advantages create defensible businesses",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No clear advantage", points: 0 },
      { value: 1, text: "Minor feature differences", points: 1 },
      { value: 2, text: "Some differentiation", points: 2 },
      { value: 3, text: "Strong competitive moat", points: 4 },
      { value: 4, text: "Unique IP or breakthrough technology", points: 5 }
    ],
    order_index: 4
  },
  {
    category_id: 1,
    text: "How developed is your go-to-market strategy?",
    description: "Clear path to customers is essential for scaling",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No strategy defined", points: 0 },
      { value: 1, text: "Basic plan outlined", points: 1 },
      { value: 2, text: "Defined channels and tactics", points: 2 },
      { value: 3, text: "Proven channels with metrics", points: 4 },
      { value: 4, text: "Scalable, repeatable system", points: 5 }
    ],
    order_index: 5
  },

  // Team & Leadership (Category ID: 2)
  {
    category_id: 2,
    text: "What is your experience as a founder?",
    description: "Founder experience significantly impacts success probability",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "First-time founder, no relevant experience", points: 1 },
      { value: 1, text: "Some entrepreneurial experience", points: 2 },
      { value: 2, text: "Relevant industry experience", points: 3 },
      { value: 3, text: "Previous successful exit", points: 4 },
      { value: 4, text: "Serial entrepreneur with multiple exits", points: 5 }
    ],
    order_index: 1
  },
  {
    category_id: 2,
    text: "How complete is your founding team?",
    description: "Strong teams with complementary skills perform better",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Solo founder", points: 1 },
      { value: 1, text: "2 co-founders", points: 2 },
      { value: 2, text: "Core team (3-4 people)", points: 3 },
      { value: 3, text: "Full team across key functions", points: 4 },
      { value: 4, text: "Complete team plus advisors", points: 5 }
    ],
    order_index: 2
  },
  {
    category_id: 2,
    text: "What is your team's domain expertise?",
    description: "Deep industry knowledge provides significant advantages",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Learning the industry", points: 1 },
      { value: 1, text: "Basic industry knowledge", points: 2 },
      { value: 2, text: "Good understanding of market", points: 3 },
      { value: 3, text: "Deep industry expertise", points: 4 },
      { value: 4, text: "Recognized industry leaders", points: 5 }
    ],
    order_index: 3
  },
  {
    category_id: 2,
    text: "How strong is your advisory board?",
    description: "Quality advisors provide guidance, credibility, and connections",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No advisors", points: 0 },
      { value: 1, text: "Friends and family advisors", points: 1 },
      { value: 2, text: "Some relevant advisors", points: 2 },
      { value: 3, text: "Strong industry advisors", points: 4 },
      { value: 4, text: "Top-tier advisors and mentors", points: 5 }
    ],
    order_index: 4
  },

  // Product & Technology (Category ID: 3)
  {
    category_id: 3,
    text: "What stage is your product development?",
    description: "Product maturity affects risk and time to market",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Idea stage only", points: 0 },
      { value: 1, text: "Working prototype", points: 1 },
      { value: 2, text: "Minimum viable product (MVP)", points: 2 },
      { value: 3, text: "Beta product with users", points: 4 },
      { value: 4, text: "Market-ready product", points: 5 }
    ],
    order_index: 1
  },
  {
    category_id: 3,
    text: "How technically differentiated is your solution?",
    description: "Technical innovation can create sustainable advantages",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No technical differentiation", points: 0 },
      { value: 1, text: "Minor technical improvements", points: 1 },
      { value: 2, text: "Notable technical features", points: 2 },
      { value: 3, text: "Significant technical innovation", points: 4 },
      { value: 4, text: "Breakthrough technology", points: 5 }
    ],
    order_index: 2
  },
  {
    category_id: 3,
    text: "What intellectual property do you have?",
    description: "IP protection can provide competitive moats",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No intellectual property", points: 0 },
      { value: 1, text: "Trade secrets and know-how", points: 1 },
      { value: 2, text: "Pending patent applications", points: 2 },
      { value: 3, text: "Granted patents", points: 4 },
      { value: 4, text: "Strong IP portfolio", points: 5 }
    ],
    order_index: 3
  },
  {
    category_id: 3,
    text: "How scalable is your technology platform?",
    description: "Scalability is crucial for venture-scale returns",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Mostly manual processes", points: 0 },
      { value: 1, text: "Some automation in place", points: 1 },
      { value: 2, text: "Mostly automated and scalable", points: 2 },
      { value: 3, text: "Highly scalable architecture", points: 4 },
      { value: 4, text: "Infinitely scalable platform", points: 5 }
    ],
    order_index: 4
  },

  // Traction & Business Model (Category ID: 4)
  {
    category_id: 4,
    text: "How clear is your revenue model?",
    description: "Clear path to monetization is essential",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No revenue model defined", points: 0 },
      { value: 1, text: "Unclear or unproven model", points: 1 },
      { value: 2, text: "Defined revenue model", points: 2 },
      { value: 3, text: "Proven revenue model", points: 4 },
      { value: 4, text: "Multiple revenue streams", points: 5 }
    ],
    order_index: 1
  },
  {
    category_id: 4,
    text: "What customer traction do you have?",
    description: "Customer validation reduces market risk",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No customers yet", points: 0 },
      { value: 1, text: "Letters of intent or interest", points: 1 },
      { value: 2, text: "Pilot customers", points: 2 },
      { value: 3, text: "Paying customers", points: 4 },
      { value: 4, text: "Growing customer base", points: 5 }
    ],
    order_index: 2
  },
  {
    category_id: 4,
    text: "What is your current monthly recurring revenue (MRR)?",
    description: "Revenue growth demonstrates market validation",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No revenue yet", points: 0 },
      { value: 1, text: "Under $10K MRR", points: 1 },
      { value: 2, text: "$10K - $50K MRR", points: 2 },
      { value: 3, text: "$50K - $200K MRR", points: 4 },
      { value: 4, text: "Over $200K MRR", points: 5 }
    ],
    order_index: 3
  },
  {
    category_id: 4,
    text: "How well do you understand your unit economics?",
    description: "Understanding unit economics is crucial for scaling",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Don't know unit economics", points: 0 },
      { value: 1, text: "Unit economics are negative", points: 1 },
      { value: 2, text: "Break-even unit economics", points: 2 },
      { value: 3, text: "Positive unit economics", points: 4 },
      { value: 4, text: "Strong margins and LTV/CAC", points: 5 }
    ],
    order_index: 4
  },

  // Financial Readiness (Category ID: 5)
  {
    category_id: 5,
    text: "How detailed is your financial planning?",
    description: "Financial planning shows business maturity",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "No financial planning", points: 0 },
      { value: 1, text: "Basic revenue projections", points: 1 },
      { value: 2, text: "Detailed financial forecasts", points: 2 },
      { value: 3, text: "Scenario planning and modeling", points: 4 },
      { value: 4, text: "Sophisticated financial models", points: 5 }
    ],
    order_index: 1
  },
  {
    category_id: 5,
    text: "How clear are your funding requirements?",
    description: "Clear funding needs demonstrate strategic thinking",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Unclear funding needs", points: 0 },
      { value: 1, text: "Rough funding estimate", points: 1 },
      { value: 2, text: "Defined funding amount", points: 2 },
      { value: 3, text: "Detailed funding breakdown", points: 4 },
      { value: 4, text: "Multiple funding scenarios", points: 5 }
    ],
    order_index: 2
  },
  {
    category_id: 5,
    text: "How specific is your use of funds strategy?",
    description: "Clear use of funds shows execution capability",
    type: "multiple_choice",
    weight: 5,
    options: [
      { value: 0, text: "Vague use of funds", points: 0 },
      { value: 1, text: "General spending categories", points: 1 },
      { value: 2, text: "Specific fund allocation", points: 2 },
      { value: 3, text: "Detailed milestones and ROI", points: 4 },
      { value: 4, text: "ROI projections by category", points: 5 }
    ],
    order_index: 3
  }
];

export async function seedQuestions(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if questions already exist
    const questionsResult = await client.query('SELECT COUNT(*) FROM questions');
    const questionsCount = parseInt(questionsResult.rows[0].count);

    if (questionsCount === 0) {
      console.log('🌱 Seeding assessment questions...');

      for (const question of assessmentQuestions) {
        await client.query(`
          INSERT INTO questions (category_id, text, description, type, weight, options, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          question.category_id,
          question.text,
          question.description,
          question.type,
          question.weight,
          JSON.stringify(question.options),
          question.order_index
        ]);
      }

      console.log(`✅ Successfully seeded ${assessmentQuestions.length} questions`);
    } else {
      console.log('📋 Questions already exist, skipping seed');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding questions:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedQuestions()
    .then(() => {
      console.log('✅ Question seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Question seeding failed:', error);
      process.exit(1);
    });
}
