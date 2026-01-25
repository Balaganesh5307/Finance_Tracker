import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiFilter } from 'react-icons/fi';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTransaction, setEditTransaction] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, filter, searchTerm]);

    const fetchTransactions = async () => {
        try {
            const res = await axios.get('/api/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        if (filter !== 'all') {
            filtered = filtered.filter(t => t.type === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredTransactions(filtered);
    };

    const handleAddTransaction = async (data) => {
        try {
            if (editTransaction) {
                await axios.put(`/api/transactions/${editTransaction._id}`, data);
            } else {
                await axios.post('/api/transactions', data);
            }
            fetchTransactions();
            setShowForm(false);
            setEditTransaction(null);
        } catch (err) {
            console.error('Error saving transaction:', err);
        }
    };

    const handleEdit = (transaction) => {
        setEditTransaction(transaction);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirm) {
            try {
                await axios.delete(`/api/transactions/${deleteConfirm}`);
                fetchTransactions();
            } catch (err) {
                console.error('Error deleting transaction:', err);
            }
            setDeleteConfirm(null);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="transactions-page">
            <div className="transactions-header">
                <h2>All Transactions</h2>
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                    <FiPlus />
                    Add Transaction
                </button>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <FiFilter />
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
                        onClick={() => setFilter('income')}
                        style={filter === 'income' ? { background: 'var(--accent-green)', borderColor: 'var(--accent-green)' } : {}}
                    >
                        Income
                    </button>
                    <button
                        className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
                        onClick={() => setFilter('expense')}
                        style={filter === 'expense' ? { background: 'var(--accent-red)', borderColor: 'var(--accent-red)' } : {}}
                    >
                        Expenses
                    </button>
                </div>

                <input
                    type="text"
                    className="form-input"
                    placeholder="Search by category or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            <div className="card">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <FiFilter />
                        <h3>No transactions found</h3>
                        <p>{transactions.length === 0 ? 'Add your first transaction to get started' : 'Try adjusting your filters'}</p>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {filteredTransactions.map(transaction => (
                            <TransactionItem
                                key={transaction._id}
                                transaction={transaction}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {filteredTransactions.length > 0 && (
                <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
            )}

            {showForm && (
                <TransactionForm
                    transaction={editTransaction}
                    onSubmit={handleAddTransaction}
                    onClose={() => {
                        setShowForm(false);
                        setEditTransaction(null);
                    }}
                />
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Delete Transaction</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Are you sure you want to delete this transaction? This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn" onClick={handleDeleteConfirm} style={{ background: 'var(--gradient-red)', color: 'white' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
