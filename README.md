# TopicResponseAI

A versatile content management system featuring dual frontend architecture, combining a modern React interface with WordPress integration capabilities. Built with Express.js and TypeScript, it leverages Google's Gemini AI for intelligent content suggestions while providing robust API compatibility for both modern and legacy clients.

## 🚀 Key Features

### Dual Frontend Architecture
- **Modern React Interface**: Built with React, TypeScript, and modern tooling
- **WordPress Integration**: Seamless compatibility with WordPress sites
- **Unified API**: Single backend serving both frontend implementations
- **Format-Aware Responses**: Intelligent response formatting based on client needs

### Content Management
- **Blog Topic Management**: Create, update, and organize blog topics
- **Category System**: Comprehensive category management across both frontends
- **Server-Side Pagination**: Efficient data handling with configurable page sizes
- **Advanced Filtering**: Category-based filtering with pagination support

### AI Integration
- **Gemini AI Integration**: Powered by Google's Gemini-2.0-flash model
- **Smart Suggestions**: AI-powered content recommendations
- **Rate Limiting**: Intelligent rate limiting for AI features
- **Error Handling**: Graceful degradation during API limitations

### Security & Performance
- **Enhanced Security**: Multi-layered authentication system
- **CORS Protection**: Advanced CORS with token validation
- **API Key Authentication**: Secure API access control
- **Rate Limiting**: Protected endpoints with configurable limits


## 🛠️ Technical Stack

### Frontend Technologies
- **React Frontend**
  - TypeScript for type safety
  - TanStack Query for efficient data management
  - shadcn/ui components for polished UI
  - Tailwind CSS with custom theming
  - Wouter for lightweight routing

- **WordPress Integration**
  - jQuery-based implementation
  - Compatible with WordPress environments
  - Responsive UI components
  - Seamless API integration

### Backend Infrastructure
- **Express.js Backend**
  - TypeScript implementation
  - RESTful API design
  - Format-aware response handling
  - Comprehensive error management

- **Database & Storage**
  - PostgreSQL via Neon
  - Drizzle ORM for type-safe queries
  - Efficient data pagination
  - Category-based indexing

- **AI Integration**
  - Google Gemini AI API (2.0-flash model)
  - Rate limiting middleware
  - Error handling and fallbacks
  - Optimized response processing

## 🔧 Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```env
   # Required Environment Variables
   DATABASE_URL=          # PostgreSQL connection string
   GEMINI_API_KEY=       # Google Gemini API key
   ALLOWED_ORIGINS=      # Comma-separated list of allowed domains for CORS
   SESSION_SECRET=       # Secret for session management
   API_KEY=             # API key for external access
   CORS_TOKEN=          # CORS validation token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 API Documentation

### Topic Management Endpoints

#### Modern Client Endpoints (React Frontend)
- `GET /api/topics` - Retrieve paginated topics
  - Query params: `page`, `pageSize`, `category`
  - Returns: Paginated response with metadata
- `POST /api/topics` - Create new topic
- `DELETE /api/topics/:id` - Remove topic
- `POST /api/topics/:id/suggestions` - Generate AI suggestions

#### WordPress Integration Endpoints
- `GET /api/topics?format=array` - Get topics in WordPress-compatible format
- `GET /api/categories` - Retrieve all available categories
- Same CRUD operations with format-aware responses

### Authentication & Security
- API key required in headers: `x-api-key`
- CORS token validation: `x-cors-token`
- Rate limiting on AI operations
- Secure session management

## 💡 Implementation Details

### Security Features
- Comprehensive API key validation
- Token-based CORS protection
- Rate limiting for AI endpoints
- Secure session handling

### Performance Optimizations
- Server-side pagination
- Efficient category filtering
- Optimized React components
- Caching with TanStack Query

### WordPress Integration
- Format-aware API responses
- Legacy system compatibility
- jQuery-based implementation
- Consistent UI/UX across platforms

## 📜 License

MIT License - See LICENSE file for details