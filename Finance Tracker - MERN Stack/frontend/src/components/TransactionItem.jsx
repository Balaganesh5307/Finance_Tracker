import { FiArrowUp, FiArrowDown, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
    const { formatCurrency } = useAuth();

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="transaction-item">
            <div className="transaction-info">
                <div className={`transaction-icon ${transaction.type}`}>
                    {transaction.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                </div>
                <div className="transaction-details">
                    <h4>{transaction.category}</h4>
                    <p>{transaction.description || formatDate(transaction.date)}</p>
                </div>
            </div>

            <span className={`transaction-amount ${transaction.type}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>

            <div className="transaction-actions">
                <button className="btn-icon" onClick={() => onEdit(transaction)} title="Edit">
                    <FiEdit2 />
                </button>
                <button className="btn-icon delete" onClick={() => onDelete(transaction._id)} title="Delete">
                    <FiTrash2 />
                </button>
            </div>
        </div>
    );
};

export default TransactionItem;
