import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ShoppingBagIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Button from '../../components/forms/Button'
import api from '../../services/api'
import { updateUser } from '../../store/authSlice'
import { validators } from '../../utils/validators'

const RetailerSetup = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const idTypeOptions = [
    { value: '', label: 'Select ID Type' },
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
  ]

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Clean up the data - remove empty strings and 'Nil' values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        // Only include non-empty values and skip 'Nil', 'nil', empty strings
        if (value && value.toString().trim() !== '' && value.toString().toLowerCase() !== 'nil') {
          acc[key] = typeof value === 'string' ? value.trim() : value
        }
        return acc
      }, {})

      console.log('=== RETAILER SETUP DEBUG ===')
      console.log('Original data:', data)
      console.log('Cleaned data:', cleanedData)
      
      const response = await api.post('/retailers/setup', cleanedData)
      
      console.log('Setup successful:', response.data)
      
      const updatedUser = {
        ...user,
        first_login: false,
        RetailerDetail: response.data.retailer
      }
      
      dispatch(updateUser(updatedUser))
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      toast.success('Retailer setup completed successfully!')
      navigate('/retailer', { replace: true })
    } catch (error) {
      console.error('=== RETAILER SETUP ERROR ===')
      console.error('Error:', error)
      console.error('Response data:', error.response?.data)
      console.error('Validation errors:', error.response?.data?.errors)
      
      // Show specific validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`)
        })
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to setup retailer'
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
            <ShoppingBagIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Retailer Setup
            </h1>
            <p className="text-gray-600">
              Please provide your business details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Business Name *"
                  icon={ShoppingBagIcon}
                  {...register('retailer_name', {
                    validate: validators.required('Business name'),
                  })}
                  error={errors.retailer_name?.message}
                  placeholder="Enter your business name"
                />

                <Input
                  label="Owner Name *"
                  icon={UserIcon}
                  {...register('owner_name', {
                    validate: validators.required('Owner name'),
                  })}
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
                  placeholder="business@example.com"
                />

                <Input
                  label="Primary Phone *"
                  icon={PhoneIcon}
                  {...register('phone_primary', {
                    validate: validators.phone,
                  })}
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
                  {...register('phone_secondary', {
                    validate: (value) => {
                      if (!value || value.trim() === '' || value.toLowerCase() === 'nil') return true
                      return validators.phone(value)
                    },
                  })}
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

                <Select
                  label="Owner ID Type"
                  {...register('owner_govt_id_type')}
                  options={idTypeOptions}
                  error={errors.owner_govt_id_type?.message}
                />

                <Input
                  label="Owner ID Number"
                  {...register('owner_govt_id_number')}
                  error={errors.owner_govt_id_number?.message}
                  placeholder="Enter ID number (optional)"
                />

                <Input
                  label="Website"
                  {...register('website')}
                  error={errors.website?.message}
                  placeholder="https://yourbusiness.com (optional)"
                />
              </div>
            </div>

            {/* Banking Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Banking Information (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Bank Account Number"
                  icon={BuildingLibraryIcon}
                  {...register('bank_account_number')}
                  error={errors.bank_account_number?.message}
                  placeholder="Enter account number (optional)"
                />

                <Input
                  label="IFSC Code"
                  {...register('ifsc_code')}
                  error={errors.ifsc_code?.message}
                  placeholder="Enter IFSC code (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
              >
                Complete Setup
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default RetailerSetup