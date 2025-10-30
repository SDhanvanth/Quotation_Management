import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  ShoppingBagIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  IdentificationIcon,
  BuildingLibraryIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Button from '../../components/forms/Button'
import { useAuth } from '../../hooks/useAuth'
import userService from '../../services/user.service'
import { validators } from '../../utils/validators'
import toast from 'react-hot-toast'

const RetailerProfile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      retailer_name: user?.RetailerDetail?.retailer_name || '',
      owner_name: user?.RetailerDetail?.owner_name || '',
      phone_primary: user?.RetailerDetail?.phone_primary || '',
      email_primary: user?.RetailerDetail?.email_primary || '',
      gst_number: user?.RetailerDetail?.gst_number || '',
      pan_number: user?.RetailerDetail?.pan_number || '',
      license_number: user?.RetailerDetail?.license_number || '',
      bank_account_number: user?.RetailerDetail?.bank_account_number || '',
      ifsc_code: user?.RetailerDetail?.ifsc_code || '',
      owner_govt_id_type: user?.RetailerDetail?.owner_govt_id_type || '',
      owner_govt_id_number: user?.RetailerDetail?.owner_govt_id_number || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      await userService.updateProfile({
        retailer_details: data
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const idTypeOptions = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retailer Profile</h1>
          <p className="text-gray-600">Manage your business information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <div className="flex items-center mb-6">
            <ShoppingBagIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Business Name"
              {...register('retailer_name', {
                validate: validators.required('Business name'),
              })}
              error={errors.retailer_name?.message}
              disabled={!isEditing}
            />
            
            <Input
              label="Retailer Code"
              value={user?.RetailerDetail?.retailer_code || '-'}
              disabled
            />
            
            <Input
              label="Owner Name"
              icon={UserIcon}
              {...register('owner_name', {
                validate: validators.required('Owner name'),
              })}
              error={errors.owner_name?.message}
              disabled={!isEditing}
            />
            
            <Input
              label="License Number"
              icon={IdentificationIcon}
              {...register('license_number')}
              error={errors.license_number?.message}
              disabled={!isEditing}
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <div className="flex items-center mb-6">
            <PhoneIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Primary Phone"
              icon={PhoneIcon}
              {...register('phone_primary', {
                validate: validators.phone,
              })}
              error={errors.phone_primary?.message}
              disabled={!isEditing}
            />
            
            <Input
              label="Primary Email"
              type="email"
              icon={EnvelopeIcon}
              {...register('email_primary', {
                validate: validators.email,
              })}
              error={errors.email_primary?.message}
              disabled={!isEditing}
            />
          </div>
        </Card>

        {/* Tax Information */}
        <Card>
          <div className="flex items-center mb-6">
            <IdentificationIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Tax & Legal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="GST Number"
              {...register('gst_number', {
                validate: validators.gst,
              })}
              error={errors.gst_number?.message}
              disabled={!isEditing}
            />
            
            <Input
              label="PAN Number"
              {...register('pan_number', {
                validate: validators.pan,
              })}
              error={errors.pan_number?.message}
              disabled={!isEditing}
            />
            
            <Select
              label="Owner ID Type"
              {...register('owner_govt_id_type')}
              options={idTypeOptions}
              disabled={!isEditing}
            />
            
            <Input
              label="Owner ID Number"
              {...register('owner_govt_id_number')}
              disabled={!isEditing}
            />
          </div>
        </Card>

        {/* Banking Information */}
        <Card>
          <div className="flex items-center mb-6">
            <BuildingLibraryIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Banking Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Bank Account Number"
              {...register('bank_account_number')}
              disabled={!isEditing}
            />
            
            <Input
              label="IFSC Code"
              {...register('ifsc_code')}
              disabled={!isEditing}
            />
          </div>
        </Card>

        {/* Address Information */}
        <Card>
          <div className="flex items-center mb-6">
            <MapPinIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          </div>
          
          <p className="text-gray-600">Address management coming soon...</p>
        </Card>

        {isEditing && (
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}

export default RetailerProfile