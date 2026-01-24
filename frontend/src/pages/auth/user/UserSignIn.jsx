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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative w-full max-w-md">
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fadeIn">
                                        <div className="text-center mb-8">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Citizen Portal</h1>
                                                <p className="text-gray-500 mt-1">Sign in to file and track your reports</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
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
                                                />

                                                <Input
                                                        label="Password"
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Enter your password"
                                                        required
                                                />

                                                <Button type="submit" className="w-full" size="lg" loading={loading}>
                                                        Sign In
                                                </Button>
                                        </form>

                                        <div className="mt-6 space-y-3">
                                                <p className="text-center text-gray-600">
                                                        Don't have an account?{' '}
                                                        <Link to="/user/signup" className="text-blue-600 font-medium hover:underline">
                                                                Register here
                                                        </Link>
                                                </p>
                                                <div className="text-center">
                                                        <Link to="/admin/signin" className="text-sm text-gray-500 hover:text-gray-700 mr-4">
                                                                Admin Login
                                                        </Link>
                                                        <Link to="/authority/signin" className="text-sm text-gray-500 hover:text-gray-700">
                                                                Authority Login
                                                        </Link>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default UserSignIn
