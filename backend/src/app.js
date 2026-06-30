// .evn file configuration
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

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

// ============ HTML ROUTES ============

// Auth Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// Profile Routes
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "profile.html"));
});

app.get("/user/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "profile-view.html"));
});

// Recipe Routes
app.get("/recipes", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "recipes.html"));
});

app.get("/recipe/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "recipe-detail.html"));
});

app.get("/recipe/:id/reviews", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "recipe-reviews.html"));
});

app.get("/recipe/:id/ratings", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "recipe-ratings.html"));
});

app.get("/create-recipe", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create-recipe.html"));
});

app.get("/edit-recipe/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "edit-recipe.html"));
});

app.get("/my-recipes", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-recipes.html"));
});

// Favorite Routes
app.get("/favorites", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "favorites.html"));
});

app.get("/my-favorites", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-favorites.html"));
});

// Collection Routes
app.get("/collections", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "collections.html"));
});

app.get("/collection/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "collection-detail.html"));
});

app.get("/create-collection", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create-collection.html"));
});

app.get("/edit-collection/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "edit-collection.html"));
});

// Follow Routes
app.get("/followers/:userId", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "followers.html"));
});

app.get("/following/:userId", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "following.html"));
});

// Activity Routes
app.get("/activity-feed", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "activity-feed.html"));
});

app.get("/my-activities", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "my-activities.html"));
});

app.get("/user-activities/:userId", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "user-activities.html"));
});

// Admin Routes
app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

app.get("/admin/users", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-users.html"));
});

app.get("/admin/recipes", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-recipes.html"));
});

// ============ API ROUTES ============

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/admin", adminRoutes);

// API check
app.get("/api", (req, res) => {
  res.json({
    status: "OK",
    message: "Recipe Platform API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 3000;

sequelize
  .sync()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        if (process.env.NODE_ENV === "development") {
          console.log("📦 Database synced");
        }
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });

module.exports = app;
