import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
        const { user, logout } = useAuth()
        const navigate = useNavigate()

        const handleLogout = () => {
                logout()
                navigate('/login')
        }

        const getNavLinks = () => {
                switch (user?.role) {
                        case 'USER':
                                return [
                                        { to: '/dashboard', label: 'Dashboard' },
                                        { to: '/file-fir', label: 'File FIR' },
                                        { to: '/file-missing', label: 'Missing Person' },
                                        { to: '/track-status', label: 'Track Status' },
                                ]
                        case 'AUTHORITY':
                                return [
                                        { to: '/authority', label: 'Dashboard' },
                                ]
                        case 'ADMIN':
                                return [
                                        { to: '/admin', label: 'Dashboard' },
                                        { to: '/admin/analytics', label: 'Analytics' },
                                ]
                        default:
                                return []
                }
        }

        return (
                <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex justify-between h-16">
                                        <div className="flex items-center">
                                                <Link to="/" className="flex items-center gap-2">
                                                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                                                                <span className="text-white font-bold text-lg">O</span>
                                                        </div>
                                                        <span className="font-bold text-xl text-primary-800">OCRS</span>
                                                </Link>

                                                <div className="hidden md:flex ml-10 space-x-4">
                                                        {getNavLinks().map((link) => (
                                                                <Link
                                                                        key={link.to}
                                                                        to={link.to}
                                                                        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                                >
                                                                        {link.label}
                                                                </Link>
                                                        ))}
                                                </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                                                        <p className="text-xs text-gray-500">{user?.role}</p>
                                                </div>
                                                <button
                                                        onClick={handleLogout}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                                >
                                                        Logout
                                                </button>
                                        </div>
                                </div>
                        </div>
                </nav>
        )
}

export default Navbar
