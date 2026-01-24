const Card = ({
        children,
        className = '',
        hover = false,
        ...props
}) => {
        return (
                <div
                        className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${hover ? 'card-hover cursor-pointer' : ''
                                } ${className}`}
                        {...props}
                >
                        {children}
                </div>
        )
}

export default Card
