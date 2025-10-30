import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/helpers'

const RetailerDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuotations: 0,
    pendingResponses: 0,
    submittedQuotations: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalQuotations: 28,
        pendingResponses: 5,
        submittedQuotations: 23,
        totalRevenue: 450000,
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
    },
    {
      title: 'Pending Responses',
      value: stats.pendingResponses,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Submitted',
      value: stats.submittedQuotations,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: CurrencyRupeeIcon,
      color: 'bg-purple-500',
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
        <h1 className="text-2xl font-bold text-gray-900">Retailer Dashboard</h1>
        <p className="text-gray-600">Track your quotations and responses.</p>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-8 w-8 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Quotations */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Quotations Requiring Response
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((item) => (
                <tr key={item}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    QT-2024-00{item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Office Supplies Q1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2024-02-15
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900">
                      Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default RetailerDashboard