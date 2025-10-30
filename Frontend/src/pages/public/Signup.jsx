import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import Input from '../../components/forms/Input'
import Button from '../../components/forms/Button'
import Card from '../../components/ui/Card'
import authService from '../../services/auth.service'
import { validators } from '../../utils/validators'

const Signup = () => {
  const navigate = useNavigate()
  const [userType, setUserType] = useState('')
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm()

  const password = watch('password')

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const userTypes = [
    {
      id: 'store',
      name: 'Store',
      icon: BuildingStorefrontIcon,
      description: 'Manage quotations and inventory',
      typeId: 2,
    },
    {
      id: 'retailer',
      name: 'Retailer',
      icon: ShoppingBagIcon,
      description: 'Respond to quotations and supply products',
      typeId: 3,
    },
  ]

  const onSubmit = async (data) => {
    try {
      if (!showOTPVerification) {
        // Register user
        const selectedType = userTypes.find(t => t.id === userType)
        const response = await authService.register({
          username: data.username,
          email: data.email,
          password: data.password,
          type_id: selectedType.typeId,
        })
        
        setRegistrationData(response)
        setShowOTPVerification(true)
        toast.success('Registration successful! Please verify your email.')
      } else {
        // Verify OTP
        const response = await authService.verifyEmail({
          email: registrationData.user.email,
          otp: data.otp,
        })
        
        toast.success('Email verified successfully!')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    }
  }

  const resendOTP = async () => {
    if (resendCooldown > 0) return
    
    try {
      await authService.resendOTP({
        email: registrationData.user.email,
        type: 'email_verification',
      })
      toast.success('OTP resent successfully')
      setResendCooldown(60) // 60 seconds cooldown
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  if (!userType) {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Choose Your Account Type
              </h1>
              <p className="text-gray-600">
                Select how you want to use QuoteMaster
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {userTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserType(type.id)}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors duration-200 text-left group"
                >
                  <type.icon className="h-12 w-12 text-blue-600 mb-4 group-hover:text-blue-700" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-gray-600">{type.description}</p>
                </motion.button>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/" className="text-gray-600 hover:text-gray-700 underline decoration-1 underline-offset-2">
                ← Back to Home
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showOTPVerification ? 'Verify Your Email' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {showOTPVerification 
                ? `We've sent a verification code to ${registrationData?.user?.email}`
                : `Sign up as ${userTypes.find(t => t.id === userType)?.name}`
              }
            </p>
          </div>

          {!showOTPVerification ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Username"
                icon={UserIcon}
                {...register('username', {
                  validate: validators.username,
                })}
                error={errors.username?.message}
                placeholder="Choose a username"
              />

              <Input
                label="Email"
                type="email"
                icon={EnvelopeIcon}
                {...register('email', {
                  validate: validators.email,
                })}
                error={errors.email?.message}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                type="password"
                icon={LockClosedIcon}
                {...register('password', {
                                   validate: validators.password,
                })}
                error={errors.password?.message}
                placeholder="Create a password"
              />

              <Input
                label="Confirm Password"
                type="password"
                icon={LockClosedIcon}
                {...register('confirmPassword', {
                  validate: (value) => validators.match('Passwords', password)(value),
                })}
                error={errors.confirmPassword?.message}
                placeholder="Confirm your password"
              />

              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
              >
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Verification Code"
                icon={KeyIcon}
                {...register('otp', {
                  validate: validators.otp,
                })}
                error={errors.otp?.message}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />

              <Button
                type="submit"
                fullWidth
                loading={isSubmitting}
              >
                Verify Email
              </Button>

              <button
                type="button"
                onClick={resendOTP}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                disabled={isSubmitting || resendCooldown > 0}
              >
                {resendCooldown > 0 
                  ? `Resend verification code (${resendCooldown}s)` 
                  : 'Resend verification code'
                }
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2"
            >
              Sign in
            </Link>
          </div>

          {!showOTPVerification && (
            <button
              type="button"
              onClick={() => setUserType('')}
              className="w-full mt-4 text-sm text-gray-600 hover:text-gray-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2"
            >
              ← Choose different account type
            </button>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default Signup