import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/Button'
import Input from '../../../components/Input'

const UserSignIn = () => {
        const [formData, setFormData] = useState({ email: '', password: '' })
        const [errors, setErrors] = useState({})
        const [loading, setLoading] = useState(false)
        const { login } = useAuth()
        const navigate = useNavigate()

        const handleChange = (e) => {
                setFormData({ ...formData, [e.target.name]: e.target.value })
                setErrors({ ...errors, [e.target.name]: '' })
        }

        const handleSubmit = async (e) => {
                e.preventDefault()
                setLoading(true)
                setErrors({})

                try {
                        const result = await login(formData.email, formData.password, 'USER')
                        if (result.success) {
                                navigate('/dashboard')
                        } else {
                                setErrors({ general: result.message || 'Invalid credentials' })
                        }
                } catch (error) {
                        setErrors({ general: error.response?.data?.message || 'Login failed' })
                } finally {
                        setLoading(false)
                }
        }

        return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-4">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
                                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl animate-float" />
                        </div>

                        <div className="relative w-full max-w-md animate-slideUp">
                                {/* Brand badge */}
                                <div className="text-center mb-6">
                                        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                Online Crime Reporting System
                                        </span>
                                </div>

                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                                        <div className="text-center mb-8">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Citizen Portal</h1>
                                                <p className="text-gray-500 mt-1">Sign in to file and track your reports</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-shake">
                                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {errors.general}
                                                </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                                <Input
                                                        label="Email Address"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your email"
                                                        required
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                        }
                                                />

                                                <Input
                                                        label="Password"
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Enter your password"
                                                        required
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                        }
                                                />

                                                <Button type="submit" className="w-full" size="lg" loading={loading}>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sign In
                                                </Button>
                                        </form>

                                        <div className="mt-6 space-y-3">
                                                <p className="text-center text-gray-600">
                                                        Don't have an account?{' '}
                                                        <Link to="/user/signup" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                                                                Register here
                                                        </Link>
                                                </p>
                                                <div className="flex items-center justify-center gap-4 pt-2">
                                                        <Link to="/admin/signin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                                Admin
                                                        </Link>
                                                        <span className="text-gray-300">|</span>
                                                        <Link to="/authority/signin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Authority
                                                        </Link>
                                                </div>
                                        </div>
                                </div>

                                {/* Footer */}
                                <p className="text-center text-white/60 text-sm mt-6">
                                        © 2024 OCRS. All rights reserved.
                                </p>
                        </div>
                </div>
        )
}

export default UserSignIn
