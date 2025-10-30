import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      case 'secondary':
        return 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-gray-300'
      case 'link':
        return 'bg-transparent text-blue-600 hover:text-blue-700 hover:underline'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'md':
        return 'px-4 py-2 text-base'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const buttonClasses = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${fullWidth ? 'w-full' : ''} ${className}`

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="w-5 h-5 mr-2" />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className="w-5 h-5 ml-2" />
          )}
        </>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button