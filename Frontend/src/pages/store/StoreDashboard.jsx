import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const StoreDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuotations: 0,
    activeQuotations: 0,
        lowStockItems: 0,
    totalItems: 0,
  })

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalQuotations: 45,
        activeQuotations: 12,
        lowStockItems: 8,
        totalItems: 156,
      })
      setLoading(false)
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Total Quotations',
      value: stats.totalQuotations,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Quotations',
      value: stats.activeQuotations,
      icon: ArrowTrendingUpIcon,
      color: 'bg-green-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: CubeIcon,
      color: 'bg-yellow-500',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      trend: '+8%',
      trendUp: true,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span
                      className={`text-sm font-medium ${
                        stat.trendUp ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-8 w-8 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Quotations
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">QT-2024-00{item}</p>
                  <p className="text-sm text-gray-600">Created 2 hours ago</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Low Stock Alerts
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Item Name {item}</p>
                  <p className="text-sm text-gray-600">Current Stock: 5 units</p>
                </div>
                <button className="text-sm font-medium text-red-600 hover:text-red-700">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default StoreDashboard