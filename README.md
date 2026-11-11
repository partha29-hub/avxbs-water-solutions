# AVXBS Platform — Production Architecture

AVXBS is a high-performance web platform for advanced residential and commercial water treatment and softening solutions. The application is organized into a decoupled architecture featuring an independent **Next.js Frontend (App Router)** and an **Express.js MVC REST API Backend**.

---

## 1. Project Architecture

```text
AVXBS/
│
├── frontend/                     # Next.js 16+ App Router UI
│   ├── public/                   # Static assets, logos, and images
│   ├── src/
│   │   ├── app/
│   │   │   ├── (user)/           # Public User Panel (Home, MegaMenu, Slider, Drawer)
│   │   │   │   └── page.jsx
│   │   │   │
│   │   │   ├── admin/            # Admin Panel Modules
│   │   │   │   ├── login/        # Admin Authentication
│   │   │   │   ├── dashboard/    # Analytics & Metrics Dashboard
│   │   │   │   ├── dynamic-tabs/ # Dynamic Category Tabs Management
│   │   │   │   ├── form-builder/ # Dynamic Form Fields Customizer
│   │   │   │   ├── residential/  # Residential Products Management
│   │   │   │   ├── solutions/    # Commercial & Residential Solutions CRUD
│   │   │   │   ├── videos/       # Banner & Video Media Management
│   │   │   │   ├── footer/       # Dynamic Footer Management
│   │   │   │   └── settings/     # Account & WhatsApp Assistance Settings
│   │   │   │
│   │   │   ├── layout.jsx        # Global HTML root layout & fonts
│   │   │   └── globals.css       # Complete design system & styles
│   │   │
│   │   ├── components/           # UI Components (Hero, Slider, MegaMenu, Drawer, etc.)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # AboutPage, ContactPage
│   │   ├── services/             # Centralized API service & counters
│   │   │   ├── api.js            # Unified REST client with credentials & error handling
│   │   │   └── submissionCounter.js
│   │   └── utils/                # Server & client auth helpers
│   │       └── auth.js           # Server component session verification
│   │
│   ├── package.json              # Frontend dependencies (React, Next.js, Lucide)
│   ├── next.config.mjs           # Next.js configuration & transparent API rewrites
│   └── .env.local                # Frontend environment variables
│
├── backend/                      # Express.js REST API (MVC Architecture)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Mongoose MongoDB connection
│   │   │   └── cloudinary.js     # Cloudinary SDK media configuration
│   │   │
│   │   ├── controllers/          # Business logic controllers
│   │   │   ├── adminAuthController.js   # Admin auth, passwords, dashboard metrics
│   │   │   ├── dynamicTabController.js  # Dynamic tabs CRUD
│   │   │   ├── formBuilderController.js # Dynamic form builder fields configuration
│   │   │   ├── inquiryController.js     # Lead capture, inquiry listing, CSV export
│   │   │   ├── mediaController.js       # Cloudinary file upload & media management
│   │   │   ├── solutionController.js    # Solutions, products, and highlights
│   │   │   ├── assistanceController.js  # WhatsApp support settings
│   │   │   └── footerController.js      # Dynamic footer content
│   │   │
│   │   ├── models/               # 9 Mongoose schemas
│   │   │   ├── Admin.js
│   │   │   ├── Assistance.js
│   │   │   ├── DynamicTab.js
│   │   │   ├── Footer.js
│   │   │   ├── FormConfig.js
│   │   │   ├── Highlight.js
│   │   │   ├── Inquiry.js
│   │   │   ├── Media.js
│   │   │   └── Solution.js
│   │   │
│   │   ├── routes/               # API route definitions
│   │   │   ├── adminRoutes.js    # Protected /api/admin/* endpoints
│   │   │   └── publicRoutes.js   # Public /api/* endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js # JWT & cookie validation guard
│   │   │   ├── errorMiddleware.js# Standardized error handling
│   │   │   └── uploadMiddleware.js # Multer file upload stream
│   │   │
│   │   └── server.js             # Express application initialization & CORS
│   │
│   ├── package.json              # Express, Mongoose, JWT, Cloudinary, etc.
│   └── .env                      # Backend private secrets & database URI
│
├── docs/                         # Specifications & screenshots
├── .gitignore
└── README.md
```

---

## 2. Quick Start Guide

### Prerequisites
- Node.js 18.18+ or 20+
- npm or pnpm

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/avxbs_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### Step 3: Run the Applications

#### Terminal 1 — Start Backend Server (Port 5000):
```bash
cd backend
npm run dev
```

#### Terminal 2 — Start Frontend Application (Port 3000):
```bash
cd frontend
npm run dev
```

- **User Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Backend API Health Probe**: [http://localhost:5000/api/health/db](http://localhost:5000/api/health/db)

---

## 3. API Communication & Security
- **Cross-Origin Security**: Backend Express CORS allows requests from `http://localhost:3000` with `credentials: true`.
- **Admin Authentication**: Handled via HTTP-only `admin_token` cookie and Bearer token fallback.
- **Data Protection**: Secrets (MongoDB URI, JWT secret, Cloudinary credentials) reside exclusively in `backend/.env`.
- **API Proxy**: Frontend Next.js includes transparent rewrites in `next.config.mjs` routing `/api/:path*` to `http://localhost:5000/api/:path*`.

