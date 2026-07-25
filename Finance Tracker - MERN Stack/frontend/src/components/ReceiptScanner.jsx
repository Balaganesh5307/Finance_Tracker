import { useState } from 'react';
import api from '../utils/api';
import { FiUploadCloud, FiRefreshCw, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ReceiptScanner = ({ onScanComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (selectedFile) => {
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            toast.error('Please upload an image receipt (PNG, JPG, JPEG).');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleScan = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('receipt', file);

        try {
            toast.loading('AI is scanning your receipt...', { id: 'scan-loading' });
            const res = await api.post('/api/transactions/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Receipt scanned successfully!', { id: 'scan-loading' });
            if (onScanComplete) {
                onScanComplete(res.data);
            }
            // Clear scanner state
            setFile(null);
            setPreview(null);
        } catch (err) {
            console.error('Scan err:', err);
            toast.error(err.response?.data?.message || 'Failed to parse receipt. Please verify image quality.', { id: 'scan-loading' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px dashed var(--border-color)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <span>🤖 AI Receipt Scanner</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Upload your bill or receipt image to autofill the transaction form.
            </p>

            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: dragActive ? '2px dashed var(--accent-blue)' : '2px dashed rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(9,132,227,0.05)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.2s, background-color 0.2s'
                }}
            >
                {preview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                            src={preview} 
                            alt="Receipt Preview" 
                            style={{ maxHeight: '120px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} 
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleScan}
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {loading ? <FiRefreshCw className="spin" /> : <FiCheck />}
                                <span>{loading ? 'Scanning...' : 'Process Receipt'}</span>
                            </button>
                            <button
                                onClick={() => { setFile(null); setPreview(null); }}
                                disabled={loading}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                        <FiUploadCloud style={{ fontSize: '32px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.8rem', margin: '0 0 4px 0' }}>Drag & drop or Click to Upload</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Supports JPG, JPEG, PNG</span>
                    </label>
                )}
            </div>
        </div>
    );
};

export default ReceiptScanner;
