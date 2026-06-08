import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Algo salio mal</h3>
          <p className="text-xs text-gray-500 mb-4">
            {this.state.error?.message || 'Error inesperado al renderizar esta seccion'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
