import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// mock axios
vi.mock('axios', () => ({
        default: {
                create: vi.fn(() => ({
                        interceptors: {
                                request: { use: vi.fn() }
                        },
                        post: vi.fn(),
                        get: vi.fn(),
                        put: vi.fn(),
                        delete: vi.fn()
                }))
        }
}))

// tests for api service
describe('api service', () => {
        beforeEach(() => {
                vi.clearAllMocks()
                localStorage.clear()
        })

        it('creates axios instances with correct base urls', async () => {
                // re-import to trigger axios.create calls
                vi.resetModules()
                await import('./api')

                expect(axios.create).toHaveBeenCalledTimes(2)
                expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
                        baseURL: expect.stringContaining('localhost:8081'),
                        headers: { 'Content-Type': 'application/json' }
                }))
                expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
                        baseURL: expect.stringContaining('localhost:8080'),
                        headers: { 'Content-Type': 'application/json' }
                }))
        })

        it('adds auth interceptor to instances', async () => {
                vi.resetModules()
                await import('./api')

                // verify interceptors were added
                const mockInstance = axios.create.mock.results[0].value
                expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
        })
})
