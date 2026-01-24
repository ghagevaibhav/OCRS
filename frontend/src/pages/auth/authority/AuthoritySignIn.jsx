import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/Button'
import Input from '../../../components/Input'

const AuthoritySignIn = () => {
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
                        const result = await login(formData.email, formData.password, 'AUTHORITY')
                        if (result.success) {
                                navigate('/authority')
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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-4">
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative w-full max-w-md">
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fadeIn">
                                        <div className="text-center mb-8">
                                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Law Enforcement Portal</h1>
                                                <p className="text-gray-500 mt-1">Authority Officer Access</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                                                        {errors.general}
                                                </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                                <Input
                                                        label="Official Email"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your official email"
                                                        required
                                                />

                                                <Input
                                                        label="Password"
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Enter password"
                                                        required
                                                />

                                                <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" size="lg" loading={loading}>
                                                        Sign In as Authority
                                                </Button>
                                        </form>

                                        <div className="mt-6 text-center">
                                                <Link to="/user/signin" className="text-sm text-gray-500 hover:text-gray-700 mr-4">
                                                        Citizen Login
                                                </Link>
                                                <Link to="/admin/signin" className="text-sm text-gray-500 hover:text-gray-700">
                                                        Admin Login
                                                </Link>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default AuthoritySignIn
