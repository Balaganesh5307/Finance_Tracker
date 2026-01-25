import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

const TransactionForm = ({ transaction, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (transaction) {
            setFormData({
                type: transaction.type,
                amount: transaction.amount,
                category: transaction.category,
                description: transaction.description || '',
                date: new Date(transaction.date).toISOString().split('T')[0]
            });
        }
    }, [transaction]);

    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'type' ? { category: '' } : {})
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!formData.category) {
            setError('Please select a category');
            return;
        }

        onSubmit({
            ...formData,
            amount: parseFloat(formData.amount)
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <div className="filter-group">
                                <button
                                    type="button"
                                    className={`filter-btn ${formData.type === 'income' ? 'active' : ''}`}
                                    onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                                    style={formData.type === 'income' ? { background: 'var(--accent-green)', borderColor: 'var(--accent-green)' } : {}}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    className={`filter-btn ${formData.type === 'expense' ? 'active' : ''}`}
                                    onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                                    style={formData.type === 'expense' ? { background: 'var(--accent-red)', borderColor: 'var(--accent-red)' } : {}}
                                >
                                    Expense
                                </button>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                name="category"
                                className="form-input form-select"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <input
                                type="text"
                                name="description"
                                className="form-input"
                                placeholder="Add a note..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-success">
                            {transaction ? 'Update' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionForm;
