import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Input from '../../components/forms/Input'
import Button from '../../components/forms/Button'
import api from '../../services/api'
import { updateUser } from '../../store/authSlice'
import { validators } from '../../utils/validators'

const StoreSetup = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, token } = useSelector((state) => state.auth)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Clean up the data - remove empty strings and 'Nil' values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        // Only include non-empty values and skip 'Nil', 'nil', empty strings
        if (value && value.trim() !== '' && value.toLowerCase() !== 'nil') {
          acc[key] = value.trim()
        }
        return acc
      }, {})

      console.log('=== STORE SETUP DEBUG ===')
      console.log('Original data:', data)
      console.log('Cleaned data:', cleanedData)
      console.log('Token exists:', !!token)
      
      const response = await api.post('/stores/setup', cleanedData)
      
      console.log('Setup successful:', response.data)
      
      const updatedUser = {
        ...user,
        first_login: false,
        Store: response.data.store
      }
      
      dispatch(updateUser(updatedUser))
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      toast.success('Store setup completed successfully!')
      navigate('/store', { replace: true })
    } catch (error) {
      console.error('=== STORE SETUP ERROR ===')
      console.error('Error:', error)
      console.error('Response data:', error.response?.data)
      console.error('Validation errors:', error.response?.data?.errors)
      
      // Show specific validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`)
        })
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to setup store'
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <BuildingStorefrontIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Store Setup
            </h1>
            <p className="text-gray-600">
              Please provide your store details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Store Name *"
                  icon={BuildingStorefrontIcon}
                  {...register('store_name', {
                    validate: validators.required('Store name'),
                  })}
                  error={errors.store_name?.message}
                  placeholder="Enter your store name"
                />
                <Input
                  label="Owner Name"
                  icon={UserIcon}
                  {...register('owner_name')}
                  error={errors.owner_name?.message}
                  placeholder="Enter owner name"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Primary Email *"
                  type="email"
                  icon={EnvelopeIcon}
                  {...register('email_primary', {
                    validate: validators.email,
                  })}
                  error={errors.email_primary?.message}
                  placeholder="store@example.com"
                />
                <Input
                  label="Primary Phone"
                  icon={PhoneIcon}
                  {...register('phone_primary')}
                  error={errors.phone_primary?.message}
                  placeholder="9876543210"
                />
                <Input
                  label="Secondary Email"
                  type="email"
                  icon={EnvelopeIcon}
                  {...register('email_secondary', {
                    validate: (value) => {
                      if (!value || value.trim() === '' || value.toLowerCase() === 'nil') return true
                      return validators.email(value)
                    },
                  })}
                  error={errors.email_secondary?.message}
                  placeholder="secondary@example.com (optional)"
                />
                <Input
                  label="Secondary Phone"
                  icon={PhoneIcon}
                  {...register('phone_secondary')}
                  error={errors.phone_secondary?.message}
                  placeholder="9876543210 (optional)"
                />
              </div>
            </div>

            {/* Legal & Tax Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Legal & Tax Information (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="License Number"
                  icon={IdentificationIcon}
                  {...register('license_number')}
                  error={errors.license_number?.message}
                  placeholder="Enter license number (optional)"
                />
                <Input
                  label="GST Number"
                  {...register('gst_number', {
                    validate: (value) => {
                      if (!value || value.trim() === '' || value.toLowerCase() === 'nil') return true
                      return validators.gst(value)
                    },
                  })}
                  error={errors.gst_number?.message}
                  placeholder="29ABCDE1234F1Z5 (optional)"
                />
                <Input
                  label="PAN Number"
                  {...register('pan_number', {
                    validate: (value) => {
                      if (!value || value.trim() === '' || value.toLowerCase() === 'nil') return true
                      return validators.pan(value)
                    },
                  })}
                  error={errors.pan_number?.message}
                  placeholder="ABCDE1234F (optional)"
                />
                <Input
                  label="Website"
                  {...register('website')}
                  error={errors.website?.message}
                  placeholder="https://yourstore.com (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" loading={isSubmitting} size="lg">
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default StoreSetup