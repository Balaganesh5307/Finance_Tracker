import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/AdminDashboard';
import AIChatWidget from './components/AIChatWidget';
import BudgetsAndGoals from './pages/BudgetsAndGoals';
import Profile from './pages/Profile';
import CountrySelectModal from './components/CountrySelectModal';
import MonthlySavings from './pages/MonthlySavings';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/transactions" element={
                                <ProtectedRoute>
                                    <Transactions />
                                </ProtectedRoute>
                            } />
                            <Route path="/budgets-goals" element={
                                <ProtectedRoute>
                                    <BudgetsAndGoals />
                                </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            } />
                            <Route path="/savings" element={
                                <ProtectedRoute>
                                    <MonthlySavings />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin" element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            } />
                            <Route path="/" element={<Home />} />
                        </Routes>
                    </main>
                    <AIChatWidget />
                    <CountrySelectModal />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
