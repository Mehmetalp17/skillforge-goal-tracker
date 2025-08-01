import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load env vars. This will look for a .env file in the current directory (api/).
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
// This is permissive for local development to handle random ports from `npx serve`.
// In a production environment, you should restrict this to your frontend's domain.
// In your api/index.js file

const corsOptions = {
    origin: [
        'https://skillforge-goal-tracker.vercel.app',
        'https://skillforge-goal-tracker-j8fbiwjrw-mehmet-alps-projects-20d93c8c.vercel.app',
        'skillforge-goal-tracker-9vkhibcvs-mehmet-alps-projects-20d93c8c.vercel.app',
        'http://localhost:5173' // For local development
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);

// Error handler middleware (should be the last piece of middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});