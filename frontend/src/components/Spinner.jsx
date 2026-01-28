/**
 * Spinner Component
 * A versatile loading spinner with multiple sizes and variants
 */

const Spinner = ({
        size = 'md',
        variant = 'primary',
        className = '',
        label = 'Loading...',
        showLabel = false,
        ...props
}) => {
        const sizes = {
                xs: 'w-3 h-3 border',
                sm: 'w-4 h-4 border-2',
                md: 'w-6 h-6 border-2',
                lg: 'w-8 h-8 border-2',
                xl: 'w-12 h-12 border-3',
        }

        const variants = {
                primary: 'border-primary-200 border-t-primary-600',
                white: 'border-white/30 border-t-white',
                gray: 'border-gray-200 border-t-gray-600',
                success: 'border-success-200 border-t-success-600',
                danger: 'border-danger-200 border-t-danger-600',
        }

        const labelSizes = {
                xs: 'text-xs',
                sm: 'text-xs',
                md: 'text-sm',
                lg: 'text-base',
                xl: 'text-lg',
        }

        return (
                <div className={`inline-flex items-center gap-2 ${className}`} role="status" {...props}>
                        <div
                                className={`
                                        rounded-full animate-spin
                                        ${sizes[size] || sizes.md}
                                        ${variants[variant] || variants.primary}
                                `}
                        />
                        {showLabel && (
                                <span className={`text-gray-600 ${labelSizes[size]}`}>{label}</span>
                        )}
                        <span className="sr-only">{label}</span>
                </div>
        )
}

// Full-page loading overlay
Spinner.Overlay = ({
        message = 'Loading...',
        variant = 'primary',
        blur = true
}) => {
        return (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${blur ? 'backdrop-blur-sm' : ''} bg-white/80`}>
                        <div className="text-center">
                                <Spinner size="xl" variant={variant} className="mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">{message}</p>
                        </div>
                </div>
        )
}

// Inline loading state
Spinner.Inline = ({
        loading,
        children,
        size = 'md',
        variant = 'primary'
}) => {
        if (loading) {
                return <Spinner size={size} variant={variant} />
        }
        return children
}

export default Spinner
