# Personal Income & Expense Tracker - MERN Stack

A full-stack web application for managing personal income and expenses built with **MongoDB, Express, React, and Node.js**.

## Features

- 📊 Track income and expenses
- 💰 View total balance and monthly summaries
- 🗑️ Delete transactions
- 📱 Fully responsive design for all devices
- ⚡ Fast and modern React-based UI

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **HTTP Client**: Axios

## Project Structure

```
MERN Stack/
├── backend/
│   ├── models/
│   │   └── Transaction.js      # MongoDB schema
│   ├── routes/
│   │   └── transactions.js     # API routes
│   ├── server.js               # Express server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB installed and running locally (or MongoDB Atlas account)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker_db
```

4. For MongoDB Atlas, update the `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker_db
```

5. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, for custom API URL):
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Get All Transactions with Summary
```
GET /api/transactions
```

Response:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total_income": 1000.00,
    "total_expense": 500.00,
    "balance": 500.00,
    "month_income": 800.00,
    "month_expense": 300.00
  }
}
```

### Add Transaction
```
POST /api/transactions
Content-Type: application/json

{
  "type": "income",
  "amount": 100.00,
  "description": "Salary",
  "category": "Salary",
  "date": "2024-01-15",
  "notes": "Monthly salary"
}
```

### Delete Transaction
```
DELETE /api/transactions/:id
```

## Usage

1. **Add Income**: Select "Income" type, enter amount, description, and date
2. **Add Expense**: Select "Expense" type, enter amount, description, and date
3. **View Summary**: See total income, expenses, and balance at the top
4. **Delete Transactions**: Click the delete button (🗑️) on any transaction

## Development

### Running Both Servers

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

This creates an optimized production build in the `build` folder.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Notes

- The app uses MongoDB for data storage
- All amounts are stored as numbers (floats) for precision
- Transactions are ordered by date (newest first)
- The frontend automatically reloads data after adding/deleting transactions

## License

Free to use for personal projects.

