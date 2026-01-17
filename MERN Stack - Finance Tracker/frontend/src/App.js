import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Message from './components/Message';
import { fetchTransactions, addTransaction, deleteTransaction } from './services/api';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    month_income: 0,
    month_expense: 0
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchTransactions();
      if (response.success) {
        setTransactions(response.data.transactions);
        setSummary({
          total_income: response.data.total_income,
          total_expense: response.data.total_expense,
          balance: response.data.balance,
          month_income: response.data.month_income,
          month_expense: response.data.month_expense
        });
      }
    } catch (error) {
      showMessage('Error loading data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTransaction = async (transactionData) => {
    try {
      const response = await addTransaction(transactionData);
      if (response.success) {
        showMessage('Transaction added successfully!', 'success');
        loadData(); // Reload data to show new transaction
      } else {
        showMessage('Error: ' + response.message, 'error');
      }
    } catch (error) {
      showMessage('Error adding transaction. Please try again.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await deleteTransaction(id);
      if (response.success) {
        showMessage('Transaction deleted successfully!', 'success');
        loadData(); // Reload data to update list
      } else {
        showMessage('Error: ' + response.message, 'error');
      }
    } catch (error) {
      showMessage('Error deleting transaction. Please try again.', 'error');
    }
  };



  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      <main>
        <div className="dashboard">
          {message && <Message text={message.text} type={message.type} />}
          <SummaryCards summary={summary} />
          <TransactionForm onAdd={handleAddTransaction} />
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
          />
        </div>
      </main>
      <footer>
        <p>&copy; 2024 • Personal Finance Manager</p>
      </footer>
    </div>
  );
}

export default App;

