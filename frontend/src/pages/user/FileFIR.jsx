import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Card from '../../components/Card'
import TimePicker from '../../components/TimePicker'
import DatePicker from '../../components/DatePicker'

const FileFIR = () => {
        const [step, setStep] = useState(1)
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState('')
        const [success, setSuccess] = useState(null)
        const navigate = useNavigate()

        const [formData, setFormData] = useState({
                category: 'THEFT',
                title: '',
                description: '',
                incidentDate: '',
                incidentTime: '',
                incidentLocation: '',
                priority: 'MEDIUM'
        })

        // get today's date in YYYY-MM-DD format for max date validation
        const getTodayDate = () => {
                const today = new Date()
                return today.toISOString().split('T')[0]
        }

        const categories = [
                { value: 'THEFT', label: 'Theft' },
                { value: 'ASSAULT', label: 'Assault' },
                { value: 'FRAUD', label: 'Fraud' },
                { value: 'CYBERCRIME', label: 'Cybercrime' },
                { value: 'HARASSMENT', label: 'Harassment' },
                { value: 'VANDALISM', label: 'Vandalism' },
                { value: 'OTHER', label: 'Other' },
        ]

        const priorities = [
                { value: 'LOW', label: 'Low Priority' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'HIGH', label: 'High Priority' },
                { value: 'URGENT', label: 'Urgent' },
        ]

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

        const nextStep = () => setStep(step + 1)
        const prevStep = () => setStep(step - 1)

        return (
                <div className="max-w-3xl mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">File FIR</h1>
                        <p className="text-gray-500 mb-8">Report a crime by filling out this form</p>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-8">
                                {['Category', 'Details', 'Location', 'Complete'].map((label, index) => (
                                        <div key={label} className="flex items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step > index + 1 ? 'bg-success-500 text-white' :
                                                        step === index + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                        {step > index + 1 ? '✓' : index + 1}
                                                </div>
                                                <span className={`ml-2 text-sm ${step === index + 1 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                                                        {label}
                                                </span>
                                                {index < 3 && <div className="w-12 md:w-24 h-1 bg-gray-200 mx-2" />}
                                        </div>
                                ))}
                        </div>

                        {error && (
                                <div className="mb-4 p-4 bg-danger-50 text-danger-600 rounded-xl">{error}</div>
                        )}

                        <Card>
                                <form onSubmit={handleSubmit}>
                                        {/* Step 1: Category */}
                                        {step === 1 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <h2 className="text-xl font-semibold">Select Crime Category</h2>
                                                        <Select
                                                                label="Category *"
                                                                name="category"
                                                                value={formData.category}
                                                                onChange={handleChange}
                                                                options={categories}
                                                        />
                                                        <Input
                                                                label="Title *"
                                                                name="title"
                                                                value={formData.title}
                                                                onChange={handleChange}
                                                                placeholder="Brief title of the incident"
                                                                required
                                                        />
                                                        <Select
                                                                label="Priority"
                                                                name="priority"
                                                                value={formData.priority}
                                                                onChange={handleChange}
                                                                options={priorities}
                                                        />
                                                        <Button onClick={nextStep} className="w-full">Next Step</Button>
                                                </div>
                                        )}

                                        {/* Step 2: Details */}
                                        {step === 2 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <h2 className="text-xl font-semibold">Incident Details</h2>
                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                                                <textarea
                                                                        name="description"
                                                                        value={formData.description}
                                                                        onChange={handleChange}
                                                                        rows={6}
                                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                        placeholder="Describe the incident in detail..."
                                                                        required
                                                                />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                                <DatePicker
                                                                        label="Incident Date *"
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
                                                                />
                                                        </div>
                                                        <div className="flex gap-4">
                                                                <Button variant="secondary" onClick={prevStep} className="flex-1">Previous</Button>
                                                                <Button onClick={nextStep} className="flex-1">Next Step</Button>
                                                        </div>
                                                </div>
                                        )}

                                        {/* Step 3: Location & Submit */}
                                        {step === 3 && (
                                                <div className="space-y-6 animate-fadeIn">
                                                        <h2 className="text-xl font-semibold">Incident Location</h2>
                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                                                <textarea
                                                                        name="incidentLocation"
                                                                        value={formData.incidentLocation}
                                                                        onChange={handleChange}
                                                                        rows={4}
                                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                        placeholder="Enter the complete address where the incident occurred..."
                                                                        required
                                                                />
                                                        </div>

                                                        <div className="bg-gray-50 rounded-xl p-4">
                                                                <h3 className="font-medium mb-2">Review Your FIR</h3>
                                                                <div className="text-sm text-gray-600 space-y-1">
                                                                        <p><strong>Category:</strong> {formData.category}</p>
                                                                        <p><strong>Title:</strong> {formData.title}</p>
                                                                        <p><strong>Date:</strong> {formData.incidentDate}</p>
                                                                        <p><strong>Priority:</strong> {formData.priority}</p>
                                                                </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                                <Button variant="secondary" onClick={prevStep} className="flex-1">Previous</Button>
                                                                <Button type="submit" loading={loading} className="flex-1">Submit FIR</Button>
                                                        </div>
                                                </div>
                                        )}

                                        {/* Step 4: Success */}
                                        {step === 4 && success && (
                                                <div className="text-center py-8 animate-fadeIn">
                                                        <div className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <span className="text-4xl text-white">✓</span>
                                                        </div>
                                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">FIR Filed Successfully!</h2>
                                                        <p className="text-gray-500 mb-4">Your FIR has been registered and assigned to an authority.</p>
                                                        <div className="bg-primary-50 rounded-xl p-4 mb-6">
                                                                <p className="text-sm text-gray-600">FIR Number</p>
                                                                <p className="text-2xl font-bold text-primary-600">{success.firNumber}</p>
                                                        </div>
                                                        <Button onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
                                                </div>
                                        )}
                                </form>
                        </Card>
                </div>
        )
}

export default FileFIR
