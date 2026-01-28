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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-4 py-12">
                        {/* Animated background elements */}
                        <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
                                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl animate-float" />
                        </div>

                        <div className="relative w-full max-w-lg animate-slideUp">
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
                                        <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl font-bold text-gray-900">Create Citizen Account</h1>
                                                <p className="text-gray-500 mt-1">Register to file crime reports</p>
                                        </div>

                                        {errors.general && (
                                                <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-shake">
                                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {errors.general}
                                                </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                                {/* Personal Information Section */}
                                                <div className="space-y-4">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1 border-b border-gray-100">
                                                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                Personal Information
                                                        </div>

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
                                                </div>

                                                {/* Contact & Identity Section */}
                                                <div className="space-y-4 pt-2">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-1 border-b border-gray-100">
                                                                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                                </svg>
                                                                Contact & Identity
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
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
                                                        </div>

                                                        <Input
                                                                label="Address"
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={handleChange}
                                                                placeholder="Your address"
                                                        />
                                                </div>

                                                <Button type="submit" className="w-full" size="lg" loading={loading}>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                        Create Account
                                                </Button>
                                        </form>

                                        <p className="mt-6 text-center text-gray-600">
                                                Already have an account?{' '}
                                                <Link to="/user/signin" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                                                        Sign in
                                                </Link>
                                        </p>
                                </div>

                                {/* Footer */}
                                <p className="text-center text-white/60 text-sm mt-6">
                                        © 2024 OCRS. All rights reserved.
                                </p>
                        </div>
                </div>
        )
}

export default UserSignUp
