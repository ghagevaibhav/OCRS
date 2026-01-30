import { useState, useRef, useEffect } from 'react'

const DatePicker = ({ label, value, onChange, name, max, min, required, className = '' }) => {
        const [isOpen, setIsOpen] = useState(false)
        const containerRef = useRef(null)

        // Parse current value (YYYY-MM-DD format)
        const currentDate = value ? new Date(value) : null
        const today = new Date()
        const maxDate = max ? new Date(max) : today

        // State for calendar view
        const [viewDate, setViewDate] = useState(currentDate || today)

        const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
        ]

        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

        // Get days in month
        const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
        const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

        // Generate years (last 100 years)
        const currentYear = today.getFullYear()
        const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

        const handleDateSelect = (day) => {
                const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                if (selectedDate <= maxDate) {
                        // Format as YYYY-MM-DD using local time
                        const year = selectedDate.getFullYear()
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                        const dayStr = String(selectedDate.getDate()).padStart(2, '0')
                        const formatted = `${year}-${month}-${dayStr}`

                        onChange({ target: { name, value: formatted } })
                        setIsOpen(false)
                }
        }

        const changeMonth = (delta) => {
                const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1)
                if (newDate <= maxDate) {
                        setViewDate(newDate)
                }
        }

        const handleYearChange = (e) => {
                const year = parseInt(e.target.value)
                setViewDate(new Date(year, viewDate.getMonth(), 1))
        }

        const handleMonthChange = (e) => {
                const month = parseInt(e.target.value)
                setViewDate(new Date(viewDate.getFullYear(), month, 1))
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

        const formatDisplayDate = () => {
                if (!value) return 'Select date'
                const date = new Date(value)
                return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        }

        // Generate calendar grid
        const renderCalendar = () => {
                const year = viewDate.getFullYear()
                const month = viewDate.getMonth()
                const daysInMonth = getDaysInMonth(year, month)
                const firstDay = getFirstDayOfMonth(year, month)

                const days = []
                // Empty cells for days before first day of month
                for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} className="w-8 h-8" />)
                }
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month, day)
                        const isSelected = currentDate &&
                                date.getDate() === currentDate.getDate() &&
                                date.getMonth() === currentDate.getMonth() &&
                                date.getFullYear() === currentDate.getFullYear()
                        const isToday = date.toDateString() === today.toDateString()
                        const isDisabled = date > maxDate

                        days.push(
                                <button
                                        key={day}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleDateSelect(day)}
                                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all
                                                ${isSelected ? 'bg-primary-600 text-white' : ''}
                                                ${isToday && !isSelected ? 'border-2 border-primary-400 text-primary-600' : ''}
                                                ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                                                ${!isSelected && !isToday && !isDisabled ? 'text-gray-700' : ''}
                                        `}
                                >
                                        {day}
                                </button>
                        )
                }
                return days
        }

        return (
                <div className="space-y-1" ref={containerRef}>
                        {label && (
                                <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                        {required && <span className="text-danger-500 ml-1">*</span>}
                                </label>
                        )}
                        <div className="relative">
                                <button
                                        type="button"
                                        onClick={() => setIsOpen(!isOpen)}
                                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-left flex items-center justify-between ${className}`}
                                >
                                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                                                {formatDisplayDate()}
                                        </span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                </button>

                                {isOpen && (
                                        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 animate-fadeIn w-72">
                                                {/* Month/Year selectors */}
                                                <div className="flex items-center justify-between mb-4">
                                                        <button
                                                                type="button"
                                                                onClick={() => changeMonth(-1)}
                                                                className="p-1 hover:bg-gray-100 rounded-lg transition-all"
                                                        >
                                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                                </svg>
                                                        </button>

                                                        <div className="flex gap-2">
                                                                <select
                                                                        value={viewDate.getMonth()}
                                                                        onChange={handleMonthChange}
                                                                        className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                                                                >
                                                                        {months.map((m, i) => (
                                                                                <option key={m} value={i}>{m}</option>
                                                                        ))}
                                                                </select>
                                                                <select
                                                                        value={viewDate.getFullYear()}
                                                                        onChange={handleYearChange}
                                                                        className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                                                                >
                                                                        {years.map(y => (
                                                                                <option key={y} value={y}>{y}</option>
                                                                        ))}
                                                                </select>
                                                        </div>

                                                        <button
                                                                type="button"
                                                                onClick={() => changeMonth(1)}
                                                                className="p-1 hover:bg-gray-100 rounded-lg transition-all"
                                                        >
                                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                                </svg>
                                                        </button>
                                                </div>

                                                {/* Weekday headers */}
                                                <div className="grid grid-cols-7 gap-1 mb-2">
                                                        {weekDays.map(day => (
                                                                <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                                                                        {day}
                                                                </div>
                                                        ))}
                                                </div>

                                                {/* Calendar grid */}
                                                <div className="grid grid-cols-7 gap-1">
                                                        {renderCalendar()}
                                                </div>

                                                {/* Quick actions */}
                                                <div className="flex gap-2 mt-4 pt-3 border-t">
                                                        <button
                                                                type="button"
                                                                onClick={() => {
                                                                        const formatted = today.toISOString().split('T')[0]
                                                                        onChange({ target: { name, value: formatted } })
                                                                        setIsOpen(false)
                                                                }}
                                                                className="flex-1 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                        >
                                                                Today
                                                        </button>
                                                        <button
                                                                type="button"
                                                                onClick={() => {
                                                                        onChange({ target: { name, value: '' } })
                                                                        setIsOpen(false)
                                                                }}
                                                                className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                        >
                                                                Clear
                                                        </button>
                                                </div>
                                        </div>
                                )}
                        </div>
                </div>
        )
}

export default DatePicker
