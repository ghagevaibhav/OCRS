import axios from 'axios'

// API Gateway - Single entry point for all API calls
const API_GATEWAY = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8090'

// Token storage keys
const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TOKEN_EXPIRY_KEY = 'tokenExpiry'

// Token management utilities
export const tokenManager = {
        getToken: () => localStorage.getItem(TOKEN_KEY),
        getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
        getTokenExpiry: () => localStorage.getItem(TOKEN_EXPIRY_KEY),

        setTokens: (accessToken, refreshToken, expiresIn) => {
                localStorage.setItem(TOKEN_KEY, accessToken)
                if (refreshToken) {
                        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
                }
                if (expiresIn) {
                        const expiryTime = Date.now() + (expiresIn * 1000)
                        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
                }
        },

        clearTokens: () => {
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(REFRESH_TOKEN_KEY)
                localStorage.removeItem(TOKEN_EXPIRY_KEY)
        },

        isTokenExpiringSoon: () => {
                const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
                if (!expiry) return false
                // Refresh if less than 5 minutes remaining
                return Date.now() > parseInt(expiry) - (5 * 60 * 1000)
        }
}

// Create axios instance for API Gateway
export const api = axios.create({
        baseURL: API_GATEWAY,
        headers: { 'Content-Type': 'application/json' }
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
        refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token) => {
        refreshSubscribers.forEach(callback => callback(token))
        refreshSubscribers = []
}

const onTokenRefreshFailed = () => {
        refreshSubscribers = []
}

// Request interceptor - add auth token
api.interceptors.request.use(
        async (config) => {
                const token = tokenManager.getToken()
                if (token) {
                        config.headers.Authorization = `Bearer ${token}`
                }
                return config
        },
        (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
        (response) => response,
        async (error) => {
                const originalRequest = error.config

                // If unauthorized and not a retry
                if (error.response?.status === 401 && !originalRequest._retry) {
                        originalRequest._retry = true

                        const refreshToken = tokenManager.getRefreshToken()
                        if (!refreshToken) {
                                // No refresh token, logout
                                tokenManager.clearTokens()
                                window.location.href = '/login'
                                return Promise.reject(error)
                        }

                        if (isRefreshing) {
                                // Wait for the ongoing refresh
                                return new Promise((resolve, reject) => {
                                        subscribeTokenRefresh((token) => {
                                                originalRequest.headers.Authorization = `Bearer ${token}`
                                                resolve(api(originalRequest))
                                        })
                                })
                        }

                        isRefreshing = true

                        try {
                                const response = await axios.post(`${API_GATEWAY}/api/auth/refresh`, {
                                        refreshToken: refreshToken
                                })

                                if (response.data.success) {
                                        const { token, refreshToken: newRefreshToken, expiresIn } = response.data.data
                                        tokenManager.setTokens(token, newRefreshToken, expiresIn)

                                        isRefreshing = false
                                        onTokenRefreshed(token)

                                        originalRequest.headers.Authorization = `Bearer ${token}`
                                        return api(originalRequest)
                                } else {
                                        throw new Error('Refresh failed')
                                }
                        } catch (refreshError) {
                                isRefreshing = false
                                onTokenRefreshFailed()
                                tokenManager.clearTokens()
                                window.location.href = '/login'
                                return Promise.reject(refreshError)
                        }
                }

                return Promise.reject(error)
        }
)

// Legacy axios instances for backward compatibility (both route through gateway now)
export const authApi = api
export const mainApi = api

// Auth service calls
export const authService = {
        register: (data) => api.post('/api/auth/register/user', data).then(res => {
                if (res.data.success && res.data.data) {
                        const { token, refreshToken, expiresIn } = res.data.data
                        tokenManager.setTokens(token, refreshToken, expiresIn)
                }
                return res
        }),
        registerAuthority: (data) => api.post('/api/auth/register/authority', data).then(res => {
                if (res.data.success && res.data.data) {
                        const { token, refreshToken, expiresIn } = res.data.data
                        tokenManager.setTokens(token, refreshToken, expiresIn)
                }
                return res
        }),
        login: (data) => api.post('/api/auth/login', data).then(res => {
                if (res.data.success && res.data.data) {
                        const { token, refreshToken, expiresIn } = res.data.data
                        tokenManager.setTokens(token, refreshToken, expiresIn)
                }
                return res
        }),
        logout: async (userId, role) => {
                const refreshToken = tokenManager.getRefreshToken()
                try {
                        // Revoke refresh token on server
                        if (refreshToken) {
                                await api.post('/api/auth/revoke', { refreshToken })
                        }
                        await api.post(`/api/auth/logout?userId=${userId}&role=${role}`)
                } catch (e) {
                        console.warn('Logout request failed:', e)
                } finally {
                        tokenManager.clearTokens()
                }
        },
        validate: () => api.get('/api/auth/validate'),
        refreshToken: () => {
                const refreshToken = tokenManager.getRefreshToken()
                return api.post('/api/auth/refresh', { refreshToken })
        },
}

// User service calls
export const userService = {
        fileFIR: (data) => api.post('/api/user/fir', data),
        getMyFIRs: () => api.get('/api/user/firs'),
        getFIR: (id) => api.get(`/api/user/fir/${id}`),
        getFIRByNumber: (number) => api.get(`/api/user/fir/number/${number}`),
        getFIRUpdates: (firId) => api.get(`/api/user/fir/${firId}/updates`),
        fileMissing: (data) => api.post('/api/user/missing', data),
        getMyMissingReports: () => api.get('/api/user/missing-reports'),
        getMissingReport: (id) => api.get(`/api/user/missing/${id}`),
        getMissingReportByNumber: (caseNumber) => api.get(`/api/user/missing/number/${caseNumber}`),
        getMissingUpdates: (reportId) => api.get(`/api/user/missing/${reportId}/updates`),
}

// Authority service calls
export const authorityService = {
        getFIRs: () => api.get('/api/authority/firs'),
        getFIRsPaged: (page, size, sortBy, sortDir) =>
                api.get(`/api/authority/firs/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
        getFIR: (id) => api.get(`/api/authority/fir/${id}`),
        getFIRUpdates: (firId) => api.get(`/api/authority/fir/${firId}/updates`),
        updateFIR: (firId, data) => api.put(`/api/authority/fir/${firId}/update`, data),
        searchFIRs: (params) => api.get('/api/authority/firs/search', { params }),
        getMissingReports: () => api.get('/api/authority/missing-reports'),
        getMissingReportsPaged: (page, size, sortBy, sortDir) =>
                api.get(`/api/authority/missing-reports/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
        getMissingReport: (id) => api.get(`/api/authority/missing/${id}`),
        getMissingUpdates: (reportId) => api.get(`/api/authority/missing/${reportId}/updates`),
        updateMissingReport: (reportId, data) => api.put(`/api/authority/missing/${reportId}/update`, data),
        searchMissingReports: (params) => api.get('/api/authority/missing-reports/search', { params }),
        getAnalytics: () => api.get('/api/authority/analytics'),
}

// Admin service calls
export const adminService = {
        getAnalytics: () => api.get('/api/admin/analytics'),
        getAllFIRs: () => api.get('/api/admin/firs'),
        getAllMissingReports: () => api.get('/api/admin/missing-reports'),
        // Authority read operations
        getAuthorities: () => api.get('/api/admin/authorities'),
        getActiveAuthorities: () => api.get('/api/admin/authorities/active'),
        // Authority CRUD operations (now go through gateway)
        createAuthority: (data) => api.post('/api/auth/register/authority', data),
        updateAuthority: (id, data) => api.put(`/api/authority/${id}`, data),
        deleteAuthority: (id) => api.delete(`/api/authority/${id}`),
        // Case reassignment
        reassignFIR: (firId, authorityId) => api.put(`/api/admin/fir/${firId}/reassign/${authorityId}`),
        reassignMissingReport: (reportId, authorityId) => api.put(`/api/admin/missing/${reportId}/reassign/${authorityId}`),
}

