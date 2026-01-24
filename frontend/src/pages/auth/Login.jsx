import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import Input from '../../components/Input'

const Login = () => {
        const [formData, setFormData] = useState({ email: '', password: '', role: 'USER' })
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
                        const result = await login(formData.email, formData.password, formData.role)
                        if (result.success) {
                                switch (formData.role) {
                                        case 'AUTHORITY':
                                                navigate('/authority')
                                                break
                                        case 'ADMIN':
                                                navigate('/admin')
                                                break
                                        default:
                                                navigate('/dashboard')
                                }
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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-4">
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative w-full max-w-md">
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fadeIn">
                                        <div className="text-center mb-8">
                                                <div className="w-16 h-16 gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                                                        <span className="text-white font-bold text-2xl">O</span>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Welcome to OCRS</h1>
                                                <p className="text-gray-500 mt-1">Online Crime Reporting System</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-danger-50 text-danger-600 rounded-xl text-sm">
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

                                                <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700">Login As</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                                {['USER', 'AUTHORITY', 'ADMIN'].map((role) => (
                                                                        <button
                                                                                key={role}
                                                                                type="button"
                                                                                onClick={() => setFormData({ ...formData, role })}
                                                                                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${formData.role === role
                                                                                        ? 'bg-primary-600 text-white shadow-lg'
                                                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                                        }`}
                                                                        >
                                                                                {role}
                                                                        </button>
                                                                ))}
                                                        </div>
                                                </div>

                                                <Button type="submit" className="w-full" size="lg" loading={loading}>
                                                        Sign In
                                                </Button>
                                        </form>

                                        <p className="mt-6 text-center text-gray-600">
                                                Don't have an account?{' '}
                                                <Link to="/register" className="text-primary-600 font-medium hover:underline">
                                                        Register here
                                                </Link>
                                        </p>
                                </div>
                        </div>
                </div>
        )
}

export default Login
