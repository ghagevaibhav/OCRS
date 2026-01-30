import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
        const { user, logout } = useAuth()
        const navigate = useNavigate()
        const location = useLocation()
        const [isScrolled, setIsScrolled] = useState(false)
        const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

        useEffect(() => {
                const handleScroll = () => {
                        setIsScrolled(window.scrollY > 10)
                }
                window.addEventListener('scroll', handleScroll)
                return () => window.removeEventListener('scroll', handleScroll)
        }, [])

        // Close mobile menu on route change
        useEffect(() => {
                setIsMobileMenuOpen(false)
        }, [location.pathname])

        const handleLogout = () => {
                logout()
                navigate('/login')
        }

        const getNavLinks = () => {
                switch (user?.role) {
                        case 'USER':
                                return [
                                        { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
                                        { to: '/file-fir', label: 'File FIR', icon: '📝' },
                                        { to: '/file-missing', label: 'Missing Person', icon: '🔍' },
                                        { to: '/track-status', label: 'Track Status', icon: '📊' },
                                ]
                        case 'AUTHORITY':
                                return [
                                        { to: '/authority', label: 'Dashboard', icon: '🏠' },
                                ]
                        case 'ADMIN':
                                return [
                                        { to: '/admin', label: 'Dashboard', icon: '🏠' },
                                        { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
                                ]
                        default:
                                return []
                }
        }

        const isActiveLink = (to) => location.pathname === to

        const getUserInitials = () => {
                if (!user?.fullName) return 'U'
                const names = user.fullName.split(' ')
                return names.map(n => n[0]).slice(0, 2).join('').toUpperCase()
        }

        const getRoleBadgeColor = () => {
                switch (user?.role) {
                        case 'ADMIN': return 'bg-danger-100 text-danger-700'
                        case 'AUTHORITY': return 'bg-success-100 text-success-700'
                        default: return 'bg-primary-100 text-primary-700'
                }
        }

        return (
                <>
                        <nav className={`bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'
                                }`}>
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                        <div className="flex justify-between h-16">
                                                {/* Logo and Desktop Nav */}
                                                <div className="flex items-center">
                                                        <Link to="/" className="flex items-center gap-2.5 group">
                                                                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                                                                        <span className="text-white font-bold text-lg">O</span>
                                                                </div>
                                                                <span className="font-bold text-xl text-primary-800">OCRS</span>
                                                        </Link>

                                                        {/* Desktop Navigation */}
                                                        <div className="hidden md:flex ml-10 space-x-1">
                                                                {getNavLinks().map((link) => (
                                                                        <Link
                                                                                key={link.to}
                                                                                to={link.to}
                                                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${isActiveLink(link.to)
                                                                                        ? 'text-primary-600 bg-primary-50'
                                                                                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                                                                        }`}
                                                                        >
                                                                                {link.label}
                                                                                {isActiveLink(link.to) && (
                                                                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-500 rounded-full" />
                                                                                )}
                                                                        </Link>
                                                                ))}
                                                        </div>
                                                </div>

                                                {/* User Section & Mobile Menu Button */}
                                                <div className="flex items-center gap-3">
                                                        {/* User Info - Desktop */}
                                                        <div className="hidden sm:flex items-center gap-3">
                                                                <div className="text-right">
                                                                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor()}`}>
                                                                                {user?.role}
                                                                        </span>
                                                                </div>
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                                                        {getUserInitials()}
                                                                </div>
                                                        </div>

                                                        {/* Logout Button - Desktop */}
                                                        <button
                                                                onClick={handleLogout}
                                                                className="hidden sm:flex px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/25 hover:shadow-primary-500/40"
                                                        >
                                                                Logout
                                                        </button>

                                                        {/* Mobile Menu Button */}
                                                        <button
                                                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                                                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                                                                aria-label="Toggle menu"
                                                        >
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        {isMobileMenuOpen ? (
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        ) : (
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                                        )}
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        </nav>

                        {/* Mobile Menu Overlay */}
                        {isMobileMenuOpen && (
                                <div
                                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                />
                        )}

                        {/* Mobile Menu Drawer */}
                        <div className={`fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                                }`}>
                                <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {getUserInitials()}
                                                </div>
                                                <div>
                                                        <p className="font-medium text-gray-900">{user?.fullName}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor()}`}>
                                                                {user?.role}
                                                        </span>
                                                </div>
                                        </div>
                                </div>

                                <nav className="p-4 space-y-1">
                                        {getNavLinks().map((link) => (
                                                <Link
                                                        key={link.to}
                                                        to={link.to}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActiveLink(link.to)
                                                                ? 'text-primary-600 bg-primary-50'
                                                                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                                                }`}
                                                >
                                                        <span className="text-lg">{link.icon}</span>
                                                        {link.label}
                                                </Link>
                                        ))}
                                </nav>

                                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                                        <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-md"
                                        >
                                                Logout
                                        </button>
                                </div>
                        </div>
                </>
        )
}

export default Navbar

