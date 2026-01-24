import React from 'react'
import Button from './Button'

const SuccessModal = ({ isOpen, onClose, title, message }) => {
        if (!isOpen) return null

        return (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-emerald-600 animate-[bounce_1s_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-500 mb-8">{message}</p>
                                <Button
                                        fullWidth
                                        onClick={onClose}
                                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                >
                                        Continue
                                </Button>
                        </div>
                </div>
        )
}

export default SuccessModal
