import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Card from '../../components/Card'
import TimePicker from '../../components/TimePicker'
import DatePicker from '../../components/DatePicker'
import Badge from '../../components/Badge'
import { useToast } from '../../components/Toast'

const FileFIR = () => {
        const [step, setStep] = useState(1)
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState('')
        const [success, setSuccess] = useState(null)
        const navigate = useNavigate()
        const toast = useToast()

        const [formData, setFormData] = useState({
                category: 'THEFT',
                title: '',
                description: '',
                incidentDate: '',
                incidentTime: '',
                incidentLocation: ''
        })

        // get today's date in YYYY-MM-DD format for max date validation
        const getTodayDate = () => {
                const today = new Date()
                return today.toISOString().split('T')[0]
        }

        const categories = [
                { value: 'THEFT', label: 'Theft', icon: '🔓', desc: 'Property theft or robbery' },
                { value: 'ASSAULT', label: 'Assault', icon: '⚠️', desc: 'Physical attack or violence' },
                { value: 'FRAUD', label: 'Fraud', icon: '💳', desc: 'Financial fraud or cheating' },
                { value: 'CYBERCRIME', label: 'Cybercrime', icon: '💻', desc: 'Online crime or hacking' },
                { value: 'HARASSMENT', label: 'Harassment', icon: '🚫', desc: 'Stalking or harassment' },
                { value: 'VANDALISM', label: 'Vandalism', icon: '🔨', desc: 'Property damage' },
                { value: 'OTHER', label: 'Other', icon: '📋', desc: 'Other offenses' },
        ]

        // Priority is automatically assigned based on category by the backend

        const handleChange = (e) => {
                setFormData({ ...formData, [e.target.name]: e.target.value })
        }

        const handleSubmit = async (e) => {
                e.preventDefault()
                setLoading(true)
                setError('')

                // validate date is not in future
                if (formData.incidentDate && new Date(formData.incidentDate) > new Date()) {
                        setError('Incident date cannot be in the future')
                        setLoading(false)
                        return
                }

                try {
                        const response = await userService.fileFIR(formData)
                        if (response.data.success) {
                                setSuccess(response.data.data)
                                setStep(4)
                        } else {
                                setError(response.data.message || 'Failed to file FIR')
                        }
                } catch (err) {
                        setError(err.response?.data?.message || 'Failed to file FIR')
                } finally {
                        setLoading(false)
                }
        }

        const nextStep = () => {
                // Step 1 validation: title is required
                if (step === 1) {
                        if (!formData.title.trim()) {
                                toast.error('Please enter an incident title')
                                return
                        }
                }
                // Step 2 validation: description, date, time, and location are required
                if (step === 2) {
                        if (!formData.description.trim()) {
                                toast.error('Please enter a description of the incident')
                                return
                        }
                        if (!formData.incidentDate) {
                                toast.error('Please select the incident date')
                                return
                        }
                        if (!formData.incidentTime) {
                                toast.error('Please select the incident time')
                                return
                        }
                        if (!formData.incidentLocation.trim()) {
                                toast.error('Please enter the incident location')
                                return
                        }
                }
                setStep(step + 1)
        }
        const prevStep = () => setStep(step - 1)

        const steps = ['Category', 'Details', 'Review', 'Complete']

        return (
                <div className="max-w-3xl mx-auto px-4 py-8">
                        {/* Header with gradient */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-6 mb-8 shadow-xl">
                                <div className="relative z-10">
                                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">File an FIR</h1>
                                        <p className="text-primary-100">Report a crime by completing this form</p>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                        </div>

                        {/* Progress Steps */}
                        <div className="relative mb-8">
                                <div className="flex items-center justify-between">
                                        {steps.map((label, index) => (
                                                <div key={label} className="flex-1 flex flex-col items-center relative z-10">
                                                        <div className={`
                                                                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                                                                transition-all duration-300 shadow-sm
                                                                ${step > index + 1
                                                                        ? 'bg-success-500 text-white shadow-success-500/30'
                                                                        : step === index + 1
                                                                                ? 'bg-primary-600 text-white shadow-primary-500/30 ring-4 ring-primary-100'
                                                                                : 'bg-gray-100 text-gray-400'
                                                                }
                                                        `}>
                                                                {step > index + 1 ? (
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                ) : (
                                                                        index + 1
                                                                )}
                                                        </div>
                                                        <span className={`
                                                                mt-2 text-xs font-medium hidden sm:block
                                                                ${step === index + 1 ? 'text-primary-600' : step > index + 1 ? 'text-success-600' : 'text-gray-400'}
                                                        `}>
                                                                {label}
                                                        </span>
                                                </div>
                                        ))}
                                </div>
                                {/* Progress line */}
                                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                                        <div
                                                className="h-full bg-gradient-to-r from-success-500 to-primary-500 transition-all duration-500"
                                                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                                        />
                                </div>
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
                                <form onSubmit={handleSubmit} noValidate>
                                        {/* Step 1: Category */}
                                        {step === 1 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <div>
                                                                <h2 className="text-xl font-semibold text-gray-900 mb-1">Select Crime Category</h2>
                                                                <p className="text-gray-500 text-sm">Choose the category that best describes the incident</p>
                                                        </div>

                                                        {/* Category Grid */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                                {categories.map((cat) => (
                                                                        <button
                                                                                key={cat.value}
                                                                                type="button"
                                                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                                                className={`
                                                                                        p-4 rounded-xl border-2 text-left transition-all
                                                                                        ${formData.category === cat.value
                                                                                                ? 'border-primary-500 bg-primary-50 shadow-sm'
                                                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                                        }
                                                                                `}
                                                                        >
                                                                                <span className="text-2xl mb-2 block">{cat.icon}</span>
                                                                                <span className="font-medium text-gray-900 block">{cat.label}</span>
                                                                                <span className="text-xs text-gray-500">{cat.desc}</span>
                                                                        </button>
                                                                ))}
                                                        </div>

                                                        <Input
                                                                label="Incident Title"
                                                                name="title"
                                                                value={formData.title}
                                                                onChange={handleChange}
                                                                placeholder="Brief title of the incident"
                                                                helperText="A short, descriptive title helps authorities understand the case quickly"
                                                                required
                                                                icon={
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                        </svg>
                                                                }
                                                        />

                                                        {/* Priority auto-assignment info */}
                                                        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex gap-3">
                                                                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <div className="text-sm text-primary-800">
                                                                        <p className="font-medium">Priority is automatically assigned</p>
                                                                        <p className="text-primary-700 mt-0.5">Based on the crime category, the system will determine the appropriate priority level.</p>
                                                                </div>
                                                        </div>

                                                        <Button type="button" onClick={nextStep} fullWidth size="lg">
                                                                Continue
                                                                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                </svg>
                                                        </Button>
                                                </div>
                                        )}

                                        {/* Step 2: Details */}
                                        {step === 2 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <div>
                                                                <h2 className="text-xl font-semibold text-gray-900 mb-1">Incident Details</h2>
                                                                <p className="text-gray-500 text-sm">Provide as much detail as possible about the incident</p>
                                                        </div>

                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                        Description <span className="text-danger-500">*</span>
                                                                </label>
                                                                <textarea
                                                                        name="description"
                                                                        value={formData.description}
                                                                        onChange={handleChange}
                                                                        rows={6}
                                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                                                        placeholder="Describe the incident in detail. Include what happened, who was involved, any witnesses, and other relevant information..."
                                                                />
                                                                <p className="mt-1.5 text-xs text-gray-500">Be specific - include names, descriptions, and any identifying information</p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <DatePicker
                                                                        label="Incident Date"
                                                                        name="incidentDate"
                                                                        value={formData.incidentDate}
                                                                        onChange={handleChange}
                                                                        max={getTodayDate()}
                                                                        required
                                                                />
                                                                <TimePicker
                                                                        label="Incident Time"
                                                                        name="incidentTime"
                                                                        value={formData.incidentTime}
                                                                        onChange={handleChange}
                                                                        required
                                                                />
                                                        </div>

                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                        Location <span className="text-danger-500">*</span>
                                                                </label>
                                                                <textarea
                                                                        name="incidentLocation"
                                                                        value={formData.incidentLocation}
                                                                        onChange={handleChange}
                                                                        rows={3}
                                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                                                                        placeholder="Enter the complete address where the incident occurred..."
                                                                />
                                                        </div>

                                                        <div className="flex gap-4">
                                                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1" size="lg">
                                                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                                                        </svg>
                                                                        Back
                                                                </Button>
                                                                <Button type="button" onClick={nextStep} className="flex-1" size="lg">
                                                                        Continue
                                                                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                        </svg>
                                                                </Button>
                                                        </div>
                                                </div>
                                        )}

                                        {/* Step 3: Review & Submit */}
                                        {step === 3 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <div>
                                                                <h2 className="text-xl font-semibold text-gray-900 mb-1">Review Your FIR</h2>
                                                                <p className="text-gray-500 text-sm">Please review the information before submitting</p>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                                                                <div className="flex items-start gap-4">
                                                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
                                                                                {categories.find(c => c.value === formData.category)?.icon}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                                <p className="text-sm text-gray-500">Category & Title</p>
                                                                                <p className="font-medium text-gray-900">{formData.title}</p>
                                                                                <div className="flex gap-2 mt-1">
                                                                                        <Badge variant="primary">{formData.category}</Badge>
                                                                                        <Badge variant="info">Priority: Auto-assigned</Badge>
                                                                                </div>
                                                                        </div>
                                                                </div>

                                                                <hr className="border-gray-200" />

                                                                <div>
                                                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                                                        <p className="text-gray-700 text-sm bg-white p-3 rounded-lg border border-gray-100">
                                                                                {formData.description}
                                                                        </p>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                                <p className="text-sm text-gray-500">Incident Date</p>
                                                                                <p className="font-medium text-gray-900">
                                                                                        {formData.incidentDate ? new Date(formData.incidentDate).toLocaleDateString('en-US', {
                                                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                                                                        }) : 'Not specified'}
                                                                                </p>
                                                                        </div>
                                                                        <div>
                                                                                <p className="text-sm text-gray-500">Incident Time</p>
                                                                                <p className="font-medium text-gray-900">{formData.incidentTime || 'Not specified'}</p>
                                                                        </div>
                                                                </div>

                                                                <div>
                                                                        <p className="text-sm text-gray-500">Location</p>
                                                                        <p className="font-medium text-gray-900">{formData.incidentLocation}</p>
                                                                </div>
                                                        </div>

                                                        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex gap-3">
                                                                <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                <div className="text-sm text-warning-800">
                                                                        <p className="font-medium">Filing a false FIR is a punishable offense</p>
                                                                        <p className="text-warning-700 mt-0.5">Please ensure all information provided is accurate and truthful.</p>
                                                                </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                                <Button type="button" variant="outline" onClick={prevStep} className="flex-1" size="lg">
                                                                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                                                        </svg>
                                                                        Back
                                                                </Button>
                                                                <Button type="submit" loading={loading} className="flex-1" size="lg">
                                                                        {loading ? 'Submitting...' : 'Submit FIR'}
                                                                </Button>
                                                        </div>
                                                </div>
                                        )}

                                        {/* Step 4: Success */}
                                        {step === 4 && success && (
                                                <div className="text-center py-8 animate-fadeIn">
                                                        <div className="relative inline-block mb-6">
                                                                <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-lg shadow-success-500/30">
                                                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                </div>
                                                                {/* Decorative rings */}
                                                                <div className="absolute inset-0 -m-2 rounded-full border-4 border-success-200 animate-ping opacity-20" />
                                                        </div>

                                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">FIR Filed Successfully!</h2>
                                                        <p className="text-gray-500 mb-6">Your complaint has been registered and assigned to an investigating officer.</p>

                                                        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-6 border border-primary-100">
                                                                <p className="text-sm text-gray-600 mb-1">Your FIR Number</p>
                                                                <p className="text-3xl font-bold text-primary-600 tracking-wide">{success.firNumber}</p>
                                                                <p className="text-xs text-gray-500 mt-2">Save this number for future reference</p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                                <Button type="button" variant="outline" onClick={() => navigate('/track-status')} className="flex-1">
                                                                        Track Status
                                                                </Button>
                                                                <Button type="button" onClick={() => navigate('/dashboard')} className="flex-1">
                                                                        Back to Dashboard
                                                                </Button>
                                                        </div>
                                                </div>
                                        )}
                                </form>
                        </Card>
                </div>
        )
}

export default FileFIR

