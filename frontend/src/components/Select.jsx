const Select = ({
        label,
        options = [],
        error,
        helperText,
        className = '',
        size = 'md',
        placeholder,
        ...props
}) => {
        const sizes = {
                sm: 'px-3 py-2 text-sm',
                md: 'px-4 py-3 text-base',
                lg: 'px-5 py-4 text-lg',
        }

        return (
                <div className="space-y-1.5">
                        {label && (
                                <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                </label>
                        )}
                        <div className="relative group">
                                <select
                                        className={`w-full ${sizes[size]} rounded-xl border appearance-none ${error
                                                        ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
                                                        : 'border-gray-200 focus:ring-primary-500/20 focus:border-primary-500'
                                                } focus:outline-none focus:ring-4 transition-all bg-white text-gray-700 pr-10 cursor-pointer ${className}`}
                                        {...props}
                                >
                                        {placeholder && (
                                                <option value="" disabled>
                                                        {placeholder}
                                                </option>
                                        )}
                                        {options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                        {option.label}
                                                </option>
                                        ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                        <svg className="w-5 h-5 transition-transform group-focus-within:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                </div>
                        </div>
                        {error && (
                                <p className="text-sm text-danger-500 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                </p>
                        )}
                        {helperText && !error && (
                                <p className="text-sm text-gray-500">{helperText}</p>
                        )}
                </div>
        )
}

export default Select

