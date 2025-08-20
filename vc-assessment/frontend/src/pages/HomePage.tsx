import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, BarChart3, Target, TrendingUp, Users } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-primary-600" />,
      title: 'Comprehensive Assessment',
      description: 'Evaluate all aspects of your startup from team to market opportunity with our detailed questionnaire.'
    },
    {
      icon: <Target className="h-8 w-8 text-primary-600" />,
      title: 'Personalized Scoring',
      description: 'Get a weighted score out of 100 that reflects your readiness for VC funding based on industry standards.'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary-600" />,
      title: 'Actionable Insights',
      description: 'Receive specific recommendations on how to improve your fundability and strengthen weak areas.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-600" />,
      title: 'Benchmark Comparison',
      description: 'See how you stack up against other startups in your industry and stage of development.'
    }
  ];

  const benefits = [
    'Identify strengths and weaknesses before approaching investors',
    'Get actionable recommendations to improve your pitch',
    'Understand what VCs look for in fundable startups',
    'Track your progress over time with multiple assessments',
    'Access industry benchmarks and peer comparisons'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Is Your Startup
              <span className="text-primary-600 block">Ready for VC Funding?</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Take our comprehensive assessment to evaluate your startup's readiness for venture capital funding. 
              Get personalized insights and actionable recommendations to improve your chances of success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/assessment" 
                className="btn-primary text-lg px-8 py-4 inline-flex items-center"
              >
                Start Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/register" 
                className="btn-outline text-lg px-8 py-4"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Use Our Assessment?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our assessment tool is designed by experienced entrepreneurs and investors to give you 
              the most accurate evaluation of your startup's funding readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                What You'll Get
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Assessment Categories
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Team & Leadership</span>
                  <span className="text-primary-600 font-semibold">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Market & Opportunity</span>
                  <span className="text-primary-600 font-semibold">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Product & Technology</span>
                  <span className="text-primary-600 font-semibold">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Business Model</span>
                  <span className="text-primary-600 font-semibold">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Traction & Growth</span>
                  <span className="text-primary-600 font-semibold">20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Take the first step towards securing VC funding. Our assessment takes about 15-20 minutes 
            and provides immediate results with detailed recommendations.
          </p>
          <Link 
            to="/assessment" 
            className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 inline-flex items-center text-lg"
          >
            Start Your Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
