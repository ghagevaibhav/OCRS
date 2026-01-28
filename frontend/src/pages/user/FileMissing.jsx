import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Card from '../../components/Card'
import DatePicker from '../../components/DatePicker'

const FileMissing = () => {
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState('')
        const [success, setSuccess] = useState(null)
        const navigate = useNavigate()

        const [formData, setFormData] = useState({
                missingPersonName: '',
                age: '',
                gender: 'MALE',
                height: '',
                weight: '',
                complexion: '',
                identifyingMarks: '',
                lastSeenDate: '',
                lastSeenLocation: '',
                description: '',
                contactPhone: ''
        })

        const genders = [
                { value: 'MALE', label: 'Male', icon: '👨' },
                { value: 'FEMALE', label: 'Female', icon: '👩' },
                { value: 'OTHER', label: 'Other', icon: '🧑' },
        ]

        // get today's date in YYYY-MM-DD format for max date validation
        const getTodayDate = () => {
                const today = new Date()
                return today.toISOString().split('T')[0]
        }

        const handleChange = (e) => {
                setFormData({ ...formData, [e.target.name]: e.target.value })
        }

        // Special handler for phone number - only allow digits and limit to 10
        const handlePhoneChange = (e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                setFormData({ ...formData, contactPhone: value })
        }

        const handleSubmit = async (e) => {
                e.preventDefault()
                setLoading(true)
                setError('')

                // validate date is not in future
                if (formData.lastSeenDate && new Date(formData.lastSeenDate) > new Date()) {
                        setError('Last seen date cannot be in the future')
                        setLoading(false)
                        return
                }

                // validate phone number if provided
                if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone)) {
                        setError('Contact phone must be 10 digits')
                        setLoading(false)
                        return
                }

                try {
                        const data = { ...formData, age: formData.age ? parseInt(formData.age) : null }
                        const response = await userService.fileMissing(data)
                        if (response.data.success) {
                                setSuccess(response.data.data)
                        } else {
                                setError(response.data.message || 'Failed to file report')
                        }
                } catch (err) {
                        setError(err.response?.data?.message || 'Failed to file report')
                } finally {
                        setLoading(false)
                }
        }

        // Section Header Component
        const SectionHeader = ({ icon, title, subtitle }) => (
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                                {icon}
                        </div>
                        <div>
                                <h3 className="font-semibold text-gray-900">{title}</h3>
                                <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                </div>
        )

        if (success) {
                return (
                        <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
                                <Card variant="elevated" size="lg" className="text-center py-10">
                                        <div className="relative inline-block mb-6">
                                                <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-lg shadow-success-500/30">
                                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                </div>
                                                {/* Decorative rings */}
                                                <div className="absolute inset-0 -m-2 rounded-full border-4 border-success-200 animate-ping opacity-20" />
                                        </div>

                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Filed Successfully!</h2>
                                        <p className="text-gray-500 mb-6">Your missing person report has been registered and will be reviewed by authorities.</p>

                                        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-6 border border-primary-100 max-w-sm mx-auto">
                                                <p className="text-sm text-gray-600 mb-1">Your Case Number</p>
                                                <p className="text-3xl font-bold text-primary-600 tracking-wide">{success.caseNumber}</p>
                                                <p className="text-xs text-gray-500 mt-2">Save this number for tracking and updates</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                                <Button variant="outline" onClick={() => navigate('/track-status')} className="flex-1">
                                                        Track Status
                                                </Button>
                                                <Button onClick={() => navigate('/dashboard')} className="flex-1">
                                                        Back to Dashboard
                                                </Button>
                                        </div>
                                </Card>
                        </div>
                )
        }

        return (
                <div className="max-w-3xl mx-auto px-4 py-8">
                        {/* Header with gradient */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-500 via-warning-600 to-danger-500 p-6 mb-8 shadow-xl">
                                <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl md:text-3xl font-bold text-white">Report Missing Person</h1>
                                        </div>
                                        <p className="text-white/80">Provide detailed information to help locate the missing person</p>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-16 w-32 h-32 bg-white/5 rounded-full" />
                        </div>

                        {error && (
                                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                </div>
                        )}

                        <Card variant="elevated" size="lg">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                        {/* Section 1: Basic Information */}
                                        <div className="space-y-4">
                                                <SectionHeader
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                        }
                                                        title="Personal Information"
                                                        subtitle="Basic details of the missing person"
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input
                                                                label="Full Name"
                                                                name="missingPersonName"
                                                                value={formData.missingPersonName}
                                                                onChange={handleChange}
                                                                placeholder="Enter full name"
                                                                required
                                                                icon={
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                }
                                                        />
                                                        <Input
                                                                label="Age"
                                                                type="number"
                                                                name="age"
                                                                value={formData.age}
                                                                onChange={handleChange}
                                                                placeholder="Age in years"
                                                                min="0"
                                                                max="150"
                                                                required
                                                        />
                                                </div>

                                                {/* Gender Selection */}
                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-danger-500">*</span></label>
                                                        <div className="flex gap-3">
                                                                {genders.map((g) => (
                                                                        <button
                                                                                key={g.value}
                                                                                type="button"
                                                                                onClick={() => setFormData({ ...formData, gender: g.value })}
                                                                                className={`
                                                                                        flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all
                                                                                        ${formData.gender === g.value
                                                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                                                        }
                                                                                `}
                                                                        >
                                                                                <span className="text-xl">{g.icon}</span>
                                                                                <span className="font-medium">{g.label}</span>
                                                                        </button>
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Section 2: Physical Description */}
                                        <div className="space-y-4">
                                                <SectionHeader
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                        }
                                                        title="Physical Description"
                                                        subtitle="Describe physical attributes to help identify the person"
                                                />

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <Input
                                                                label="Height"
                                                                name="height"
                                                                value={formData.height}
                                                                onChange={handleChange}
                                                                placeholder="e.g., 5'6 or 168 cm"
                                                                required
                                                        />
                                                        <Input
                                                                label="Weight"
                                                                name="weight"
                                                                value={formData.weight}
                                                                onChange={handleChange}
                                                                placeholder="e.g., 60 kg"
                                                                required
                                                        />
                                                        <Input
                                                                label="Complexion"
                                                                name="complexion"
                                                                value={formData.complexion}
                                                                onChange={handleChange}
                                                                placeholder="e.g., Fair, Dark"
                                                                required
                                                        />
                                                </div>

                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                Identifying Marks
                                                        </label>
                                                        <textarea
                                                                name="identifyingMarks"
                                                                value={formData.identifyingMarks}
                                                                onChange={handleChange}
                                                                rows={2}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                                                placeholder="Scars, tattoos, birthmarks, moles, or any distinctive features..."
                                                        />
                                                </div>
                                        </div>

                                        {/* Section 3: Last Seen Information */}
                                        <div className="space-y-4">
                                                <SectionHeader
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                        }
                                                        title="Last Seen Information"
                                                        subtitle="When and where the person was last seen"
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <DatePicker
                                                                label="Last Seen Date"
                                                                name="lastSeenDate"
                                                                value={formData.lastSeenDate}
                                                                onChange={handleChange}
                                                                max={getTodayDate()}
                                                                required
                                                        />
                                                        <Input
                                                                label="Contact Phone"
                                                                name="contactPhone"
                                                                value={formData.contactPhone}
                                                                onChange={handlePhoneChange}
                                                                placeholder="10-digit phone number"
                                                                helperText="Your number for authorities to contact"
                                                                maxLength={10}
                                                                showCount
                                                                required
                                                                icon={
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                        </svg>
                                                                }
                                                        />
                                                </div>

                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                Last Seen Location <span className="text-danger-500">*</span>
                                                        </label>
                                                        <textarea
                                                                name="lastSeenLocation"
                                                                value={formData.lastSeenLocation}
                                                                onChange={handleChange}
                                                                rows={3}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                                                placeholder="Complete address or area where the person was last seen. Include landmarks, nearby places, etc."
                                                                required
                                                        />
                                                </div>
                                        </div>

                                        {/* Section 4: Additional Information */}
                                        <div className="space-y-4">
                                                <SectionHeader
                                                        icon={
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                        }
                                                        title="Additional Details"
                                                        subtitle="Any other information that might help"
                                                />

                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                Additional Description
                                                        </label>
                                                        <textarea
                                                                name="description"
                                                                value={formData.description}
                                                                onChange={handleChange}
                                                                rows={4}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                                                placeholder="Clothing worn when last seen, behavioral patterns, medical conditions, places they might visit, or any other relevant information..."
                                                        />
                                                </div>
                                        </div>

                                        {/* Important Notice */}
                                        <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex gap-3">
                                                <svg className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-sm text-info-800">
                                                        <p className="font-medium">Please provide accurate information</p>
                                                        <p className="text-info-700 mt-0.5">Accurate details help authorities locate the missing person faster. You will receive updates on your registered email and phone.</p>
                                                </div>
                                        </div>

                                        <Button type="submit" loading={loading} fullWidth size="lg">
                                                {loading ? 'Submitting Report...' : 'Submit Missing Person Report'}
                                        </Button>
                                </form>
                        </Card>
                </div>
        )
}

export default FileMissing
