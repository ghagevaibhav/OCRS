import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, roles }) => {
        const { user, isAuthenticated } = useAuth()

        if (!isAuthenticated) {
                return <Navigate to="/user/signin" />
        }

        if (roles && !roles.includes(user?.role)) {
                // Redirect based on user role
                switch (user?.role) {
                        case 'USER':
                                return <Navigate to="/dashboard" />
                        case 'AUTHORITY':
                                return <Navigate to="/authority" />
                        case 'ADMIN':
                                return <Navigate to="/admin" />
                        default:
                                return <Navigate to="/login" />
                }
        }

        return children
}

export default ProtectedRoute
