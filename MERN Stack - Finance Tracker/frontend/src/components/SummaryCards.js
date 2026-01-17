import React from 'react';

const SummaryCards = ({ summary }) => {
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="summary-cards">
      <div className="card income-card">
        <h3>Total Income</h3>
        <p className="amount income-amount">{formatCurrency(summary.total_income)}</p>
        <small>This month: {formatCurrency(summary.month_income)}</small>
      </div>
      
      <div className="card expense-card">
        <h3>Total Expenses</h3>
        <p className="amount expense-amount">{formatCurrency(summary.total_expense)}</p>
        <small>This month: {formatCurrency(summary.month_expense)}</small>
      </div>
      
      <div className="card balance-card">
        <h3>Current Balance</h3>
        <p className={`amount ${summary.balance >= 0 ? 'income-amount' : 'expense-amount'}`}>
          {formatCurrency(summary.balance)}
        </p>
        <small>{summary.balance >= 0 ? 'Positive balance' : 'Negative balance'}</small>
      </div>
    </div>
  );
};

export default SummaryCards;

