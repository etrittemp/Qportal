# EUDA Questionnaire Portal - Full-Stack Application

A complete questionnaire and admin dashboard system with Supabase backend, authentication, and online functionality.

## 🎯 Features

### For Users (Questionnaire)
- ✅ Public questionnaire form accessible to anyone
- ✅ Comprehensive multi-section form
- ✅ Data submitted to Supabase database
- ✅ Success feedback on submission
- ✅ Responsive design

### For Admins (Dashboard)
- ✅ Secure login with email/password
- ✅ JWT-based authentication
- ✅ View all submitted responses
- ✅ Filter by country, status, or search term
- ✅ Download individual responses as CSV
- ✅ Download all responses as CSV
- ✅ Delete individual or all responses
- ✅ Real-time statistics
- ✅ Logout functionality

### Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **API**: RESTful endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Supabase account
- npm or yarn

### 1. Setup Supabase
Follow the detailed instructions in [SETUP_GUIDE.md](./SETUP_GUIDE.md) to:
- Create Supabase project
- Run SQL to create tables
- Get API credentials

### 2. Setup Backend
```bash
cd server
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### 3. Setup Frontend
```bash
# In project root
cp .env.example .env
# Edit .env if needed (default is http://localhost:3001)
npm install
npm run dev
```

### 4. Create First Admin
```bash
cd server
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword', 10));"
```

Then in Supabase SQL Editor:
```sql
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES ('admin@example.com', 'paste_hash_here', 'Admin Name', 'superuser', true);
```

## 📁 Project Structure

```
Qportal/
├── src/                      # Frontend React app
│   ├── App.tsx              # Main app with routing
│   ├── LoginPage.tsx        # Admin login
│   ├── AdminDashboard.tsx   # Admin dashboard
│   ├── QuestionnairePage.tsx # Public questionnaire
│   ├── AuthContext.tsx      # Authentication state
│   ├── ProtectedRoute.tsx   # Route protection
│   └── api.ts               # API client
├── server/                   # Backend Node.js app
│   ├── src/
│   │   ├── index.js         # Express server
│   │   ├── routes/          # API routes
│   │   └── middleware/      # Auth middleware
│   ├── .env.example         # Backend env template
│   └── package.json
├── .env.example              # Frontend env template
├── SETUP_GUIDE.md            # Detailed setup instructions
├── DEPLOYMENT.md             # Deployment guide
└── package.json

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Row Level Security (RLS) in Supabase
- CORS configured for your domain
- Protected admin routes
- Token expiration (7 days)

## 🌐 Deployment

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for deployment instructions for:
- Vercel (Frontend + Backend)
- Railway
- Self-hosted with PM2 + nginx

## 📱 URLs

- **Public Questionnaire**: `/` or `/questionnaire`
- **Admin Login**: `/login`
- **Admin Dashboard**: `/dashboard` (protected)

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001  # Backend API URL
```

### Backend (server/.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_32_char_secret
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Responses
- `GET /api/responses` - Get all responses (protected)
- `POST /api/responses` - Submit questionnaire
- `DELETE /api/responses/:id` - Delete response (protected)
- `DELETE /api/responses` - Delete all responses (protected)

### Admin Users
- `GET /api/admin/users` - List admins (protected)
- `POST /api/admin/users` - Create admin (protected)
- `PUT /api/admin/users/:id` - Update admin (protected)
- `DELETE /api/admin/users/:id` - Delete admin (protected)

## 📊 Database Schema

### admin_users
- id (UUID)
- email (unique)
- password_hash
- name
- role (admin/superuser)
- is_active
- created_at
- last_login

### questionnaire_responses
- id (UUID)
- country
- contact_name
- contact_email
- completion_status
- responses (JSONB)
- submitted_at

## 🐛 Troubleshooting

See the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for common issues and solutions.

## 📝 Notes

- The questionnaire in `QuestionnairePage.tsx` is simplified. Port all sections from `euda-questionnaire.html` as needed.
- Superusers are created manually via SQL initially
- Regular admins can be created through the API by superusers
- All responses are stored in Supabase and can be backed up

## 📄 License

[Add your license here]

## 👥 Support

For questions or issues:
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Review server logs and browser console
- Check Supabase dashboard logs

---

Built with ❤️ for EUDA Roadmap Project
