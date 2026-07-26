import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiMessageSquare, FiX, FiSend, FiCpu, FiTrendingUp, FiPlus, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AIChatWidget = () => {
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'assistant', text: 'Hi! I am your AI financial assistant. Ask me to summarize your transactions, log a new expense, or analyze your budget!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/ai/history');
            if (res.data && res.data.length > 0) {
                const formatted = res.data.map(msg => ({
                    sender: msg.sender,
                    text: msg.text
                }));
                setMessages(formatted);
                toast.success('Chat history loaded successfully!');
            } else {
                toast.info('No previous chat history found.');
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
            toast.error('Failed to load chat history.');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Don't render widget if user is not authenticated
    if (!isAuthenticated) return null;

    const handleSend = async (textToSend) => {
        const text = textToSend || input;
        if (!text.trim()) return;

        if (!textToSend) {
            setInput('');
        }

        // Add user message
        const userMsg = { sender: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // Keep last 10 messages of history to avoid payload bloat
            const chatHistory = messages.slice(-10);
            
            const res = await api.post('/api/ai/chat', {
                message: text,
                chatHistory
            });

            setMessages(prev => [...prev, { sender: 'assistant', text: res.data.response }]);
        } catch (err) {
            console.error('AI error:', err);
            toast.error(err.response?.data?.message || 'Failed to connect to AI assistant.');
            setMessages(prev => [...prev, { 
                sender: 'assistant', 
                text: 'Sorry, I encountered an error. Please ensure your API keys are valid.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const suggestionChips = [
        { label: 'Summarize finances', query: 'Show my financial summary' },
        { label: 'Add coffee expense', query: 'Add transaction: expense of 150 for coffee today' },
        { label: 'List food transactions', query: 'Show my food transactions' }
    ];

    return (
        <div className="ai-widget-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="ai-widget-toggle"
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 8px 32px rgba(108, 92, 231, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <FiMessageSquare />
                </button>
            )}

            {/* Chat Drawer */}
            {isOpen && (
                <div
                    className="ai-chat-drawer"
                    style={{
                        width: '380px',
                        height: '520px',
                        background: 'rgba(26, 32, 44, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-2xl)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="ai-chat-header"
                        style={{
                            padding: '1.25rem',
                            background: 'linear-gradient(90deg, rgba(108,92,231,0.1) 0%, rgba(9,132,227,0.1) 100%)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiCpu style={{ color: 'var(--accent-blue)', fontSize: '20px' }} />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Finance AI Assistant</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Powered by Groq & Gemini</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={fetchChatHistory}
                                title="View Previous Chats"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'color 0.2s',
                                    padding: '4px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <FiClock />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'color 0.2s',
                                    padding: '4px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <FiX />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div
                        className="ai-chat-messages"
                        style={{
                            flex: 1,
                            padding: '1.25rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    background: msg.sender === 'user' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div
                                style={{
                                    alignSelf: 'flex-start',
                                    background: 'rgba(255,255,255,0.06)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '14px 14px 14px 2px',
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center'
                                }}
                            >
                                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestion Chips */}
                    {messages.length === 1 && (
                        <div
                            className="ai-chat-suggestions"
                            style={{
                                padding: '0.5rem 1.25rem',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.02)'
                            }}
                        >
                            {suggestionChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(chip.query)}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '20px',
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s, color 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer Input */}
                    <div
                        className="ai-chat-footer"
                        style={{
                            padding: '1rem 1.25rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            gap: '0.5rem',
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={loading}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem 0.75rem',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={loading}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--accent-blue)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            <FiSend />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;
