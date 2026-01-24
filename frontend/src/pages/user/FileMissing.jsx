import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Card from '../../components/Card'

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
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
        ]

        // get today's date in YYYY-MM-DD format for max date validation
        const getTodayDate = () => {
                const today = new Date()
                return today.toISOString().split('T')[0]
        }

        const handleChange = (e) => {
                setFormData({ ...formData, [e.target.name]: e.target.value })
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

        if (success) {
                return (
                        <div className="max-w-3xl mx-auto px-4 py-8">
                                <Card className="text-center py-8">
                                        <div className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-4xl text-white">✓</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Filed Successfully!</h2>
                                        <p className="text-gray-500 mb-4">Your missing person report has been registered.</p>
                                        <div className="bg-primary-50 rounded-xl p-4 mb-6">
                                                <p className="text-sm text-gray-600">Case Number</p>
                                                <p className="text-2xl font-bold text-primary-600">{success.caseNumber}</p>
                                        </div>
                                        <Button onClick={() => navigate('/dashboard')} className="w-full">Back to Dashboard</Button>
                                </Card>
                        </div>
                )
        }

        return (
                <div className="max-w-3xl mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Missing Person</h1>
                        <p className="text-gray-500 mb-8">Provide details about the missing person</p>

                        {error && (
                                <div className="mb-4 p-4 bg-danger-50 text-danger-600 rounded-xl">{error}</div>
                        )}

                        <Card>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                        label="Missing Person's Name *"
                                                        name="missingPersonName"
                                                        value={formData.missingPersonName}
                                                        onChange={handleChange}
                                                        placeholder="Full name"
                                                        required
                                                />
                                                <Input
                                                        label="Age"
                                                        type="number"
                                                        name="age"
                                                        value={formData.age}
                                                        onChange={handleChange}
                                                        placeholder="Age in years"
                                                />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Select
                                                        label="Gender"
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={handleChange}
                                                        options={genders}
                                                />
                                                <Input
                                                        label="Height"
                                                        name="height"
                                                        value={formData.height}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 5'6"
                                                />
                                                <Input
                                                        label="Weight"
                                                        name="weight"
                                                        value={formData.weight}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 60 kg"
                                                />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                        label="Complexion"
                                                        name="complexion"
                                                        value={formData.complexion}
                                                        onChange={handleChange}
                                                        placeholder="e.g., Fair, Dark, Wheatish"
                                                />
                                                <Input
                                                        label="Contact Phone"
                                                        name="contactPhone"
                                                        value={formData.contactPhone}
                                                        onChange={handleChange}
                                                        placeholder="Your contact number"
                                                />
                                        </div>

                                        <Input
                                                label="Identifying Marks"
                                                name="identifyingMarks"
                                                value={formData.identifyingMarks}
                                                onChange={handleChange}
                                                placeholder="Scars, tattoos, birthmarks, etc."
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                        label="Last Seen Date *"
                                                        type="date"
                                                        name="lastSeenDate"
                                                        value={formData.lastSeenDate}
                                                        onChange={handleChange}
                                                        max={getTodayDate()}
                                                        required
                                                />
                                        </div>

                                        <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Seen Location *</label>
                                                <textarea
                                                        name="lastSeenLocation"
                                                        value={formData.lastSeenLocation}
                                                        onChange={handleChange}
                                                        rows={3}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="Complete address where person was last seen..."
                                                        required
                                                />
                                        </div>

                                        <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Description</label>
                                                <textarea
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        rows={4}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="Any additional information that might help..."
                                                />
                                        </div>

                                        <Button type="submit" loading={loading} className="w-full" size="lg">
                                                Submit Report
                                        </Button>
                                </form>
                        </Card>
                </div>
        )
}

export default FileMissing
