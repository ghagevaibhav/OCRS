import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'

// Auth Pages - Role-specific
import UserSignIn from './pages/auth/user/UserSignIn'
import UserSignUp from './pages/auth/user/UserSignUp'
import AdminSignIn from './pages/auth/admin/AdminSignIn'
import AuthoritySignIn from './pages/auth/authority/AuthoritySignIn'

// User Pages
import UserDashboard from './pages/user/Dashboard'
import FileFIR from './pages/user/FileFIR'
import FileMissing from './pages/user/FileMissing'
import TrackStatus from './pages/user/TrackStatus'

// Authority Pages
import AuthorityDashboard from './pages/authority/Dashboard'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import Analytics from './pages/admin/Analytics'

// Common
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * Render the application's route hierarchy and role-based navigation.
 *
 * Renders a page container with a conditional top navigation and a Routes tree that:
 * - Exposes sign-in/sign-up routes that redirect authenticated users to their landing pages.
 * - Redirects legacy URLs to their current equivalents.
 * - Protects user, authority, and admin routes by role.
 * - Redirects the root and unknown paths to appropriate destinations based on authentication state.
 *
 * @returns {JSX.Element} The app's routing layout and conditional navbar element.
 */
function AppRoutes() {
        const { user } = useAuth()

        return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                        {user && <Navbar />}
                        <Routes>
                                {/* Role-specific Auth Routes */}
                                <Route path="/user/signin" element={!user ? <UserSignIn /> : <Navigate to="/dashboard" />} />
                                <Route path="/user/signup" element={!user ? <UserSignUp /> : <Navigate to="/dashboard" />} />
                                <Route path="/admin/signin" element={!user ? <AdminSignIn /> : <Navigate to="/admin" />} />
                                <Route path="/authority/signin" element={!user ? <AuthoritySignIn /> : <Navigate to="/authority" />} />

                                {/* Legacy URL Redirects */}
                                <Route path="/login" element={<Navigate to="/user/signin" replace />} />
                                <Route path="/register" element={<Navigate to="/user/signup" replace />} />

                                {/* User Routes */}
                                <Route path="/dashboard" element={
                                        <ProtectedRoute roles={['USER']}>
                                                <UserDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/file-fir" element={
                                        <ProtectedRoute roles={['USER']}>
                                                <FileFIR />
                                        </ProtectedRoute>
                                } />
                                <Route path="/file-missing" element={
                                        <ProtectedRoute roles={['USER']}>
                                                <FileMissing />
                                        </ProtectedRoute>
                                } />
                                <Route path="/track-status" element={
                                        <ProtectedRoute roles={['USER']}>
                                                <TrackStatus />
                                        </ProtectedRoute>
                                } />

                                <Route path="/authority" element={
                                        <ProtectedRoute roles={['AUTHORITY']}>
                                                <AuthorityDashboard />
                                        </ProtectedRoute>
                                } />


                                {/* Admin Routes */}
                                <Route path="/admin" element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                                <AdminDashboard />
                                        </ProtectedRoute>
                                } />
                                <Route path="/admin/analytics" element={
                                        <ProtectedRoute roles={['ADMIN']}>
                                                <Analytics />
                                        </ProtectedRoute>
                                } />

                                {/* Default */}
                                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/user/signin"} />} />
                                <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                </div>
        )
}

/**
 * Application root component that provides authentication and toast contexts and renders the route tree.
 *
 * @returns {JSX.Element} The root React element wrapping AppRoutes with AuthProvider and ToastProvider.
 */
function App() {
        return (
                <AuthProvider>
                        <ToastProvider>
                                <AppRoutes />
                        </ToastProvider>
                </AuthProvider>
        )
}

export default App