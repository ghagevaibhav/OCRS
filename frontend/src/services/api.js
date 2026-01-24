import axios from 'axios'

const AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081/api'
const MAIN_API = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8080/api'

// create axios instances
export const authApi = axios.create({
        baseURL: AUTH_API,
        headers: { 'Content-Type': 'application/json' }
})

export const mainApi = axios.create({
        baseURL: MAIN_API,
        headers: { 'Content-Type': 'application/json' }
})

// add auth token to requests
const addAuthInterceptor = (instance) => {
        instance.interceptors.request.use((config) => {
                const token = localStorage.getItem('token')
                if (token) {
                        config.headers.Authorization = `Bearer ${token}`
                }
                return config
        })
}

addAuthInterceptor(authApi)
addAuthInterceptor(mainApi)

// auth api calls
export const authService = {
        register: (data) => authApi.post('/auth/register/user', data),
        registerAuthority: (data) => authApi.post('/auth/register/authority', data),
        login: (data) => authApi.post('/auth/login', data),
        logout: (userId, role) => authApi.post(`/auth/logout?userId=${userId}&role=${role}`),
        validate: () => authApi.get('/auth/validate'),
}

// user api calls
export const userService = {
        fileFIR: (data) => mainApi.post('/user/fir', data),
        getMyFIRs: () => mainApi.get('/user/firs'),
        getFIR: (id) => mainApi.get(`/user/fir/${id}`),
        getFIRByNumber: (number) => mainApi.get(`/user/fir/number/${number}`),
        getFIRUpdates: (firId) => mainApi.get(`/user/fir/${firId}/updates`),
        fileMissing: (data) => mainApi.post('/user/missing', data),
        getMyMissingReports: () => mainApi.get('/user/missing-reports'),
        getMissingReport: (id) => mainApi.get(`/user/missing/${id}`),
        getMissingReportByNumber: (caseNumber) => mainApi.get(`/user/missing/number/${caseNumber}`),
        getMissingUpdates: (reportId) => mainApi.get(`/user/missing/${reportId}/updates`),
}

// authority api calls
export const authorityService = {
        getFIRs: () => mainApi.get('/authority/firs'),
        getFIRsPaged: (page, size, sortBy, sortDir) =>
                mainApi.get(`/authority/firs/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
        getFIR: (id) => mainApi.get(`/authority/fir/${id}`),
        getFIRUpdates: (firId) => mainApi.get(`/authority/fir/${firId}/updates`),
        updateFIR: (firId, data) => mainApi.put(`/authority/fir/${firId}/update`, data),
        searchFIRs: (params) => mainApi.get('/authority/firs/search', { params }),
        getMissingReports: () => mainApi.get('/authority/missing-reports'),
        getMissingReportsPaged: (page, size, sortBy, sortDir) =>
                mainApi.get(`/authority/missing-reports/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
        getMissingReport: (id) => mainApi.get(`/authority/missing/${id}`),
        getMissingUpdates: (reportId) => mainApi.get(`/authority/missing/${reportId}/updates`),
        updateMissingReport: (reportId, data) => mainApi.put(`/authority/missing/${reportId}/update`, data),
        searchMissingReports: (params) => mainApi.get('/authority/missing-reports/search', { params }),
        getAnalytics: () => mainApi.get('/authority/analytics'),
}

// admin api calls
export const adminService = {
        getAnalytics: () => mainApi.get('/admin/analytics'),
        getAllFIRs: () => mainApi.get('/admin/firs'),
        getAllMissingReports: () => mainApi.get('/admin/missing-reports'),
        getAuthorities: () => mainApi.get('/admin/authorities'),
        getActiveAuthorities: () => mainApi.get('/admin/authorities/active'),
        updateAuthority: (id, data) => mainApi.put(`/admin/authority/${id}`, data),
        deleteAuthority: (id) => mainApi.delete(`/admin/authority/${id}`),
        reassignFIR: (firId, authorityId) => mainApi.put(`/admin/fir/${firId}/reassign/${authorityId}`),
        reassignMissingReport: (reportId, authorityId) => mainApi.put(`/admin/missing/${reportId}/reassign/${authorityId}`),
        createAuthority: (data) => mainApi.post('/admin/authority', data),
}
