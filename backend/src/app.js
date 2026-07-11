// .env file configuration
require("dotenv").config();

// Import libraries
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");

require("./models");
const sequelize = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { sanitizeBody } = require("./middleware/sanitize");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const followRoutes = require("./routes/followRoutes");
const activityRoutes = require("./routes/activityRoutes");
const adminRoutes = require("./routes/adminRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

// Import unified review routes
const reviewRatingRoutes = require("./routes/reviewRatingRoutes");

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Pagination-Page', 'X-Pagination-Total'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://*.s3.amazonaws.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// CORS with specific options
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Sanitize all incoming data
app.use(sanitizeBody);

// Rate limiting for all API routes
app.use('/api', apiLimiter);

// ============ API ROUTES ============

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Recipe Platform API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0"
  });
});

// Auth Routes
app.use("/api/auth", authRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Recipe Routes
app.use("/api/recipes", recipeRoutes);

// Favorite Routes
app.use("/api/favorites", favoriteRoutes);

// Collection Routes
app.use("/api/collections", collectionRoutes);

// Rating Routes (Legacy - kept for backward compatibility)
app.use("/api/ratings", ratingRoutes);

// Review Routes (Legacy - kept for backward compatibility)
app.use("/api/reviews", reviewRoutes);

// Follow Routes
app.use("/api/follows", followRoutes);

// Activity Routes
app.use("/api/activities", activityRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// Password Reset Routes
app.use("/api/password", passwordRoutes);

// Unified review and rating routes (New)
app.use("/api/review-ratings", reviewRatingRoutes);

// ============ API 404 Handler ============
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    timestamp: new Date().toISOString()
  });
});

// ============ Frontend Static Files (for production) ============
// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });
} else {
  // In development, redirect root to React dev server or just show API info
  app.get('/', (req, res) => {
    res.json({
      message: "Recipe Platform API",
      status: "Running",
      environment: process.env.NODE_ENV,
      documentation: "/api/health",
      frontend: "React app should be running on http://localhost:3000"
    });
  });
}

// ============ Global Error Handler ============
app.use(errorHandler);

// ============ Database Connection & Server Start ============
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Sync database (alter only in development)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Database synced successfully");
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS enabled for:`, corsOptions.origin);
      console.log(`📡 API available at: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`📦 Serving React frontend from build folder`);
      } else {
        console.log(`⚛️ React frontend should be running on http://localhost:3000`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;