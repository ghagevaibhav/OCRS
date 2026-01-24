import { useState, useRef, useEffect } from 'react'

const TimePicker = ({ label, value, onChange, name, className = '' }) => {
        const [isOpen, setIsOpen] = useState(false)
        const containerRef = useRef(null)

        // Parse current value (HH:MM format)
        const [hours, minutes] = value ? value.split(':') : ['', '']

        // Generate hour options (00-23) and minute options (00-59 in 5 min intervals)
        const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
        const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

        const handleTimeChange = (type, val) => {
                const newHours = type === 'hours' ? val : (hours || '12')
                const newMinutes = type === 'minutes' ? val : (minutes || '00')
                const newValue = `${newHours}:${newMinutes}`
                onChange({ target: { name, value: newValue } })
        }

        // Close dropdown when clicking outside
        useEffect(() => {
                const handleClickOutside = (e) => {
                        if (containerRef.current && !containerRef.current.contains(e.target)) {
                                setIsOpen(false)
                        }
                }
                document.addEventListener('mousedown', handleClickOutside)
                return () => document.removeEventListener('mousedown', handleClickOutside)
        }, [])

        const formatDisplayTime = () => {
                if (!value) return 'Select time'
                const [h, m] = value.split(':')
                const hour = parseInt(h)
                const period = hour >= 12 ? 'PM' : 'AM'
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                return `${displayHour}:${m} ${period}`
        }

        return (
                <div className="space-y-1" ref={containerRef}>
                        {label && (
                                <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                </label>
                        )}
                        <div className="relative">
                                <button
                                        type="button"
                                        onClick={() => setIsOpen(!isOpen)}
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-left flex items-center justify-between ${className}`}
                                >
                                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                                                {formatDisplayTime()}
                                        </span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                </button>

                                {isOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 p-4 animate-fadeIn">
                                                <div className="flex gap-4">
                                                        {/* Hours Column */}
                                                        <div className="flex-1">
                                                                <p className="text-xs font-medium text-gray-500 mb-2 text-center">Hour</p>
                                                                <div className="h-48 overflow-y-auto scrollbar-thin">
                                                                        {hourOptions.map((h) => (
                                                                                <button
                                                                                        key={h}
                                                                                        type="button"
                                                                                        onClick={() => handleTimeChange('hours', h)}
                                                                                        className={`w-full py-2 text-center rounded-lg transition-all ${hours === h
                                                                                                ? 'bg-primary-600 text-white font-semibold'
                                                                                                : 'hover:bg-gray-100 text-gray-700'
                                                                                                }`}
                                                                                >
                                                                                        {h}
                                                                                </button>
                                                                        ))}
                                                                </div>
                                                        </div>

                                                        {/* Separator */}
                                                        <div className="flex items-center text-2xl font-bold text-gray-300">:</div>

                                                        {/* Minutes Column */}
                                                        <div className="flex-1">
                                                                <p className="text-xs font-medium text-gray-500 mb-2 text-center">Minute</p>
                                                                <div className="h-48 overflow-y-auto scrollbar-thin">
                                                                        {minuteOptions.map((m) => (
                                                                                <button
                                                                                        key={m}
                                                                                        type="button"
                                                                                        onClick={() => handleTimeChange('minutes', m)}
                                                                                        className={`w-full py-2 text-center rounded-lg transition-all ${minutes === m
                                                                                                ? 'bg-primary-600 text-white font-semibold'
                                                                                                : 'hover:bg-gray-100 text-gray-700'
                                                                                                }`}
                                                                                >
                                                                                        {m}
                                                                                </button>
                                                                        ))}
                                                                </div>
                                                        </div>
                                                </div>

                                                <button
                                                        type="button"
                                                        onClick={() => setIsOpen(false)}
                                                        className="w-full mt-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all"
                                                >
                                                        Done
                                                </button>
                                        </div>
                                )}
                        </div>
                </div>
        )
}

export default TimePicker
