import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AssessmentResults } from '../types';
import apiService from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  RefreshCw,
  Share2,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const assessmentResults = await apiService.getAssessmentResults(parseInt(id!));
      setResults(assessmentResults);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load results';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return 'Exceptional - Top 10%';
    if (percentile >= 75) return 'Strong - Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Needs Improvement - Bottom 25%';
  };

  const handleTakeAnother = () => {
    navigate('/assessment');
  };

  const handleEmailResults = async () => {
    // This would implement email functionality
    toast.success('Email functionality coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadResults}
            className="btn-primary mr-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h2>
          <p className="text-gray-600 mb-4">The assessment results could not be found.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-12 w-12 text-primary-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Your VC Readiness Results
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Comprehensive assessment of your startup's funding readiness
          </p>
        </div>

        {/* Overall Score */}
        <div className="card mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary-100 mb-4">
              <span className="text-4xl font-bold text-primary-600">
                {Math.round(results.totalScore)}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Overall Score: {Math.round(results.totalScore)}/100
            </h2>
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-lg text-gray-600">
                  {results.percentileRank}th Percentile
                </span>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700">
              {getPercentileMessage(results.percentileRank || 50)}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={handleTakeAnother}
              className="btn-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Take Another Assessment
            </button>
            <button 
              onClick={handleEmailResults}
              className="btn-secondary"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Email Results
            </button>
            <button 
              onClick={() => toast.success('Download functionality coming soon!')}
              className="btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Category Breakdown</h3>
          <div className="space-y-6">
            {Object.entries(results.categoryScores).map(([categoryId, score]) => (
              <div key={categoryId} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {score.categoryName}
                  </h4>
                  <span className={`text-lg font-bold ${getScoreColor(score.percentage)}`}>
                    {Math.round(score.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      score.percentage >= 80 ? 'bg-green-500' :
                      score.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score.percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {score.score} out of {score.maxScore} points
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="card">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Key Strengths</h3>
            </div>
            {results.strengths && results.strengths.length > 0 ? (
              <ul className="space-y-3">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No specific strengths identified. Focus on improving your overall scores.</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="card">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Areas for Improvement</h3>
            </div>
            {results.weaknesses && results.weaknesses.length > 0 ? (
              <ul className="space-y-3">
                {results.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">Great job! No major weaknesses identified.</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <Target className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Personalized Recommendations</h3>
          </div>
          {results.recommendations && results.recommendations.length > 0 ? (
            <div className="space-y-4">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No specific recommendations available at this time.</p>
          )}
        </div>

        {/* Next Steps */}
        <div className="card text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Next?</h3>
          <p className="text-gray-600 mb-6">
            Based on your assessment results, here are some suggested next steps to improve your VC readiness.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Improve Your Score</h4>
              <p className="text-sm text-gray-600 mb-3">
                Work on the areas identified for improvement and retake the assessment.
              </p>
              <button 
                onClick={handleTakeAnother}
                className="btn-primary w-full"
              >
                Retake Assessment
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Get Expert Help</h4>
              <p className="text-sm text-gray-600 mb-3">
                Connect with advisors who can help you prepare for VC funding.
              </p>
              <button 
                onClick={() => toast.success('Advisor matching coming soon!')}
                className="btn-secondary w-full"
              >
                Find Advisors
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
              <p className="text-sm text-gray-600 mb-3">
                Create an account to track your progress over time.
              </p>
              <button 
                onClick={() => navigate('/register')}
                className="btn-secondary w-full"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
