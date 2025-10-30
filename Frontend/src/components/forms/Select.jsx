import { forwardRef } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  ...props
}, ref) => {
  const baseSelectClasses = 'block w-full rounded-lg border shadow-sm focus:ring-2 focus:border-transparent placeholder-gray-400 appearance-none transition duration-150 ease-in-out pr-10 px-3 py-2'
  const normalSelectClasses = 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  const errorSelectClasses = 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
  
  const selectClasses = `${baseSelectClasses} ${error ? errorSelectClasses : normalSelectClasses} ${className}`

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select