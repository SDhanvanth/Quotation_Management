import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AnimatePresence } from 'framer-motion'

// Public Pages
import Home from './pages/public/Home'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'
import ForgotPassword from './pages/public/ForgotPassword'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import AdminReports from './pages/admin/Reports'
import StoreManagement from './pages/admin/StoreManagement'
import RetailerManagement from './pages/admin/RetailerManagement'
import ItemManagement from './pages/admin/ItemManagement'
import CategoryManagement from './pages/admin/CategoryManagement'
import QuotationManagement from './pages/admin/QuotationManagement'

// Store Pages
import StoreDashboard from './pages/store/StoreDashboard'
import StoreSetup from './pages/store/StoreSetup'
import Quotations from './pages/store/Quotations'
import Stock from './pages/store/Stock'
import StoreProfile from './pages/store/StoreProfile'
import StockManagement from './pages/store/StockManagement'
import StockRequest from './pages/store/StockRequest'
import StoreReports from './pages/store/Reports'

// Retailer Pages
import RetailerDashboard from './pages/retailer/RetailerDashboard'
import RetailerSetup from './pages/retailer/RetailerSetup'
import QuotationList from './pages/retailer/QuotationList'
import QuotationResponse from './pages/retailer/QuotationResponse'
import RetailerProfile from './pages/retailer/RetailerProfile'

// Components
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  
  // Get the correct user type from the user object
  const getUserDashboardPath = () => {
    if (!user || !user.UserType) return '/'
    
    const userType = user.UserType.type_name
    
    // Check for first login
    if (user.first_login) {
      if (userType === 'store') return '/store/setup'
      if (userType === 'retailer') return '/retailer/setup'
    }
    
    switch (userType) {
      case 'admin':
        return '/admin'
      case 'store':
        return '/store'
      case 'retailer':
        return '/retailer'
      default:
        return '/'
    }
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to={getUserDashboardPath()} replace /> : <Home />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={getUserDashboardPath()} replace /> : <Login />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to={getUserDashboardPath()} replace /> : <Signup />
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="stores" element={<StoreManagement />} />
          <Route path="retailers" element={<RetailerManagement />} />
          <Route path="items" element={<ItemManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="quotations" element={<QuotationManagement />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Store First Login Setup - Outside Layout */}
        <Route path="/store/setup" element={
          <ProtectedRoute allowedRoles={['store']}>
            <StoreSetup />
          </ProtectedRoute>
        } />

        {/* Store Routes */}
        <Route path="/store" element={
          <ProtectedRoute allowedRoles={['store']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StoreDashboard />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="stock-request" element={<StockRequest />} />
          <Route path="reports" element={<StoreReports />} />
          <Route path="profile" element={<StoreProfile />} />
        </Route>

        {/* Retailer First Login Setup - Outside Layout */}
        <Route path="/retailer/setup" element={
          <ProtectedRoute allowedRoles={['retailer']}>
            <RetailerSetup />
          </ProtectedRoute>
        } />

        {/* Retailer Routes */}
        <Route path="/retailer" element={
          <ProtectedRoute allowedRoles={['retailer']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<RetailerDashboard />} />
          <Route path="quotations" element={<QuotationList />} />
          <Route path="quotations/:id/respond" element={<QuotationResponse />} />
          <Route path="responses" element={<QuotationResponse />} />
          <Route path="profile" element={<RetailerProfile />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App