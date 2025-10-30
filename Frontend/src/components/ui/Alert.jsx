import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  dismissible = true,
  autoClose = false,
  autoCloseDelay = 5000,
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-400',
          icon: CheckCircleIcon
        }
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
          icon: XCircleIcon
        }
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-400',
          icon: ExclamationTriangleIcon
        }
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-400',
          icon: InformationCircleIcon
        }
    }
  }

  const { bgColor, borderColor, textColor, iconColor, icon: Icon } = getTypeStyles()
  const alertClasses = `rounded-lg border p-4 ${bgColor} ${borderColor} ${className}`

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={alertClasses}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="ml-3 flex-1">
              {title && (
                <h3 className={`text-sm font-medium ${textColor}`}>
                  {title}
                </h3>
              )}
              {message && (
                <div className={`text-sm ${textColor} ${title ? 'mt-1' : ''}`}>
                  {message}
                </div>
              )}
            </div>
            {dismissible && (
              <div className="ml-auto pl-3">
                <button
                  onClick={handleClose}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${bgColor} ${textColor} hover:bg-opacity-75 focus:ring-offset-${type}-50`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Alert