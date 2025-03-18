
# TopicResponseAI

A versatile content management system featuring a **dual frontend architecture**, combining a **modern React interface** with **WordPress integration capabilities**. Built with **Express.js** and **TypeScript**, it leverages **Google's Gemini AI** for intelligent content suggestions while providing a robust **RESTful API** for both modern and legacy clients.

## 🚀 Key Features

### 🔹 Dual Frontend Architecture
- **Modern React Interface**: Built with React, TypeScript, and advanced UI tooling.
- **WordPress Integration**: Seamless compatibility with WordPress environments.
- **Unified API**: A single backend serving both frontend implementations.
- **Format-Aware Responses**: Dynamic response formatting based on client needs.

### 🔹 Content Management
- **Blog Topic Management**: Create, update, and organize blog topics efficiently.
- **Category System**: Structured category management for content organization.
- **Server-Side Pagination**: Efficient handling of large datasets with customizable pagination.
- **Advanced Filtering**: Category-based filtering with pagination support.

### 🔹 AI-Powered Content Generation
- **Gemini AI Integration**: Powered by **Google's Gemini-2.0-flash** model.
- **Smart Content Suggestions**: AI-driven recommendations for blog content.
- **Rate Limiting**: Protects AI usage with intelligent request limits.
- **Graceful Error Handling**: Prevents disruptions during API failures.

### 🔹 Security & Performance Enhancements
- **Enhanced Authentication**: Multi-layered security using API keys and sessions.
- **CORS Protection**: Advanced token-based CORS validation.
- **Rate Limiting**: Configurable request limits to prevent API abuse.
- **Optimized API Performance**: Server-side pagination & efficient query handling.

## 🛠️ Technology Stack

### 🔹 Frontend Technologies
- **React.js**
  - TypeScript for type safety
  - TanStack Query for optimized data fetching
  - shadcn/ui for UI consistency
  - Tailwind CSS for styling
  - Wouter for lightweight routing

- **WordPress Integration**
  - jQuery-based frontend implementation
  - Fully compatible with WordPress themes
  - Seamless API integration for legacy support

### 🔹 Backend Infrastructure
- **Express.js Backend**
  - Fully typed TypeScript implementation
  - RESTful API with structured response handling
  - Centralized error management for robustness

- **Database & Storage**
  - **PostgreSQL** (via **Neon DB** for serverless deployment)
  - **Drizzle ORM** for efficient and type-safe queries
  - Optimized pagination & category-based indexing

- **AI Integration**
  - **Google Gemini AI** (2.0-flash model)
  - Middleware for AI rate limiting
  - Intelligent AI response formatting & fallbacks

## 🔧 Setup Instructions

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/YOUR-USERNAME/TopicResponseAI-Public.git
cd TopicResponseAI-Public
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Configure Environment Variables
Create a .env file in the root directory with the following required variables:

```env
# Database Connection
DATABASE_URL=your_postgresql_connection_string_here

# Google AI Integration
GEMINI_API_KEY=your_google_gemini_api_key_here

# Security & Authentication
SESSION_SECRET=your_secure_session_secret
API_KEY=your_api_key_for_secure_requests
CORS_TOKEN=your_cors_protection_token

# Allowed Origins (CORS)
ALLOWED_ORIGINS=https://yourfrontend.com,https://anotherdomain.com
```

### 4️⃣ Run Database Migrations
```sh
npm run drizzle:push
```

### 5️⃣ Start the Development Server
```sh
npm run dev
```

Your API will be running at http://0.0.0.0:5000.

## 📝 API Documentation

### 🔹 Topic Management Endpoints

**Modern Client Endpoints (React Frontend)**
- `GET /api/topics` → Retrieve paginated topics
  - Query Params: `page`, `pageSize`, `category`
  - Returns: Paginated response with metadata
- `POST /api/topics` → Create a new topic
- `DELETE /api/topics/:id` → Remove a topic
- `POST /api/topics/:id/suggestions` → Generate AI-driven suggestions

**WordPress Integration Endpoints**
- `GET /api/topics?format=array` → Fetch topics in WordPress-compatible format
- `GET /api/categories` → Retrieve all available categories
- Full CRUD operations with format-aware responses

### 🔹 Authentication & Security
- API key required: Pass in headers as `x-api-key`
- CORS token validation: Included as `x-cors-token`
- Secure session management via encrypted cookies
- Rate limiting on AI-related endpoints

## 💡 Implementation Details

### 🔹 Security Features
- Comprehensive API Key Validation
- Token-based CORS Protection
- Rate Limiting for AI Requests
- Secure Session Management with PostgreSQL Storage

### 🔹 Performance Optimizations
- Server-Side Pagination for Efficient Data Loading
- Optimized Category-Based Filtering
- React UI Components Optimized with TanStack Query
- Caching & Optimized Queries for Faster API Responses

### 🔹 WordPress Integration
- Format-aware API responses for legacy support
- Consistent UI/UX between WordPress & React
- jQuery-based frontend compatibility
- Seamless API integration for content synchronization

## 📜 License
MIT License - See LICENSE file for details.

## 📢 Need Help?
If you encounter issues, feel free to open a discussion or create an issue in the project!
