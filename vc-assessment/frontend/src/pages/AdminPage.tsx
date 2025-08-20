import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage questions, view analytics, and configure the assessment
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-center">
            Admin panel coming soon! This will include question management, analytics, and system configuration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
