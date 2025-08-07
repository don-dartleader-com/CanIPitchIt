import React from 'react';
import { useParams } from 'react-router-dom';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Assessment Results
          </h1>
          <p className="text-gray-600 mb-8">
            Results for assessment ID: {id}
          </p>
          <div className="card">
            <p className="text-gray-600">
              Results page coming soon! This will display detailed assessment results, 
              scoring breakdown, and recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
