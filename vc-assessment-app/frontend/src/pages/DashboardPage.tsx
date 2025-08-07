import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard
          </h1>
          <p className="text-gray-600">
            View your assessment history and progress
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-center">
            Dashboard coming soon! This will show assessment history, scores, and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
