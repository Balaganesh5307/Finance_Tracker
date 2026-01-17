import React, { useState, useEffect } from 'react';

const TransactionForm = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: '',
    category: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    onAdd(formData);
    
    // Reset form
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      type: '',
      amount: '',
      description: '',
      category: '',
      date: today,
      notes: ''
    });
  };

  return (
    <div className="form-section">
      <h2>New Transaction</h2>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select 
              id="type" 
              name="type" 
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input 
              type="number" 
              id="amount" 
              name="amount" 
              value={formData.amount}
              onChange={handleChange}
              step="0.01" 
              min="0" 
              required 
              placeholder="0.00"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input 
              type="date" 
              id="date" 
              name="date" 
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <input 
              type="text" 
              id="description" 
              name="description" 
              value={formData.description}
              onChange={handleChange}
              required 
              placeholder="Enter transaction description"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input 
              type="text" 
              id="category" 
              name="category" 
              value={formData.category}
              onChange={handleChange}
              list="categories" 
              placeholder="e.g., Food, Salary"
            />
            <datalist id="categories">
              <option value="Food" />
              <option value="Transport" />
              <option value="Bills" />
              <option value="Entertainment" />
              <option value="Shopping" />
              <option value="Salary" />
              <option value="Freelance" />
              <option value="Other" />
            </datalist>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes}
              onChange={handleChange}
              rows="2" 
              placeholder="Additional notes (optional)"
            />
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary">Add Transaction</button>
      </form>
    </div>
  );
};

export default TransactionForm;

