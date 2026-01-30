const Input = ({
        label,
        error,
        helperText,
        className = '',
        size = 'md',
        icon = null,
        iconPosition = 'left',
        maxLength,
        showCount = false,
        value,
        required,
        ...props
}) => {
        const sizes = {
                sm: 'px-3 py-2 text-sm',
                md: 'px-4 py-3 text-base',
                lg: 'px-5 py-4 text-lg',
        }

        const iconPadding = icon ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : ''
        const currentLength = typeof value === 'string' ? value.length : 0

        return (
                <div className="space-y-1.5">
                        {label && (
                                <label className="block text-sm font-medium text-gray-700">
                                        {label}
                                        {required && <span className="text-danger-500 ml-1">*</span>}
                                </label>
                        )}
                        <div className="relative">
                                {icon && iconPosition === 'left' && (
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                {icon}
                                        </span>
                                )}
                                <input
                                        className={`w-full ${sizes[size]} ${iconPadding} rounded-xl border ${error
                                                ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
                                                : 'border-gray-200 focus:ring-primary-500/20 focus:border-primary-500'
                                                } focus:outline-none focus:ring-4 transition-all bg-white placeholder:text-gray-400 ${className}`}
                                        value={value}
                                        maxLength={maxLength}
                                        {...props}
                                />
                                {icon && iconPosition === 'right' && (
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                {icon}
                                        </span>
                                )}
                        </div>
                        <div className="flex justify-between items-start">
                                <div className="flex-1">
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
                                {showCount && maxLength && (
                                        <span className={`text-xs ${currentLength >= maxLength ? 'text-danger-500' : 'text-gray-400'}`}>
                                                {currentLength}/{maxLength}
                                        </span>
                                )}
                        </div>
                </div>
        )
}

export default Input

