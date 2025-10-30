import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  LockClosedIcon, 
  ArrowRightIcon,
  KeyIcon 
} from '@heroicons/react/24/outline'
import Input from '../../components/forms/Input'
import Button from '../../components/forms/Button'
import Card from '../../components/ui/Card'
import authService from '../../services/auth.service'
import { loginSuccess } from '../../store/authSlice'
import { validators } from '../../utils/validators'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isOTPLogin, setIsOTPLogin] = useState(false)
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [email, setEmail] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm()

  const onSubmit = async (data) => {
    try {
      if (isOTPLogin) {
        if (!showOTPInput) {
          // Request OTP
          const response = await authService.loginWithOTP(data.username)
          setEmail(response.email)
          setShowOTPInput(true)
          toast.success('OTP sent to your registered email')
        } else {
          // Verify OTP
          const response = await authService.verifyLoginOTP({
            username: data.username,
            otp: data.otp,
          })
          handleLoginSuccess(response)
        }
      } else {
        // Regular login
        const response = await authService.login({
          username: data.username,
          password: data.password,
        })
        handleLoginSuccess(response)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    }
  }

  const handleLoginSuccess = (response) => {
  console.log('Login response:', response);
  console.log('User type:', response.user?.UserType?.type_name);
  console.log('First login:', response.firstLogin);
  
  dispatch(loginSuccess(response))
  
  // Store token in localStorage for persistence
  localStorage.setItem('token', response.token)
  localStorage.setItem('refreshToken', response.refreshToken)
  localStorage.setItem('user', JSON.stringify(response.user))
  
  toast.success('Login successful!')
  
  // Check if first login
  if (response.firstLogin) {
    const userType = response.user?.UserType?.type_name
    if (userType === 'store') {
      navigate('/store/setup', { replace: true })
      return
    } else if (userType === 'retailer') {
      navigate('/retailer/setup', { replace: true })
      return
    }
  }
  
  // Navigate based on user type for non-first login
  const userType = response.user?.UserType?.type_name
  switch (userType) {
    case 'admin':
      navigate('/admin', { replace: true })
      break
    case 'store':
      navigate('/store', { replace: true })
      break
    case 'retailer':
      navigate('/retailer', { replace: true })
      break
    default:
      console.error('Unknown user type:', userType)
      navigate('/', { replace: true })
  }
}

  const toggleLoginMethod = () => {
    setIsOTPLogin(!isOTPLogin)
    setShowOTPInput(false)
    reset()
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Username"
              icon={UserIcon}
              {...register('username', {
                validate: validators.username,
              })}
              error={errors.username?.message}
              placeholder="Enter your username"
            />

            {!isOTPLogin && (
              <Input
                label="Password"
                type="password"
                icon={LockClosedIcon}
                {...register('password', {
                  validate: validators.password,
                })}
                error={errors.password?.message}
                placeholder="Enter your password"
              />
            )}

            {isOTPLogin && showOTPInput && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  OTP sent to: <span className="font-medium">{email}</span>
                </p>
                <Input
                  label="Enter OTP"
                  icon={KeyIcon}
                  {...register('otp', {
                    validate: validators.otp,
                  })}
                  error={errors.otp?.message}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              icon={ArrowRightIcon}
              iconPosition="right"
            >
              {isOTPLogin && !showOTPInput ? 'Send OTP' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={toggleLoginMethod}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2"
            >
              {isOTPLogin ? 'Login with Password' : 'Login with OTP'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2"
              >
                Forgot password?
              </Link>
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium underline decoration-1 underline-offset-2 transition-colors duration-200 hover:decoration-2"
              >
                Create account
              </Link>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Link to="/" className="text-gray-600 hover:text-gray-700 underline decoration-1 underline-offset-2">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Login