# SkillForge: AI-Powered Goal Tracker

SkillForge is a modern, full-stack web application designed to help you define, track, and achieve your learning goals. With a hierarchical structure, you can break down large ambitions into smaller, manageable sub-goals. And with the power of the Gemini AI, you can even get intelligent suggestions for how to approach your goals.

## ✨ Features

* **Hierarchical Goal Management:** Create top-level goals and break them down into any number of sub-goals.
* **AI-Powered Goal Generation:** Describe a large goal, and our AI assistant will suggest a set of smaller, actionable sub-goals to get you started.
* **Progress Tracking:** Keep track of your progress on each goal with a percentage-based system.
* **Secure User Authentication:** JWT-based authentication ensures that your goals are private and secure.
* **Detailed Goal Information:** Add descriptions, start dates, target end dates, difficulty levels, and notes to each goal.
* **Clean, Responsive UI:** A modern, dark-themed interface built with React and Tailwind CSS.

## 🛠️ Technologies Used

### Frontend

* **React:** A popular JavaScript library for building user interfaces.
* **Vite:** A next-generation frontend tooling that provides a faster and leaner development experience.
* **React Router:** For declarative routing in the application.
* **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
* **TypeScript:** For static typing, leading to more robust and maintainable code.

### Backend

* **Node.js & Express:** For building the RESTful API.
* **MongoDB & Mongoose:** A NoSQL database and Object Data Modeling (ODM) library to interact with it.
* **JSON Web Tokens (JWT):** For secure user authentication.
* **bcrypt.js:** For hashing user passwords before storing them.
* **Google Gemini AI:** To power the intelligent goal suggestion feature.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You'll need to have the following software installed on your machine:

* [Node.js](https://nodejs.org/) (v18.x or higher is recommended)
* [MongoDB](https://www.mongodb.com/try/download/community) (or a MongoDB Atlas account)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/skillforge-goal-tracker.git](https://github.com/your-username/skillforge-goal-tracker.git)
    cd skillforge-goal-tracker
    ```

2.  **Install frontend dependencies:**

    ```bash
    npm install
    ```

3.  **Install backend dependencies:**

    ```bash
    cd api
    npm install
    cd ..
    ```

4.  **Set up environment variables:**

    You'll need to create two `.env` files. One in the root directory for the frontend, and one in the `/api` directory for the backend.

    * **Root `.env` file (`./.env`):**

        This file is used by Vite to expose your Gemini API key to the frontend for the AI features.

        ```
        GEMINI_API_KEY=your_google_gemini_api_key
        ```

    * **API `.env` file (`./api/.env`):**

        This file contains the configuration for your backend server.

        ```
        NODE_ENV=development
        PORT=3000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_super_secret_jwt_key
        JWT_EXPIRE=30d
        GEMINI_API_KEY=your_google_gemini_api_key
        ```

        **Note:** Your `JWT_SECRET` should be a long, random string.

### Running the Application

You'll need to run both the frontend and backend servers in separate terminals.

1.  **Run the backend API server:**

    ```bash
    cd api
    npm run dev
    ```

    The API server will be running on `http://localhost:3000`.

2.  **Run the frontend development server:**

    In a new terminal:

    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.