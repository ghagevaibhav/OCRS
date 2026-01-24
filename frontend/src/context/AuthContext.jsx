import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
        const [user, setUser] = useState(null)
        const [loading, setLoading] = useState(true)

        useEffect(() => {
                const token = localStorage.getItem('token')
                const userData = localStorage.getItem('user')

                if (token && userData) {
                        try {
                                setUser(JSON.parse(userData))
                        } catch {
                                localStorage.removeItem('token')
                                localStorage.removeItem('user')
                        }
                }
                setLoading(false)
        }, [])

        const login = async (email, password, role) => {
                try {
                        const response = await authService.login({ email, password, role })

                        if (response.data.success) {
                                const { token, id, email: userEmail, fullName, role: userRole } = response.data.data
                                const userData = { id, email: userEmail, fullName, role: userRole }

                                localStorage.setItem('token', token)
                                localStorage.setItem('user', JSON.stringify(userData))
                                setUser(userData)

                                return { success: true }
                        }
                        return { success: false, message: response.data.message }
                } catch (error) {
                        console.error('Login error:', error)
                        const errorMessage = error.response?.data?.message || error.message || 'Login failed'
                        return { success: false, message: errorMessage }
                }
        }

        const register = async (data) => {
                const response = await authService.register(data)
                if (response.data.success) {
                        const { token, id, email, fullName, role } = response.data.data
                        const userData = { id, email, fullName, role }

                        localStorage.setItem('token', token)
                        localStorage.setItem('user', JSON.stringify(userData))
                        setUser(userData)

                        return { success: true }
                }
                return { success: false, message: response.data.message }
        }

        const logout = () => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setUser(null)
        }

        const value = {
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user
        }

        return (
                <AuthContext.Provider value={value}>
                        {!loading && children}
                </AuthContext.Provider>
        )
}

export const useAuth = () => {
        const context = useContext(AuthContext)
        if (!context) {
                throw new Error('useAuth must be used within an AuthProvider')
        }
        return context
}
