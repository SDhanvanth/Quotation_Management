// pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardNotificationList from '../../components/admin/DashboardNotificationList'
import {
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card' 
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuotations: 0,
    totalActiveRetailers: 0,
    activeStores: 0,
  })

  const [systemHealth, setSystemHealth] = useState({
    serverStatus: { percentage: 0, status: 'checking' },
    database: { percentage: 0, status: 'checking' },
    apiResponse: { percentage: 0, status: 'checking' },
  })

  useEffect(() => {
    fetchDashboardStats()
    checkSystemHealth()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let totalUsers = 0
      let totalQuotations = 0
      let totalActiveRetailers = 0
      let activeStores = 0

      // Fetch total users
      try {
        const usersRes = await api.get('/users', { params: { limit: 1000 } })
        totalUsers = usersRes.data?.pagination?.total || usersRes.data?.data?.length || 0
      } catch (err) {
        console.warn('Error fetching users:', err.message)
      }

      // Fetch total quotations
      try {
        const quotationsRes = await api.get('/quotations', { params: { page: 1, limit: 10 } })
        totalQuotations = quotationsRes.data?.pagination?.total || 0
      } catch (err) {
        console.warn('Error fetching quotations:', err.message)
      }

      // Fetch total active retailers
      try {
        const retailersRes = await api.get('/retailers', { params: { is_active: true, limit: 1000 } })
        totalActiveRetailers = retailersRes.data?.pagination?.total || retailersRes.data?.data?.length || 0
      } catch (err) {
        console.warn('Error fetching retailers:', err.message)
      }

      // Fetch active stores
      try {
        const storesRes = await api.get('/stores', { params: { limit: 1000 } })
        activeStores = storesRes.data?.pagination?.total || storesRes.data?.data?.length || 0
      } catch (err) {
        console.warn('Error fetching stores:', err.message)
      }

      setStats({
        totalUsers,
        totalQuotations,
        totalActiveRetailers,
        activeStores,
      })

    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load some dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const checkSystemHealth = async () => {
    try {
      // Check server health - API response time
      const startTime = Date.now()
      await api.get('/users', { params: { limit: 1 } })
      const responseTime = Date.now() - startTime
      
      // Calculate server status percentage (lower response time = higher percentage)
      const serverPercentage = Math.min(100, Math.max(0, 100 - (responseTime / 10)))
      const serverStatus = serverPercentage > 80 ? 'Operational' : serverPercentage > 50 ? 'Degraded' : 'Down'

      setSystemHealth(prev => ({
        ...prev,
        serverStatus: { 
          percentage: Math.round(serverPercentage), 
          status: serverStatus,
          color: serverPercentage > 80 ? 'green' : serverPercentage > 50 ? 'yellow' : 'red'
        }
      }))

      // Check database health
      try {
        const dbStartTime = Date.now()
        await api.get('/quotations', { params: { page: 1, limit: 1 } })
        const dbResponseTime = Date.now() - dbStartTime
        
        const dbPercentage = Math.min(100, Math.max(0, 100 - (dbResponseTime / 15)))
        const dbStatus = dbPercentage > 80 ? 'Healthy' : dbPercentage > 50 ? 'Slow' : 'Unhealthy'

        setSystemHealth(prev => ({
          ...prev,
          database: { 
            percentage: Math.round(dbPercentage), 
            status: dbStatus,
            color: dbPercentage > 80 ? 'green' : dbPercentage > 50 ? 'yellow' : 'red'
          }
        }))
      } catch (err) {
        setSystemHealth(prev => ({
          ...prev,
          database: { 
            percentage: 0, 
            status: 'Unhealthy',
            color: 'red'
          }
        }))
      }

      // Check API response (general API health)
      try {
        const apiStartTime = Date.now()
        await api.get('/stores', { params: { limit: 1 } })
        const apiResponseTime = Date.now() - apiStartTime
        
        const apiPercentage = Math.min(100, Math.max(0, 100 - (apiResponseTime / 12)))
        const apiStatus = apiPercentage > 80 ? 'Fast' : apiPercentage > 50 ? 'Moderate' : 'Slow'

        setSystemHealth(prev => ({
          ...prev,
          apiResponse: { 
            percentage: Math.round(apiPercentage), 
            status: apiStatus,
            color: apiPercentage > 80 ? 'green' : apiPercentage > 50 ? 'yellow' : 'red'
          }
        }))
      } catch (err) {
        setSystemHealth(prev => ({
          ...prev,
          apiResponse: { 
            percentage: 0, 
            status: 'Slow',
            color: 'red'
          }
        }))
      }

    } catch (err) {
      console.error('Error checking system health:', err)
    }
  }

  const getStatusColor = (status, color) => {
    if (color === 'green') return 'text-green-700'
    if (color === 'yellow') return 'text-yellow-700'
    if (color === 'red') return 'text-red-700'
    return 'text-gray-700'
  }

  const getStatusBgColor = (color) => {
    if (color === 'green') return 'bg-green-100'
    if (color === 'yellow') return 'bg-yellow-100'
    if (color === 'red') return 'bg-red-100'
    return 'bg-gray-100'
  }

  const getBarColor = (color) => {
    if (color === 'green') return 'bg-green-500'
    if (color === 'yellow') return 'bg-yellow-500'
    if (color === 'red') return 'bg-red-500'
    return 'bg-gray-500'
  }

  const getStatusDotColor = (color) => {
    if (color === 'green') return 'bg-green-500'
    if (color === 'yellow') return 'bg-yellow-500'
    if (color === 'red') return 'bg-red-500'
    return 'bg-gray-500'
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Total Quotations',
      value: stats.totalQuotations.toLocaleString(),
      icon: DocumentTextIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Active Retailers',
      value: stats.totalActiveRetailers,
      icon: ShoppingBagIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Active Stores',
      value: stats.activeStores,
      icon: ChartBarIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen"> 
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your system overview.</p>
        {error && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start">
            <span className="mr-2">⚠️</span>
            <div>
              <p className="font-semibold">{error}</p>
              <button 
                onClick={fetchDashboardStats}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
              >
                Retry Loading Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
          >
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border border-dashed ${stat.bgColor} border-current`}> 
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xl border border-gray-100"> 
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3"> 
            Quotation Trends 📈
          </h2>
          <div className="h-72 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4"> 
            Chart placeholder - Integrate with Recharts (e.g., Line and Bar charts)
          </div>
        </Card>

        {/* Notifications */}
        <div>
          <DashboardNotificationList /> 
        </div>
      </div>

      {/* System Health - Dynamic */}
      <Card className="shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
          System Health ⚙️
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Server Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Server Status</span>
              <span className={`text-sm font-semibold ${getStatusColor(systemHealth.serverStatus.status, systemHealth.serverStatus.color)} flex items-center`}>
                <span className={`h-2 w-2 ${getStatusDotColor(systemHealth.serverStatus.color)} rounded-full mr-1.5 ${systemHealth.serverStatus.percentage > 80 ? 'animate-pulse' : ''}`}></span>
                {systemHealth.serverStatus.status}
              </span> 
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5"> 
              <div 
                className={`h-1.5 rounded-full shadow-md transition-all duration-500 ${getBarColor(systemHealth.serverStatus.color)}`} 
                style={{ width: `${systemHealth.serverStatus.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{systemHealth.serverStatus.percentage}% healthy</p>
          </div>

          {/* Database */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Database</span>
              <span className={`text-sm font-semibold ${getStatusColor(systemHealth.database.status, systemHealth.database.color)} flex items-center`}>
                <span className={`h-2 w-2 ${getStatusDotColor(systemHealth.database.color)} rounded-full mr-1.5 ${systemHealth.database.percentage > 80 ? 'animate-pulse' : ''}`}></span>
                {systemHealth.database.status}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full shadow-md transition-all duration-500 ${getBarColor(systemHealth.database.color)}`}
                style={{ width: `${systemHealth.database.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{systemHealth.database.percentage}% healthy</p>
          </div>

          {/* API Response */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">API Response</span>
              <span className={`text-sm font-semibold ${getStatusColor(systemHealth.apiResponse.status, systemHealth.apiResponse.color)} flex items-center`}>
                <span className={`h-2 w-2 ${getStatusDotColor(systemHealth.apiResponse.color)} rounded-full mr-1.5 ${systemHealth.apiResponse.percentage > 80 ? 'animate-pulse' : ''}`}></span>
                {systemHealth.apiResponse.status}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full shadow-md transition-all duration-500 ${getBarColor(systemHealth.apiResponse.color)}`}
                style={{ width: `${systemHealth.apiResponse.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{systemHealth.apiResponse.percentage}% healthy</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboard