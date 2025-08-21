import { getDatabase } from '../config/database-postgres';
import { ScoreResult, CategoryScore, AssessmentResponse, Question, AssessmentCategory } from '../types';

export class ScoringService {
  
  /**
   * Calculate assessment score based on responses
   */
  async calculateScore(responses: Record<number, number>, templateId: number): Promise<ScoreResult> {
    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      // Get all questions with their categories
      const result = await client.query(`
        SELECT q.*, c.name as category_name, c.weight as category_weight
        FROM questions q
        JOIN assessment_categories c ON q.category_id = c.id
        WHERE q.is_active = true
        ORDER BY c.order_index, q.order_index
      `);
      
      const questions = result.rows;
      
      // Parse JSON options for each question
      const parsedQuestions = questions.map(question => ({
        ...question,
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
      }));
      
      // Calculate category scores
      const categoryScores: Record<number, CategoryScore> = {};
      const categoryTotals: Record<number, { score: number; maxScore: number; name: string; weight: number }> = {};
      
      // Initialize category totals
      for (const question of parsedQuestions) {
        if (!categoryTotals[question.category_id]) {
          categoryTotals[question.category_id] = {
            score: 0,
            maxScore: 0,
            name: question.category_name,
            weight: question.category_weight
          };
        }
      }
      
      // Calculate scores for each question
      for (const question of parsedQuestions) {
        const responseValue = responses[question.id];
        const categoryId = question.category_id;
        
        if (responseValue !== undefined) {
          // Find the points for this response
          const option = question.options.find((opt: any) => opt.value === responseValue);
          const points = option ? option.points : 0;
          
          categoryTotals[categoryId].score += points * question.weight;
        }
        
        // Calculate max possible score for this question
        const maxPoints = Math.max(...question.options.map((opt: any) => opt.points));
        categoryTotals[categoryId].maxScore += maxPoints * question.weight;
      }
      
      // Convert to CategoryScore format and calculate weighted total
      let totalWeightedScore = 0;
      let totalMaxWeightedScore = 0;
      
      for (const [categoryId, totals] of Object.entries(categoryTotals)) {
        const percentage = totals.maxScore > 0 ? (totals.score / totals.maxScore) * 100 : 0;
        const weightedScore = (percentage / 100) * totals.weight;
        
        categoryScores[parseInt(categoryId)] = {
          score: totals.score,
          maxScore: totals.maxScore,
          percentage: Math.round(percentage * 100) / 100,
          categoryName: totals.name
        };
        
        totalWeightedScore += weightedScore;
        totalMaxWeightedScore += totals.weight;
      }
      
      // Final total score out of 100
      const totalScore = Math.round((totalWeightedScore / totalMaxWeightedScore) * 100 * 100) / 100;
      
      // Calculate percentile rank
      const percentileRank = await this.calculatePercentileRank(totalScore);
      
      // Generate insights
      const strengths = this.identifyStrengths(categoryScores);
      const weaknesses = this.identifyWeaknesses(categoryScores);
      const recommendations = this.generateRecommendations(categoryScores);
      
      return {
        totalScore,
        categoryScores,
        percentileRank,
        strengths,
        weaknesses,
        recommendations
      };
      
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Calculate percentile rank based on historical data
   */
  private async calculatePercentileRank(score: number): Promise<number> {
    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT COUNT(*) as total_count,
               COUNT(CASE WHEN total_score < $1 THEN 1 END) as lower_count
        FROM assessments 
        WHERE total_score IS NOT NULL AND is_completed = true
      `, [score]);
      
      const { total_count, lower_count } = result.rows[0];
      
      if (parseInt(total_count) === 0) {
        return 50; // Default percentile if no historical data
      }
      
      const percentile = Math.round((parseInt(lower_count) / parseInt(total_count)) * 100);
      return Math.max(1, Math.min(99, percentile)); // Ensure between 1-99
      
    } catch (error) {
      console.error('Error calculating percentile rank:', error);
      return 50; // Default percentile on error
    } finally {
      client.release();
    }
  }
  
  /**
   * Identify strengths based on category scores
   */
  private identifyStrengths(categoryScores: Record<number, CategoryScore>): string[] {
    const strengths: string[] = [];
    
    for (const [categoryId, score] of Object.entries(categoryScores)) {
      if (score.percentage >= 80) {
        strengths.push(`Strong ${score.categoryName.toLowerCase()} with ${score.percentage}% score`);
      } else if (score.percentage >= 70) {
        strengths.push(`Good ${score.categoryName.toLowerCase()} foundation`);
      }
    }
    
    // Add specific strengths based on category performance
    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b.percentage - a.percentage);
    
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0][1];
      if (topCategory.percentage >= 60) {
        strengths.unshift(`${topCategory.categoryName} is your strongest area`);
      }
    }
    
    return strengths.slice(0, 5); // Limit to top 5 strengths
  }
  
  /**
   * Identify weaknesses based on category scores
   */
  private identifyWeaknesses(categoryScores: Record<number, CategoryScore>): string[] {
    const weaknesses: string[] = [];
    
    for (const [categoryId, score] of Object.entries(categoryScores)) {
      if (score.percentage < 40) {
        weaknesses.push(`${score.categoryName} needs significant improvement (${score.percentage}%)`);
      } else if (score.percentage < 60) {
        weaknesses.push(`${score.categoryName} has room for improvement`);
      }
    }
    
    return weaknesses.slice(0, 5); // Limit to top 5 weaknesses
  }
  
  /**
   * Generate recommendations based on category scores
   */
  private generateRecommendations(categoryScores: Record<number, CategoryScore>): string[] {
    const recommendations: string[] = [];
    
    for (const [categoryId, score] of Object.entries(categoryScores)) {
      const categoryName = score.categoryName.toLowerCase();
      
      if (score.percentage < 50) {
        switch (categoryName) {
          case 'market & opportunity':
            recommendations.push('Conduct thorough market research and validate your target market size');
            recommendations.push('Develop a clear competitive analysis and positioning strategy');
            break;
          case 'team & leadership':
            recommendations.push('Consider adding experienced advisors or co-founders to strengthen your team');
            recommendations.push('Highlight relevant industry experience and past achievements');
            break;
          case 'product & technology':
            recommendations.push('Focus on product development and achieving key technical milestones');
            recommendations.push('Consider intellectual property protection for your innovations');
            break;
          case 'traction & business model':
            recommendations.push('Develop pilot customers and validate your revenue model');
            recommendations.push('Focus on customer acquisition and retention metrics');
            break;
          case 'financial readiness':
            recommendations.push('Create detailed financial projections and funding requirements');
            recommendations.push('Develop a clear use of funds strategy with measurable milestones');
            break;
        }
      } else if (score.percentage < 70) {
        // Moderate improvement recommendations
        switch (categoryName) {
          case 'market & opportunity':
            recommendations.push('Refine your go-to-market strategy and customer segmentation');
            break;
          case 'team & leadership':
            recommendations.push('Consider expanding your advisory board with industry experts');
            break;
          case 'product & technology':
            recommendations.push('Focus on product-market fit and user feedback integration');
            break;
          case 'traction & business model':
            recommendations.push('Scale your customer acquisition efforts and improve unit economics');
            break;
          case 'financial readiness':
            recommendations.push('Strengthen your financial planning and scenario modeling');
            break;
        }
      }
    }
    
    // Add general recommendations based on overall score
    const averageScore = Object.values(categoryScores).reduce((sum, cat) => sum + cat.percentage, 0) / Object.keys(categoryScores).length;
    
    if (averageScore < 50) {
      recommendations.unshift('Focus on fundamental business development before seeking VC funding');
      recommendations.push('Consider angel investors or grants as interim funding sources');
    } else if (averageScore < 70) {
      recommendations.unshift('Address key weaknesses before approaching tier-1 VCs');
      recommendations.push('Consider seed-stage investors who can provide strategic guidance');
    } else {
      recommendations.unshift('You have a strong foundation for VC fundraising');
      recommendations.push('Focus on perfecting your pitch and identifying the right investor fit');
    }
    
    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }
  
  /**
   * Get industry benchmarks for comparison
   */
  async getIndustryBenchmarks(industry: string, stage: string): Promise<any> {
    const pool = await getDatabase();
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT category_averages, percentiles, sample_size
        FROM benchmarks
        WHERE industry = $1 AND stage = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `, [industry, stage]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          category_averages: typeof row.category_averages === 'string' ? JSON.parse(row.category_averages) : row.category_averages,
          percentiles: typeof row.percentiles === 'string' ? JSON.parse(row.percentiles) : row.percentiles,
          sample_size: row.sample_size
        };
      }
      
      // Return default benchmarks if no specific data found
      return {
        category_averages: {
          'Market & Opportunity': 65,
          'Team & Leadership': 60,
          'Product & Technology': 55,
          'Traction & Business Model': 50,
          'Financial Readiness': 45
        },
        percentiles: {
          '25th': 40,
          '50th': 60,
          '75th': 80,
          '90th': 90
        },
        sample_size: 0
      };
      
    } catch (error) {
      console.error('Error getting industry benchmarks:', error);
      // Return default benchmarks on error
      return {
        category_averages: {
          'Market & Opportunity': 65,
          'Team & Leadership': 60,
          'Product & Technology': 55,
          'Traction & Business Model': 50,
          'Financial Readiness': 45
        },
        percentiles: {
          '25th': 40,
          '50th': 60,
          '75th': 80,
          '90th': 90
        },
        sample_size: 0
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Update benchmarks with new assessment data
   */
  async updateBenchmarks(assessment: any, results: ScoreResult): Promise<void> {
    // This would be called after each assessment to update industry benchmarks
    // Implementation would aggregate data by industry and stage
    // For now, we'll skip this to keep the initial implementation simple
  }
}

export const scoringService = new ScoringService();
