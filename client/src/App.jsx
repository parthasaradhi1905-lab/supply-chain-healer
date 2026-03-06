import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import LoginPage from './pages/LoginPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyOrdersPage from './pages/MyOrdersPage';
import TrackShipmentsPage from './pages/TrackShipmentsPage';
import OrderIntakePage from './pages/OrderIntakePage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import VesselTrackerPage from './pages/VesselTrackerPage';
import PricingWindowPage from './pages/PricingWindowPage';
import LivePricesPage from './pages/LivePricesPage';
import StockToolPage from './pages/StockToolPage';
import CountryDataPage from './pages/CountryDataPage';
import ArbitrageGridPage from './pages/ArbitrageGridPage';
import EnergyMapPage from './pages/EnergyMapPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import CommandPalette from './components/common/CommandPalette';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="spinner w-12 h-12"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppRoutes() {
    const { isAuthenticated, user } = useAuth();

    return (
        <>
            <CommandPalette />
            <Routes>
                {/* Login Page */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            user?.role === 'supplier' ? (
                                <Navigate to="/supplier-dashboard" replace />
                            ) : user?.role === 'admin' ? (
                                <Navigate to="/admin-dashboard" replace />
                            ) : (
                                <Navigate to="/buyer-dashboard" replace />
                            )
                        ) : (
                            <LoginPage />
                        )
                    }
                />

                {/* Admin Dashboard */}
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Buyer Dashboard */}
                <Route
                    path="/buyer-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                            <BuyerDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Supplier Dashboard */}
                <Route
                    path="/supplier-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['supplier', 'admin']}>
                            <SupplierDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* My Orders - Dedicated Page */}
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                            <MyOrdersPage />
                        </ProtectedRoute>
                    }
                />

                {/* Track Shipments - Dedicated Page */}
                <Route
                    path="/track"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                            <TrackShipmentsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Order Intake - redirect to Supplier Dashboard */}
                <Route
                    path="/orders-intake"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'supplier', 'admin']}>
                            <OrderIntakePage />
                        </ProtectedRoute>
                    }
                />

                {/* Alert Center - redirect to Supplier Dashboard */}
                <Route
                    path="/alerts"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'supplier', 'admin']}>
                            <AlertsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Profile */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'supplier', 'admin']}>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />

                {/* Settings */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute allowedRoles={['buyer', 'supplier', 'admin']}>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Buyer Menu Pages */}
                <Route path="/vessel-tracker" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><VesselTrackerPage /></ProtectedRoute>} />
                <Route path="/pricing-window" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><PricingWindowPage /></ProtectedRoute>} />
                <Route path="/live-prices" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><LivePricesPage /></ProtectedRoute>} />
                <Route path="/stock-tool" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><StockToolPage /></ProtectedRoute>} />
                <Route path="/country-data" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><CountryDataPage /></ProtectedRoute>} />
                <Route path="/arbitrage-grid" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><ArbitrageGridPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><NotificationsPage /></ProtectedRoute>} />
                <Route path="/digital-twin" element={<ProtectedRoute allowedRoles={['buyer', 'admin']}><DigitalTwinPage /></ProtectedRoute>} />

                {/* 404 Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </SettingsProvider>
        </AuthProvider>
    );
}

export default App;
