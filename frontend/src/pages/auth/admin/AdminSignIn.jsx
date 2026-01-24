import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/Button'
import Input from '../../../components/Input'

const AdminSignIn = () => {
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
                        const result = await login(formData.email, formData.password, 'ADMIN')
                        if (result.success) {
                                navigate('/admin')
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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black p-4">
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-600/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative w-full max-w-md">
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fadeIn">
                                        <div className="text-center mb-8">
                                                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                                                <p className="text-gray-500 mt-1">System Administration Access</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                                                        {errors.general}
                                                </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                                <Input
                                                        label="Admin Email"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter admin email"
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

                                                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900" size="lg" loading={loading}>
                                                        Sign In as Admin
                                                </Button>
                                        </form>

                                        <div className="mt-6 text-center">
                                                <Link to="/user/signin" className="text-sm text-gray-500 hover:text-gray-700 mr-4">
                                                        Citizen Login
                                                </Link>
                                                <Link to="/authority/signin" className="text-sm text-gray-500 hover:text-gray-700">
                                                        Authority Login
                                                </Link>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default AdminSignIn
