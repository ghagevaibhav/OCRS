const Card = ({
        children,
        className = '',
        variant = 'default',
        size = 'md',
        hover = false,
        animate = false,
        ...props
}) => {
        const variants = {
                default: 'bg-white shadow-soft border border-gray-100/50',
                elevated: 'bg-white shadow-lg border border-gray-100/30',
                outlined: 'bg-white border-2 border-gray-200 shadow-none',
                glass: 'glass shadow-soft',
                flat: 'bg-gray-50 border border-gray-100 shadow-none',
        }

        const sizes = {
                sm: 'p-4 rounded-xl',
                md: 'p-6 rounded-2xl',
                lg: 'p-8 rounded-2xl',
        }

        const baseStyles = `${variants[variant] || variants.default} ${sizes[size] || sizes.md}`
        const hoverStyles = hover ? 'card-hover cursor-pointer' : ''
        const animateStyles = animate ? 'animate-fade-in-up' : ''

        return (
                <div
                        className={`${baseStyles} ${hoverStyles} ${animateStyles} ${className}`}
                        {...props}
                >
                        {children}
                </div>
        )
}

export default Card

