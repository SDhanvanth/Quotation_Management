import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth)

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated)
  console.log('ProtectedRoute - user:', user)
  console.log('ProtectedRoute - userType:', user?.UserType?.type_name)
  console.log('ProtectedRoute - firstLogin:', user?.first_login)
  console.log('ProtectedRoute - allowedRoles:', allowedRoles)

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userType = user?.UserType?.type_name
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
    console.error('Access denied - userType:', userType, 'allowedRoles:', allowedRoles)
    return <Navigate to="/" replace />
  }

  // Check if user needs to complete first login setup
  // Allow access to setup pages even on first login
  const isSetupPage = location.pathname.includes('/setup')
  
  if (user?.first_login && !isSetupPage) {
    if (userType === 'store') {
      return <Navigate to="/store/setup" replace />
    } else if (userType === 'retailer') {
      return <Navigate to="/retailer/setup" replace />
    }
  }

  // Prevent access to setup pages if not first login
  if (!user?.first_login && isSetupPage) {
    if (userType === 'store') {
      return <Navigate to="/store" replace />
    } else if (userType === 'retailer') {
      return <Navigate to="/retailer" replace />
    }
  }

  return children
}

export default ProtectedRoute