import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Button from '../forms/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Oops! Something went wrong
            </h1>
            <p className="mt-2 text-gray-600">
              We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left bg-red-50 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-6">
              <Button onClick={this.handleReset}>
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary