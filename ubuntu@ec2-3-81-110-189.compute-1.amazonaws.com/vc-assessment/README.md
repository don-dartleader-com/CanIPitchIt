# VC Assessment Tool

A comprehensive full-stack application for assessing startup readiness for venture capital funding. Built with React, TypeScript, Node.js, and PostgreSQL.

## 🚀 Features

### For Visitors/Founders

- **Interactive Assessment**: 20-question assessment across 5 key categories
- **Instant Scoring**: Real-time calculation with detailed breakdown
- **Progress Tracking**: Save and resume assessments
- **Results Dashboard**: Comprehensive results with strengths, weaknesses, and recommendations
- **Email Results**: Automated email delivery of assessment results
- **Account Creation**: Track progress over time and compare with benchmarks

### For Administrators

- **Question Management**: Full CRUD operations for assessment questions
- **Results Review**: View and analyze all submitted assessments
- **Action Plans**: Create customized improvement plans for founders
- **Analytics Dashboard**: Comprehensive reporting and analytics
- **Investor Intro Generator**: Automated investor introduction templates
- **Benchmark Management**: Industry and stage-based comparison data

## 🏗️ Architecture

### Backend (Node.js + TypeScript)

```
src/
├── config/          # Database and app configuration
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, etc.
├── models/          # Database models
├── routes/          # API route definitions
├── services/        # Business logic services
├── scripts/         # Database seeding and utilities
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

### Frontend (React + TypeScript)

```
src/
├── components/      # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── services/        # API service layer
├── types/           # TypeScript interfaces
├── utils/           # Helper functions
└── styles/          # CSS and styling
```

## 📊 Assessment Categories

1. **Market & Opportunity (25 points)**

   - Total addressable market size
   - Market growth rate
   - Problem validation
   - Competitive advantage
   - Go-to-market strategy

2. **Team & Leadership (20 points)**

   - Founder experience
   - Team completeness
   - Domain expertise
   - Advisory board strength

3. **Product & Technology (20 points)**

   - Development stage
   - Technical differentiation
   - Intellectual property
   - Platform scalability

4. **Traction & Business Model (20 points)**

   - Revenue model clarity
   - Customer traction
   - Monthly recurring revenue
   - Unit economics understanding

5. **Financial Readiness (15 points)**
   - Financial planning detail
   - Funding requirements clarity
   - Use of funds strategy

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd vc-assessment-app/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=vc_assessment
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here

   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Database Setup**

   ```bash
   # Create database
   createdb vc_assessment

   # Run the application (it will auto-create tables)
   npm run dev
   ```

5. **Seed Questions (optional)**
   ```bash
   npm run seed:questions
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd vc-assessment-app/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Update with your backend URL:

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🔧 Development

### Backend Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run seed:questions # Seed assessment questions
```

### Frontend Commands

```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Run ESLint
```

## 📡 API Endpoints

### Public Endpoints

- `GET /api/questions` - Get assessment questions
- `POST /api/assessments` - Submit assessment
- `GET /api/assessments/:id/results` - Get assessment results

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Endpoints (Authenticated)

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/assessments` - Get user's assessments
- `GET /api/user/dashboard` - Get dashboard data

### Admin Endpoints (Admin Only)

- `GET /api/admin/questions` - Get all questions
- `POST /api/admin/questions` - Create question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `GET /api/admin/assessments` - Get all assessments
- `POST /api/admin/action-plans` - Create action plan
- `POST /api/admin/investor-intro` - Generate investor intro

## 🗄️ Database Schema

### Core Tables

- `users` - User accounts and authentication
- `user_profiles` - Extended user information
- `assessment_categories` - Question categories with weights
- `questions` - Assessment questions with options
- `assessments` - Completed assessments
- `assessment_results` - Calculated results and insights

### Admin Tables

- `action_plans` - Custom improvement plans
- `investor_intros` - Generated investor introductions
- `benchmarks` - Industry comparison data

## 🎯 Scoring Algorithm

The scoring system uses weighted categories:

- Each question has a weight (1-5)
- Each answer option has points (0-5)
- Category scores are calculated as: `(total_points / max_possible_points) * category_weight`
- Final score is the sum of all weighted category scores (0-100)

## 📧 Email Integration

The system supports automated email delivery:

- Assessment completion notifications
- Results delivery with PDF attachments
- Progress updates for registered users
- Admin notifications for new assessments

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## 🚀 Deployment

### Backend Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)
4. Run database migrations

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables for production API URL

## 📈 Analytics & Reporting

The system provides comprehensive analytics:

- Assessment completion rates
- Score distributions by category
- Industry benchmarking
- User engagement metrics
- Conversion tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Email: support@vcassessment.com
- Documentation: [Link to docs]

## 🔄 Version History

- **v1.0.0** - Initial release with core assessment functionality
- **v1.1.0** - Added user accounts and progress tracking
- **v1.2.0** - Admin panel and question management
- **v2.0.0** - Complete rewrite with TypeScript and enhanced features
