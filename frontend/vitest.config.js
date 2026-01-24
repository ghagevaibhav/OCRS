import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// vitest configuration for react component testing
export default defineConfig({
        plugins: [react()],
        test: {
                environment: 'jsdom',
                globals: true,
                setupFiles: ['./src/test/setup.js'],
                include: ['src/**/*.{test,spec}.{js,jsx}'],
                coverage: {
                        reporter: ['text', 'json', 'html'],
                        exclude: ['node_modules/', 'src/test/']
                }
        }
})
