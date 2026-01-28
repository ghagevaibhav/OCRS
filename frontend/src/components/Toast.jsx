import { useState, useEffect, createContext, useContext, useCallback } from 'react'

/**
 * Toast Notification System
 * Provides a context-based toast notification system with multiple variants
 */

const ToastContext = createContext(null)

// Individual Toast component
const Toast = ({ id, message, variant = 'info', duration = 5000, onClose }) => {
        const [isExiting, setIsExiting] = useState(false)

        useEffect(() => {
                const timer = setTimeout(() => {
                        handleClose()
                }, duration)

                return () => clearTimeout(timer)
        }, [duration])

        const handleClose = () => {
                setIsExiting(true)
                setTimeout(() => {
                        onClose(id)
                }, 300) // Match animation duration
        }

        const variants = {
                info: {
                        bg: 'bg-primary-50 border-primary-200',
                        icon: 'text-primary-500',
                        text: 'text-primary-800',
                        iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                success: {
                        bg: 'bg-success-50 border-success-200',
                        icon: 'text-success-500',
                        text: 'text-success-800',
                        iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                },
                warning: {
                        bg: 'bg-warning-50 border-warning-200',
                        icon: 'text-warning-500',
                        text: 'text-warning-800',
                        iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                },
                error: {
                        bg: 'bg-danger-50 border-danger-200',
                        icon: 'text-danger-500',
                        text: 'text-danger-800',
                        iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                }
        }

        const style = variants[variant] || variants.info

        return (
                <div
                        className={`
                                flex items-start gap-3 p-4 rounded-xl border shadow-lg
                                ${style.bg}
                                transform transition-all duration-300 ease-out
                                ${isExiting
                                        ? 'opacity-0 translate-x-full'
                                        : 'opacity-100 translate-x-0 animate-slideIn'
                                }
                        `}
                        role="alert"
                >
                        <svg
                                className={`w-5 h-5 flex-shrink-0 ${style.icon}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                        >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                        </svg>
                        <p className={`text-sm font-medium flex-1 ${style.text}`}>{message}</p>
                        <button
                                onClick={handleClose}
                                className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors ${style.icon}`}
                                aria-label="Dismiss"
                        >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                        </button>
                </div>
        )
}

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
        return (
                <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                        {toasts.map(toast => (
                                <div key={toast.id} className="pointer-events-auto">
                                        <Toast {...toast} onClose={removeToast} />
                                </div>
                        ))}
                </div>
        )
}

// Toast Provider
export const ToastProvider = ({ children }) => {
        const [toasts, setToasts] = useState([])

        const addToast = useCallback((message, variant = 'info', duration = 5000) => {
                const id = Date.now() + Math.random()
                setToasts(prev => [...prev, { id, message, variant, duration }])
                return id
        }, [])

        const removeToast = useCallback((id) => {
                setToasts(prev => prev.filter(toast => toast.id !== id))
        }, [])

        // Convenience methods
        const toast = {
                show: (message, options = {}) => addToast(message, options.variant || 'info', options.duration),
                info: (message, duration) => addToast(message, 'info', duration),
                success: (message, duration) => addToast(message, 'success', duration),
                warning: (message, duration) => addToast(message, 'warning', duration),
                error: (message, duration) => addToast(message, 'error', duration),
        }

        return (
                <ToastContext.Provider value={toast}>
                        {children}
                        <ToastContainer toasts={toasts} removeToast={removeToast} />
                </ToastContext.Provider>
        )
}

// Hook to use toast
export const useToast = () => {
        const context = useContext(ToastContext)
        if (!context) {
                throw new Error('useToast must be used within a ToastProvider')
        }
        return context
}

export default Toast
