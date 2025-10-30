import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout as logoutAction } from '../store/authSlice'
import authService from '../services/auth.service'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth)

  const logout = async () => {
    try {
      await authService.logout()
      dispatch(logoutAction())
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    userType: user?.UserType?.type_name,
    userId: user?.user_id,
  }
}