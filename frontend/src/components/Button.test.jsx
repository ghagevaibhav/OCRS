import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from './Button'

// tests for button component
describe('Button', () => {
        it('renders children correctly', () => {
                render(<Button>Click me</Button>)
                expect(screen.getByText('Click me')).toBeInTheDocument()
        })

        it('applies primary variant by default', () => {
                render(<Button>Primary Button</Button>)
                const button = screen.getByRole('button')
                expect(button).toHaveClass('bg-primary-600')
        })

        it('applies secondary variant when specified', () => {
                render(<Button variant="secondary">Secondary</Button>)
                const button = screen.getByRole('button')
                expect(button).toHaveClass('border-primary-600')
        })

        it('applies different sizes correctly', () => {
                const { rerender } = render(<Button size="sm">Small</Button>)
                expect(screen.getByRole('button')).toHaveClass('px-3')

                rerender(<Button size="lg">Large</Button>)
                expect(screen.getByRole('button')).toHaveClass('px-6')
        })

        it('handles click events', () => {
                const handleClick = vi.fn()
                render(<Button onClick={handleClick}>Click me</Button>)

                fireEvent.click(screen.getByRole('button'))
                expect(handleClick).toHaveBeenCalledTimes(1)
        })

        it('is disabled when disabled prop is true', () => {
                render(<Button disabled>Disabled</Button>)
                expect(screen.getByRole('button')).toBeDisabled()
        })

        it('is disabled when loading prop is true', () => {
                render(<Button loading>Loading</Button>)
                expect(screen.getByRole('button')).toBeDisabled()
        })

        it('shows loading spinner when loading', () => {
                render(<Button loading>Loading</Button>)
                const spinner = screen.getByRole('button').querySelector('svg')
                expect(spinner).toBeInTheDocument()
                expect(spinner).toHaveClass('animate-spin')
        })

        it('applies custom className', () => {
                render(<Button className="custom-class">Custom</Button>)
                expect(screen.getByRole('button')).toHaveClass('custom-class')
        })
})
