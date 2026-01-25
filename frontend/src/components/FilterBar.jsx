import { useState, useEffect, useRef } from 'react'
import Select from './Select'

const FilterBar = ({
        onFilterChange,
        type = 'fir', // 'fir' or 'missing'
        initialFilters = {}
}) => {
        const [filters, setFilters] = useState({
                search: '',
                category: '',
                priority: '',
                status: '',
                sortBy: 'createdAt',
                sortDir: 'desc',
                ...initialFilters
        })

        const debounceTimer = useRef(null)
        const isFirstRender = useRef(true)

        // Categories for FIR
        const categories = [
                { value: '', label: 'All Categories' },
                { value: 'THEFT', label: 'Theft' },
                { value: 'ASSAULT', label: 'Assault' },
                { value: 'FRAUD', label: 'Fraud' },
                { value: 'CYBERCRIME', label: 'Cybercrime' },
                { value: 'HARASSMENT', label: 'Harassment' },
                { value: 'VANDALISM', label: 'Vandalism' },
                { value: 'OTHER', label: 'Other' }
        ]

        const priorities = [
                { value: '', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' }
        ]

        const firStatuses = [
                { value: '', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
                { value: 'REJECTED', label: 'Rejected' }
        ]

        const missingStatuses = [
                { value: '', label: 'All Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'SEARCHING', label: 'Searching' },
                { value: 'FOUND', label: 'Found' },
                { value: 'CLOSED', label: 'Closed' }
        ]

        const sortOptions = type === 'fir' ? [
                { value: 'createdAt_desc', label: 'Date (Newest First)' },
                { value: 'createdAt_asc', label: 'Date (Oldest First)' },
                { value: 'title_asc', label: 'Title (A-Z)' },
                { value: 'title_desc', label: 'Title (Z-A)' },
                { value: 'priority_desc', label: 'Priority (High to Low)' },
                { value: 'priority_asc', label: 'Priority (Low to High)' }
        ] : [
                { value: 'createdAt_desc', label: 'Date (Newest First)' },
                { value: 'createdAt_asc', label: 'Date (Oldest First)' },
                { value: 'missingPersonName_asc', label: 'Name (A-Z)' },
                { value: 'missingPersonName_desc', label: 'Name (Z-A)' }
        ]

        // Debounced search
        useEffect(() => {
                if (isFirstRender.current) {
                        isFirstRender.current = false
                        return
                }

                if (debounceTimer.current) {
                        clearTimeout(debounceTimer.current)
                }

                debounceTimer.current = setTimeout(() => {
                        onFilterChange(filters)
                }, 300)

                return () => {
                        if (debounceTimer.current) {
                                clearTimeout(debounceTimer.current)
                        }
                }
        }, [filters.search])

        // Immediate update for non-search filters
        const handleFilterChange = (field, value) => {
                const newFilters = { ...filters, [field]: value }

                // Handle combined sort field
                if (field === 'sort') {
                        const [sortBy, sortDir] = value.split('_')
                        newFilters.sortBy = sortBy
                        newFilters.sortDir = sortDir
                        delete newFilters.sort
                }

                setFilters(newFilters)

                if (field !== 'search') {
                        onFilterChange(newFilters)
                }
        }

        const handleReset = () => {
                const resetFilters = {
                        search: '',
                        category: '',
                        priority: '',
                        status: '',
                        sortBy: 'createdAt',
                        sortDir: 'desc'
                }
                setFilters(resetFilters)
                onFilterChange(resetFilters)
        }

        const hasActiveFilters = filters.search || filters.category || filters.priority || filters.status

        return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                                {/* Search Input */}
                                <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                        <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                                <input
                                                        type="text"
                                                        placeholder={type === 'fir' ? 'Search by FIR number, title...' : 'Search by case number, name...'}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm transition-all"
                                                        value={filters.search}
                                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                                />
                                        </div>
                                </div>

                                {/* Category Filter (FIR only) */}
                                {type === 'fir' && (
                                        <div>
                                                <Select
                                                        label="Category"
                                                        value={filters.category}
                                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                                        options={categories}
                                                />
                                        </div>
                                )}

                                {/* Priority Filter (FIR only) */}
                                {type === 'fir' && (
                                        <div>
                                                <Select
                                                        label="Priority"
                                                        value={filters.priority}
                                                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                                                        options={priorities}
                                                />
                                        </div>
                                )}

                                {/* Status Filter */}
                                <div>
                                        <Select
                                                label="Status"
                                                value={filters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                options={type === 'fir' ? firStatuses : missingStatuses}
                                        />
                                </div>

                                {/* Sort Options */}
                                <div>
                                        <Select
                                                label="Sort By"
                                                value={`${filters.sortBy}_${filters.sortDir}`}
                                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                                options={sortOptions}
                                        />
                                </div>
                        </div>

                        {/* Reset Button */}
                        {hasActiveFilters && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                                onClick={handleReset}
                                                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                        >
                                                <span>×</span> Clear all filters
                                        </button>
                                </div>
                        )}
                </div>
        )
}

export default FilterBar
