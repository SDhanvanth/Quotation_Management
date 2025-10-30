import { forwardRef } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  const baseInputClasses = 'block w-full rounded-lg border shadow-sm focus:ring-2 focus:border-transparent placeholder-gray-400 transition duration-150 ease-in-out px-3 py-2'
  const normalInputClasses = 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  const errorInputClasses = 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
  const iconPadding = Icon ? 'pl-10' : ''
  
  const inputClasses = `${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${iconPadding} ${className}`

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input