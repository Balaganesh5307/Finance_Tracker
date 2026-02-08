const SkeletonCard = ({ type = 'card' }) => {
    if (type === 'summary') {
        return (
            <div className="card summary-card skeleton-card">
                <div className="card-header">
                    <div className="skeleton skeleton-text" style={{ width: '80px' }}></div>
                    <div className="skeleton skeleton-icon"></div>
                </div>
                <div className="skeleton skeleton-amount"></div>
            </div>
        );
    }

    if (type === 'transaction') {
        return (
            <div className="transaction-item skeleton-card">
                <div className="transaction-info">
                    <div className="skeleton skeleton-icon"></div>
                    <div className="transaction-details">
                        <div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: '0.5rem' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '80px', height: '12px' }}></div>
                    </div>
                </div>
                <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
            </div>
        );
    }

    if (type === 'chart') {
        return (
            <div className="card chart-card skeleton-card">
                <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }}></div>
                <div className="skeleton skeleton-chart"></div>
            </div>
        );
    }

    return (
        <div className="card skeleton-card">
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
        </div>
    );
};

export default SkeletonCard;
