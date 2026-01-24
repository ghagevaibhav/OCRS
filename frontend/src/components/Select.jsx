const Select = ({
        label,
        options = [],
        error,
        className = '',
        ...props
}) => {
        return (
                <div className="space-y-1">
                        {label && (
                                <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                </label>
                        )}
                        <div className="relative">
                                <select
                                        className={`w-full px-4 py-3 rounded-xl border appearance-none ${error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-200 focus:ring-primary-500'
                                                } focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white text-gray-700 pr-10 ${className}`}
                                        {...props}
                                >
                                        {options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                        {option.label}
                                                </option>
                                        ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                </div>
                        </div>
                        {error && (
                                <p className="text-sm text-danger-500">{error}</p>
                        )}
                </div>
        )
}

export default Select
