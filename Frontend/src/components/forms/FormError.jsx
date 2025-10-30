import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

const FormError = ({ error }) => {
  if (!error) return null

  return (
    <div className="flex items-center mt-1 text-sm text-red-600">
      <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}

export default FormError