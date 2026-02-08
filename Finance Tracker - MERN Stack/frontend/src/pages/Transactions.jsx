import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import api from '../utils/api';
import { FiPlus, FiFilter, FiDownload, FiFileText } from 'react-icons/fi';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import SkeletonCard from '../components/SkeletonCard';

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
            const res = await api.get('/api/transactions');
            setTransactions(res.data);
        } catch (err) {
            toast.error('Failed to load transactions');
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
                await api.put(`/api/transactions/${editTransaction._id}`, data);
                toast.success('Transaction updated!');
            } else {
                await api.post('/api/transactions', data);
                toast.success('Transaction added!');
            }
            fetchTransactions();
            setShowForm(false);
            setEditTransaction(null);
        } catch (err) {
            toast.error('Failed to save transaction');
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
                await api.delete(`/api/transactions/${deleteConfirm}`);
                toast.success('Transaction deleted!');
                fetchTransactions();
            } catch (err) {
                toast.error('Failed to delete transaction');
            }
            setDeleteConfirm(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
        const rows = filteredTransactions.map(t => [
            new Date(t.date || t.createdAt).toLocaleDateString(),
            t.type,
            t.category,
            t.description || '',
            t.amount
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported!');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Transaction Report', 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

        const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        doc.setFontSize(12);
        doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 20, 45);
        doc.text(`Total Expenses: ${formatCurrency(totalExpense)}`, 20, 55);
        doc.text(`Balance: ${formatCurrency(totalIncome - totalExpense)}`, 20, 65);

        doc.setFontSize(10);
        let y = 85;
        doc.text('Date', 20, y);
        doc.text('Type', 50, y);
        doc.text('Category', 80, y);
        doc.text('Amount', 160, y);

        y += 10;
        filteredTransactions.slice(0, 30).forEach(t => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(new Date(t.date || t.createdAt).toLocaleDateString(), 20, y);
            doc.text(t.type, 50, y);
            doc.text(t.category, 80, y);
            doc.text(formatCurrency(t.amount), 160, y);
            y += 8;
        });

        doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF exported!');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="transactions-page">
                <div className="transactions-header">
                    <div className="skeleton skeleton-text" style={{ width: '150px', height: '24px' }}></div>
                </div>
                <div className="card">
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                    <SkeletonCard type="transaction" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="transactions-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="transactions-header">
                <h2>All Transactions</h2>
                <div className="export-buttons">
                    <button className="btn-export" onClick={exportToCSV} title="Export CSV">
                        <FiDownload /> CSV
                    </button>
                    <button className="btn-export" onClick={exportToPDF} title="Export PDF">
                        <FiFileText /> PDF
                    </button>
                    <button className="btn btn-success" onClick={() => setShowForm(true)}>
                        <FiPlus />
                        Add Transaction
                    </button>
                </div>
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

            <motion.div
                className="card"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <FiFilter />
                        <h3>No transactions found</h3>
                        <p>{transactions.length === 0 ? 'Add your first transaction to get started' : 'Try adjusting your filters'}</p>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {filteredTransactions.map(transaction => (
                            <motion.div key={transaction._id} variants={itemVariants}>
                                <TransactionItem
                                    transaction={transaction}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

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
                    <motion.div
                        className="modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '400px' }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
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
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default Transactions;
