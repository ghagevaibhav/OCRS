const Button = ({
        children,
        variant = 'primary',
        size = 'md',
        className = '',
        disabled = false,
        loading = false,
        fullWidth = false,
        icon = null,
        iconPosition = 'left',
        ...props
}) => {
        const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 btn-ripple'

        const variants = {
                primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 focus-visible:ring-primary-500',
                secondary: 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500',
                success: 'bg-success-500 text-white hover:bg-success-600 shadow-lg shadow-success-500/25 focus-visible:ring-success-500',
                danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-lg shadow-danger-500/25 focus-visible:ring-danger-500',
                warning: 'bg-warning-500 text-white hover:bg-warning-600 shadow-lg shadow-warning-500/25 focus-visible:ring-warning-500',
                ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500',
                outline: 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500',
                'outline-primary': 'bg-transparent text-primary-600 border border-primary-300 hover:bg-primary-50 hover:border-primary-500 focus-visible:ring-primary-500',
                link: 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline p-0 shadow-none',
        }

        const sizes = {
                xs: 'px-2.5 py-1 text-xs',
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-5 py-2.5 text-sm',
                lg: 'px-6 py-3 text-base',
                xl: 'px-8 py-4 text-lg',
        }

        const widthClass = fullWidth ? 'w-full' : ''

        const LoadingSpinner = () => (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
        )

        const renderContent = () => {
                if (loading) {
                        return (
                                <>
                                        <LoadingSpinner />
                                        <span className="opacity-70">{children}</span>
                                </>
                        )
                }

                if (icon && iconPosition === 'left') {
                        return (
                                <>
                                        <span className="flex-shrink-0">{icon}</span>
                                        {children}
                                </>
                        )
                }

                if (icon && iconPosition === 'right') {
                        return (
                                <>
                                        {children}
                                        <span className="flex-shrink-0">{icon}</span>
                                </>
                        )
                }

                return children
        }

        return (
                <button
                        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
                        disabled={disabled || loading}
                        {...props}
                >
                        {renderContent()}
                </button>
        )
}

export default Button

