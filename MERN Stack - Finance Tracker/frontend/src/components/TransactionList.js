import React from 'react';

const TransactionList = ({ transactions, onDelete }) => {
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="transactions-section">
        <h2>Transaction History</h2>
        <div className="transactions-list">
          <p className="empty-state">No transactions found. Add your first transaction above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-section">
      <h2>Transaction History</h2>
      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div 
            key={transaction._id} 
            className="transaction-item" 
            data-type={transaction.transaction_type}
          >
            <div className="transaction-icon">
              <span className="icon">
                {transaction.transaction_type === 'income' ? '💰' : '💸'}
              </span>
            </div>
            <div className="transaction-details">
              <h4>{transaction.description}</h4>
              <p className="transaction-meta">
                {transaction.category && `${transaction.category} • `}
                {formatDate(transaction.date)}
              </p>
              {transaction.notes && (
                <p className="transaction-notes">{transaction.notes}</p>
              )}
            </div>
            <div className="transaction-amount">
              <span className={`amount ${transaction.transaction_type === 'income' ? 'income-amount' : 'expense-amount'}`}>
                {transaction.transaction_type === 'expense' ? '-' : ''}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            <button 
              className="delete-btn" 
              onClick={() => onDelete(transaction._id)} 
              title="Delete"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;

