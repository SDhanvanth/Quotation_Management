import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const spinner = (
    <motion.div
      className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner