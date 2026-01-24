import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/Button'
import Input from '../../../components/Input'

const UserSignUp = () => {
        const [formData, setFormData] = useState({
                email: '',
                password: '',
                confirmPassword: '',
                fullName: '',
                phone: '',
                address: '',
                aadhaarNumber: ''
        })
        const [errors, setErrors] = useState({})
        const [loading, setLoading] = useState(false)
        const { register } = useAuth()
        const navigate = useNavigate()

        const handleChange = (e) => {
                setFormData({ ...formData, [e.target.name]: e.target.value })
                setErrors({ ...errors, [e.target.name]: '' })
        }

        const validate = () => {
                const newErrors = {}
                if (formData.password !== formData.confirmPassword) {
                        newErrors.confirmPassword = 'Passwords do not match'
                }
                if (formData.password.length < 6) {
                        newErrors.password = 'Password must be at least 6 characters'
                }
                if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
                        newErrors.phone = 'Phone must be 10 digits'
                }
                if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
                        newErrors.aadhaarNumber = 'Aadhaar must be 12 digits'
                }
                setErrors(newErrors)
                return Object.keys(newErrors).length === 0
        }

        const handleSubmit = async (e) => {
                e.preventDefault()
                if (!validate()) return

                setLoading(true)
                try {
                        const { confirmPassword, ...data } = formData
                        const result = await register(data)
                        if (result.success) {
                                navigate('/dashboard')
                        } else {
                                setErrors({ general: result.message || 'Registration failed' })
                        }
                } catch (error) {
                        setErrors({ general: error.response?.data?.message || 'Registration failed' })
                } finally {
                        setLoading(false)
                }
        }

        return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4 py-12">
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative w-full max-w-lg">
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fadeIn">
                                        <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Create Citizen Account</h1>
                                                <p className="text-gray-500 mt-1">Register to file crime reports</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                                                        {errors.general}
                                                </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                                <Input
                                                        label="Full Name *"
                                                        name="fullName"
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        placeholder="Enter your full name"
                                                        maxLength={100}
                                                        required
                                                />

                                                <Input
                                                        label="Email Address *"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your email"
                                                        required
                                                />

                                                <div className="grid grid-cols-2 gap-4">
                                                        <Input
                                                                label="Password *"
                                                                type="password"
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                placeholder="Min 6 characters"
                                                                error={errors.password}
                                                                required
                                                        />

                                                        <Input
                                                                label="Confirm Password *"
                                                                type="password"
                                                                name="confirmPassword"
                                                                value={formData.confirmPassword}
                                                                onChange={handleChange}
                                                                placeholder="Confirm password"
                                                                error={errors.confirmPassword}
                                                                required
                                                        />
                                                </div>

                                                <Input
                                                        label="Phone Number"
                                                        name="phone"
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        placeholder="10 digit number"
                                                        maxLength={10}
                                                        pattern="[0-9]*"
                                                        error={errors.phone}
                                                />

                                                <Input
                                                        label="Aadhaar Number"
                                                        name="aadhaarNumber"
                                                        value={formData.aadhaarNumber}
                                                        onChange={handleChange}
                                                        placeholder="12 digit Aadhaar"
                                                        maxLength={12}
                                                        pattern="[0-9]*"
                                                        error={errors.aadhaarNumber}
                                                />

                                                <Input
                                                        label="Address"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleChange}
                                                        placeholder="Your address"
                                                />

                                                <Button type="submit" className="w-full" size="lg" loading={loading}>
                                                        Create Account
                                                </Button>
                                        </form>

                                        <p className="mt-6 text-center text-gray-600">
                                                Already have an account?{' '}
                                                <Link to="/user/signin" className="text-blue-600 font-medium hover:underline">
                                                        Sign in
                                                </Link>
                                        </p>
                                </div>
                        </div>
                </div>
        )
}

export default UserSignUp
