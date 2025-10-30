import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/forms/Button'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import userService from '../../services/user.service'
import { formatDate, getUserTypeColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  
  const { data: users, loading, execute: fetchUsers } = useApi(
    () => userService.getUsers({ search: searchTerm, type_id: filterType }),
    false
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  // Refresh list every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const columns = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      render: (_, user) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserTypeColor(user.UserType?.type_name)}`}>
          {user.UserType?.type_name}
        </span>
      ),
    },
    {
      key: 'approval_status',
      label: 'Approval Status',
      render: (_, user) => {
        let className
        let status

        if (!user.email_verified) {
          className = 'bg-gray-100 text-gray-800'
          status = 'Email Unverified'
        } else if (!user.is_active) {
          className = 'bg-red-100 text-red-800'
          status = 'Rejected'
        } else if (user.is_approved) {
          className = 'bg-green-100 text-green-800'
          status = 'Approved'
        } else {
          className = 'bg-yellow-100 text-yellow-800'
          status = 'Pending Approval'
        }

        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
            {status}
          </span>
        )
      }
    },
    {
      key: 'first_login',
      label: 'Setup Status',
      render: (_, user) => {
        if (!user.is_approved) {
          return <span className="text-gray-400 text-xs">N/A</span>
        }
        
        const setupComplete = !user.first_login
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            setupComplete ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {setupComplete ? 'Completed' : 'Pending'}
          </span>
        )
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (isActive) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_on',
      label: 'Registered',
      sortable: true,
      render: (date) => formatDate(date),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => {
        // Show approve/reject buttons only for verified users pending approval
        if (!user.is_approved && user.is_active && user.email_verified) {
          return (
            <div className="flex space-x-2">
              <button
                onClick={() => handleApprove(user)}
                className="text-green-600 hover:text-green-900"
                title="Approve User"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleReject(user)}
                className="text-red-600 hover:text-red-900"
                title="Reject User"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          )
        }

        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(user)}
              className="text-blue-600 hover:text-blue-900"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            {user.is_approved && (
              <button
                onClick={() => handleEdit(user)}
                className="text-yellow-600 hover:text-yellow-900"
                title="Edit User"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => handleDelete(user)}
              className="text-red-600 hover:text-red-900"
              title="Delete User"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ]

  const handleView = (user) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    toast.info('Edit functionality coming soon')
    // Implement edit logic
  }

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      try {
        await userService.deleteUser(user.user_id)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete user')
      }
    }
  }

  const handleApprove = async (user) => {
    const userType = user.UserType?.type_name
    const confirmMessage = userType === 'store' || userType === 'retailer'
      ? `Approve "${user.username}"? They will complete their ${userType} details on first login.`
      : `Are you sure you want to approve "${user.username}"?`

    if (window.confirm(confirmMessage)) {
      try {
        // Just approve the user - no store creation here
        await userService.approveUser(user.user_id)
        toast.success(`User "${user.username}" approved successfully!`)
        fetchUsers()
      } catch (error) {
        console.error('Approval error:', error)
        toast.error(error.response?.data?.error || 'Failed to approve user')
      }
    }
  }

  const handleReject = async (user) => {
    const reason = window.prompt('Please provide a reason for rejection:')
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required')
      return
    }

    try {
      await userService.rejectUser(user.user_id, reason.trim())
      toast.success(`User "${user.username}" has been rejected`)
      fetchUsers()
    } catch (error) {
      console.error('Rejection error:', error)
      toast.error(error.response?.data?.error || 'Failed to reject user')
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const userTypeOptions = [
    { value: '', label: 'All Types' },
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Store' },
    { value: '3', label: 'Retailer' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their approval status</p>
        </div>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setTimeout(handleSearch, 100)
            }}
            options={userTypeOptions}
          />
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        <Table
          columns={columns}
          data={users?.users || []}
          loading={loading}
          emptyMessage="No users found"
        />

        {users?.pagination && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing {users.users.length} of {users.pagination.total} users
            </div>
            <div>
              Page {users.pagination.page} of {users.pagination.totalPages}
            </div>
          </div>
        )}
      </Card>

      {/* View User Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedUser(null)
        }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserTypeColor(selectedUser.UserType?.type_name)}`}>
                    {selectedUser.UserType?.type_name}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedUser.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.email_verified ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedUser.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedUser.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Setup Completed</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    !selectedUser.first_login ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {!selectedUser.first_login ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registered On</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_on)}</p>
              </div>
              {selectedUser.approved_on && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approved On</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.approved_on)}</p>
                </div>
              )}
              {selectedUser.rejection_reason && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                  <p className="mt-1 text-sm text-red-600">{selectedUser.rejection_reason}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedUser(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement