# FinanceTracker Pro 🔮

FinanceTracker Pro is a premium, full-stack personal finance manager built using the MERN stack (MongoDB, Express, React, Node.js). It features a modern glassmorphic dark/light UI, regional currency settings, monthly budget/savings timeline statistics, and a Gemini/Groq-powered AI Financial Assistant.

---

## Key Features

- 🔮 **Premium Glassmorphic UI**: Redrawn from scratch with custom HSL gradient tokens, soft border outlines, custom scrollbars, and fluid animations.
- ☀️/🌙 **Dynamic Theme Toggle**: Switch instantly between Slate Dark and Clean Light modes via the navigation bar. Preferences persist automatically in `localStorage`.
- 📅 **Monthly Auto-Resetting Dashboard**: Overview metrics (Total Balance, Income, Expenses, and Category Pie Charts) reset on the 1st of every calendar month.
- 📈 **Monthly Savings Timeline**: Dedicated chronological browser displaying past months' income, expenses, net savings, and individual category distribution charts.
- 🇮🇳/🇺🇸/🇪🇺 **Multi-Currency Pickers**: Auto-detects and prompts new users to choose their country and matching currency symbols during registration/login (with Admin override).
- 🧠 **AI Financial Assistant (Gemini/Groq)**: Dynamic chat widget to log transactions, inspect spending habits, ask questions, or scan receipt attachments.
- 🛡️ **Admin Panel & Config Service**: Manage live announcement banners, adjust active AI model keys dynamically at runtime, view user list ledgers, or toggle user suspensions.

---

## Repository Structure

```text
Finance_Tracker/
├── backend/            # Express REST API, Mongoose Models, AI Services, Middlewares
└── frontend/           # React SPA + Vite Dev Server, Recharts, Framer Motion
```

---

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB Connection URI](https://www.mongodb.com/) (Local or Atlas cloud cluster)

---

### 1. Backend Configuration

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_token
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```

---

### 2. Frontend Configuration

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Technology Stack

- **Frontend**: React, Vite, Recharts, Framer Motion, React Icons
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, JWT Auth, Google Auth API
- **Styling**: Vanilla CSS with HSL variables
