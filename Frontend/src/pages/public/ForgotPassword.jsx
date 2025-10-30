import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { EnvelopeIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Input from '../../components/forms/Input'
import Button from '../../components/forms/Button'
import Card from '../../components/ui/Card'
import authService from '../../services/auth.service'
import { validators } from '../../utils/validators'

const ForgotPassword = () => {
  const [step, setStep] = useState('email') // email, otp, reset
  const [email, setEmail] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      if (step === 'email') {
        await authService.forgotPassword(data.email)
        setEmail(data.email)
        setStep('otp')
        toast.success('OTP sent to your email')
      } else if (step === 'otp') {
        // Verify OTP
        setStep('reset')
      } else if (step === 'reset') {
        await authService.resetPassword({
          email,
          otp: data.otp,
          newPassword: data.password,
        })
        toast.success('Password reset successfully!')
        // Redirect to login
        window.location.href = '/login'
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred')
    }
  }

  const resendOTP = async () => {
    try {
      await authService.resendOTP({
        email,
        type: 'password_reset',
      })
      toast.success('OTP resent successfully')
    } catch (error) {
      toast.error('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'email' && 'Forgot Password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset Password'}
            </h1>
            <p className="text-gray-600">
              {step === 'email' && 'Enter your email to receive a password reset OTP'}
              {step === 'otp' && `We've sent a verification code to ${email}`}
              {step === 'reset' && 'Create a new password for your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 'email' && (
              <Input
                label="Email Address"
                type="email"
                icon={EnvelopeIcon}
                {...register('email', {
                  validate: validators.email,
                })}
                error={errors.email?.message}
                placeholder="Enter your email"
              />
            )}

            {(step === 'otp' || step === 'reset') && (
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
            )}

            {step === 'reset' && (
              <>
                <Input
                  label="New Password"
                  type="password"
                  icon={LockClosedIcon}
                  {...register('password', {
                    validate: validators.password,
                  })}
                  error={errors.password?.message}
                  placeholder="Enter new password"
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={LockClosedIcon}
                  {...register('confirmPassword', {
                    validate: (value) => validators.match('Passwords', password)(value),
                  })}
                  error={errors.confirmPassword?.message}
                  placeholder="Confirm new password"
                />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
            >
              {step === 'email' && 'Send OTP'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset Password'}
            </Button>

            {step === 'otp' && (
              <button
                type="button"
                onClick={resendOTP}
                className="w-full text-sm text-primary-600 hover:text-primary-700"
              >
                Resend verification code
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default ForgotPassword