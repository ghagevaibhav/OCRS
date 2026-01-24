const Button = ({
        children,
        variant = 'primary',
        size = 'md',
        className = '',
        disabled = false,
        loading = false,
        ...props
}) => {
        const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

        const variants = {
                primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40',
                secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50',
                success: 'bg-success-500 text-white hover:bg-success-600',
                danger: 'bg-danger-500 text-white hover:bg-danger-600',
                ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
        }

        const sizes = {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-5 py-2.5 text-sm',
                lg: 'px-6 py-3 text-base',
                xl: 'px-8 py-4 text-lg',
        }

        return (
                <button
                        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                        disabled={disabled || loading}
                        {...props}
                >
                        {loading && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                        )}
                        {children}
                </button>
        )
}

export default Button
