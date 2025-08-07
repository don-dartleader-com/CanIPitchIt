import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment, useAssessmentHelpers } from '../contexts/AssessmentContext';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    questions, 
    categories, 
    currentQuestionIndex, 
    responses, 
    isLoading, 
    error, 
    loadQuestions, 
    answerQuestion, 
    nextQuestion, 
    previousQuestion,
    submitAssessment 
  } = useAssessment();

  const { getCurrentQuestion, getCurrentCategory, getProgress, isQuestionAnswered, canSubmit } = useAssessmentHelpers();

  useEffect(() => {
    if (questions.length === 0) {
      loadQuestions();
    }
  }, [questions.length, loadQuestions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadQuestions}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentCategory = getCurrentCategory();
  const progress = getProgress();

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Complete</h2>
          <p className="text-gray-600">Thank you for completing the assessment!</p>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (optionValue: number) => {
    answerQuestion(currentQuestion.id, optionValue);
  };

  const handleSubmitAssessment = async () => {
    try {
      const assessmentId = await submitAssessment();
      navigate(`/results/${assessmentId}`);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      // Error handling is already done in the context
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {progress.current} of {progress.total}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress.percentage)}% Complete
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Category Badge */}
        {currentCategory && (
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {currentCategory.name}
            </span>
          </div>
        )}

        {/* Question Card */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentQuestion.text}
          </h2>
          
          {currentQuestion.description && (
            <p className="text-gray-600 mb-6">
              {currentQuestion.description}
            </p>
          )}

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerSelect(option.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  responses[currentQuestion.id] === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.text}</span>
                  {responses[currentQuestion.id] === option.value && (
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestionIndex === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            {isQuestionAnswered(currentQuestion.id) ? (
              <span className="flex items-center text-success-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Answered
              </span>
            ) : (
              'Select an answer to continue'
            )}
          </div>

          <button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1 || !isQuestionAnswered(currentQuestion.id)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuestionIndex === questions.length - 1 || !isQuestionAnswered(currentQuestion.id)
                ? 'text-gray-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>

        {/* Submit Button (shown on last question) */}
        {currentQuestionIndex === questions.length - 1 && isQuestionAnswered(currentQuestion.id) && (
          <div className="mt-8 text-center">
            <button 
              onClick={handleSubmitAssessment}
              disabled={isLoading || !canSubmit()}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Complete Assessment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentPage;
