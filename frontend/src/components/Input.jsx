const Input = ({
        label,
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
                        <input
                                className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-200 focus:ring-primary-500'
                                        } focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white ${className}`}
                                {...props}
                        />
                        {error && (
                                <p className="text-sm text-danger-500">{error}</p>
                        )}
                </div>
        )
}

export default Input
