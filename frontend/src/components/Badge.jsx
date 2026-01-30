/**
 * Badge Component
 * A versatile badge/chip component for status indicators, labels, and tags
 */

const Badge = ({
        children,
        variant = 'default',
        size = 'md',
        rounded = 'full',
        dot = false,
        removable = false,
        onRemove,
        className = '',
        ...props
}) => {
        const variants = {
                default: 'bg-gray-100 text-gray-700 border-gray-200',
                primary: 'bg-primary-100 text-primary-700 border-primary-200',
                success: 'bg-success-100 text-success-700 border-success-200',
                warning: 'bg-warning-100 text-warning-700 border-warning-200',
                danger: 'bg-danger-100 text-danger-700 border-danger-200',
                info: 'bg-accent-100 text-accent-700 border-accent-200',
                // Solid variants
                'solid-default': 'bg-gray-600 text-white border-gray-600',
                'solid-primary': 'bg-primary-600 text-white border-primary-600',
                'solid-success': 'bg-success-600 text-white border-success-600',
                'solid-warning': 'bg-warning-600 text-white border-warning-600',
                'solid-danger': 'bg-danger-600 text-white border-danger-600',
                'solid-info': 'bg-accent-600 text-white border-accent-600',
                // Outline variants
                'outline-default': 'bg-transparent text-gray-700 border-gray-300',
                'outline-primary': 'bg-transparent text-primary-700 border-primary-300',
                'outline-success': 'bg-transparent text-success-700 border-success-300',
                'outline-warning': 'bg-transparent text-warning-700 border-warning-300',
                'outline-danger': 'bg-transparent text-danger-700 border-danger-300',
                'outline-info': 'bg-transparent text-accent-700 border-accent-300',
        }

        const sizes = {
                xs: 'px-1.5 py-0.5 text-[10px]',
                sm: 'px-2 py-0.5 text-xs',
                md: 'px-2.5 py-1 text-xs',
                lg: 'px-3 py-1.5 text-sm',
        }

        const roundedStyles = {
                none: 'rounded-none',
                sm: 'rounded-sm',
                md: 'rounded-md',
                lg: 'rounded-lg',
                full: 'rounded-full',
        }

        const dotColors = {
                default: 'bg-gray-500',
                primary: 'bg-primary-500',
                success: 'bg-success-500',
                warning: 'bg-warning-500',
                danger: 'bg-danger-500',
                info: 'bg-accent-500',
        }

        // get base variant for dot color
        const baseVariant = variant.replace('solid-', '').replace('outline-', '')

        return (
                <span
                        className={`
                                inline-flex items-center gap-1.5 font-medium border
                                ${variants[variant] || variants.default}
                                ${sizes[size] || sizes.md}
                                ${roundedStyles[rounded] || roundedStyles.full}
                                ${className}
                        `}
                        {...props}
                >
                        {dot && (
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[baseVariant] || dotColors.default}`} />
                        )}
                        {children}
                        {removable && onRemove && (
                                <button
                                        onClick={(e) => {
                                                e.stopPropagation()
                                                onRemove()
                                        }}
                                        className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                                        aria-label="Remove"
                                >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        )}
                </span>
        )
}

// preset status badges
Badge.Status = ({ status, ...props }) => {
        const statusConfig = {
                PENDING: { variant: 'warning', label: 'Pending' },
                UNDER_INVESTIGATION: { variant: 'info', label: 'Under Investigation' },
                RESOLVED: { variant: 'success', label: 'Resolved' },
                CLOSED: { variant: 'default', label: 'Closed' },
                REJECTED: { variant: 'danger', label: 'Rejected' },
                FOUND: { variant: 'success', label: 'Found' },
                SEARCHING: { variant: 'warning', label: 'Searching' },
                ACTIVE: { variant: 'success', label: 'Active' },
                INACTIVE: { variant: 'default', label: 'Inactive' },
        }

        const config = statusConfig[status] || { variant: 'default', label: status }

        return (
                <Badge variant={config.variant} dot {...props}>
                        {config.label}
                </Badge>
        )
}

// preset priority badges
Badge.Priority = ({ priority, ...props }) => {
        const priorityConfig = {
                LOW: { variant: 'default', label: 'Low' },
                MEDIUM: { variant: 'primary', label: 'Medium' },
                HIGH: { variant: 'warning', label: 'High' },
                URGENT: { variant: 'danger', label: 'Urgent' },
        }

        const config = priorityConfig[priority] || { variant: 'default', label: priority }

        return (
                <Badge variant={config.variant} {...props}>
                        {config.label}
                </Badge>
        )
}

export default Badge
