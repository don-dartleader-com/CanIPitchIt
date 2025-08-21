import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sign In
          </h1>
          <p className="text-gray-600">
            Access your assessment dashboard
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-center">
            Login form coming soon! This will include email/password authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
