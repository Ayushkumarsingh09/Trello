# 🚀 Trello Clone - Full Stack Project

A modern, feature-rich Trello clone built with **Next.js 15**, **React 19**, **Supabase**, and **TypeScript**. This project demonstrates full-stack development skills with authentication, real-time updates, and drag-and-drop functionality.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 📋 **Board Management** - Create, view, and manage multiple project boards
- 📝 **List & Card System** - Organize tasks with drag-and-drop functionality
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🗄️ **Database Integration** - Supabase PostgreSQL with Row Level Security
- 🚀 **Vercel Ready** - Optimized for production deployment

## 🛠 Tech Stack

| Frontend | Backend | Database | Deployment |
|----------|---------|----------|------------|
| Next.js 15 | Next.js API Routes | Supabase PostgreSQL | Vercel |
| React 19 | JWT Authentication | Row Level Security | Environment Variables |
| TypeScript | bcrypt Hashing | Real-time Updates | GitHub Integration |
| Tailwind CSS | Input Validation | Connection Pooling | Auto-deployment |
| @dnd-kit | Error Handling | Indexed Queries | CDN Distribution |

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Database      │
│                 │    │                 │    │                 │
│ • React 19      │◄──►│ • Next.js API   │◄──►│ • Supabase      │
│ • Next.js 15    │    │ • JWT Auth      │    │ • PostgreSQL    │
│ • TypeScript    │    │ • Validation    │    │ • RLS Policies  │
│ • Tailwind CSS  │    │ • Error Handling│    │ • Real-time     │
│ • @dnd-kit      │    │ • Middleware    │    │ • Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd trello-clone-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL script from `supabase-setup.sql` in your Supabase SQL editor
   - Get your project credentials

4. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
   JWT_SECRET=your_jwt_secret
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
trello-clone-2/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── login/         # User login
│   │   │   │   └── register/      # User registration
│   │   │   ├── boards/            # Board management
│   │   │   ├── lists/             # List operations
│   │   │   └── cards/             # Card operations
│   │   ├── auth/                  # Auth pages
│   │   │   ├── login/             # Login page
│   │   │   └── signup/            # Signup page
│   │   ├── board/                 # Board components
│   │   │   ├── [id]/              # Dynamic board page
│   │   │   ├── KanbanList.tsx     # List component
│   │   │   └── useBoard.ts        # Board hooks
│   │   ├── components/            # Reusable components
│   │   │   └── HomePage.tsx       # Main dashboard
│   │   ├── contexts/              # React contexts
│   │   │   └── AuthContext.tsx    # Authentication context
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   └── lib/                       # Utility functions
│       ├── database.ts            # Database operations
│       └── supabase.ts            # Supabase client
├── prisma/                        # Database schema
│   └── schema.prisma              # Prisma schema
├── public/                        # Static assets
├── supabase-setup.sql            # Database setup script
├── env.example                   # Environment variables template
├── TECHNICAL_DOCUMENTATION.md    # Detailed technical docs
└── README.md                     # This file
```

## 🔧 Key Components

### Authentication System
- **JWT-based authentication** with secure token management
- **bcrypt password hashing** for security
- **Persistent sessions** using localStorage
- **Protected routes** with middleware

### Database Layer
- **Supabase PostgreSQL** with connection pooling
- **Row Level Security (RLS)** for data protection
- **Optimized queries** with proper indexing
- **Real-time capabilities** ready for future enhancements

### Frontend Features
- **Responsive design** that works on all devices
- **Drag-and-drop functionality** using @dnd-kit
- **Real-time updates** with optimistic UI
- **Modern UI/UX** with Tailwind CSS

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 rounds
- ✅ **JWT Tokens** - Secure authentication
- ✅ **Input Validation** - Server-side validation
- ✅ **Row Level Security** - Database-level protection
- ✅ **CORS Protection** - Cross-origin request security
- ✅ **Error Handling** - No sensitive data leakage

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in project settings

3. **Deploy**
   - Vercel will automatically deploy on every push
   - Your app will be available at `https://your-project.vercel.app`

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`

## 📊 Performance Features

- **Code Splitting** - Dynamic imports for better loading
- **Optimized Queries** - Efficient database operations
- **Connection Pooling** - Supabase handles connection management
- **CDN Distribution** - Vercel's global CDN
- **Image Optimization** - Next.js automatic image optimization

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build
```

## OUTPUT:
<img width="1306" height="656" alt="image" src="https://github.com/user-attachments/assets/4d6835f5-5511-40d0-a3d5-c39b50f671d6" />
<img width="1327" height="670" alt="image" src="https://github.com/user-attachments/assets/0a1a61ec-1826-42d1-a0b5-4ec58478f9b1" />


<img width="1654" height="747" alt="image" src="https://github.com/user-attachments/assets/461f0392-8274-42ba-b4af-a45dfff8a77e" />
<img width="1350" height="806" alt="image" src="https://github.com/user-attachments/assets/5da95632-cac0-46e2-9764-1563c07d88bb" />



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

