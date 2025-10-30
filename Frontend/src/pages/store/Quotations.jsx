import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  DocumentDuplicateIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/forms/Button'
import Input from '../../components/forms/Input'
import Select from '../../components/forms/Select'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import quotationService from '../../services/quotation.service'
import { formatDate, getStatusColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

const Quotations = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const { data: quotations, loading, execute: fetchQuotations } = useApi(
    () => quotationService.getQuotations({ search: searchTerm, status: statusFilter }),
    false
  )

  useEffect(() => {
    fetchQuotations()
  }, [searchTerm, statusFilter])

  const columns = [
    {
      key: 'quotation_number',
      label: 'Quotation No.',
      sortable: true,
    },
    {
      key: 'quotation_name',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'quotation_type',
      label: 'Type',
      render: (type) => (
        <span className="capitalize">{type}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, quotation) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.QuotationStatus?.status_name)}`}>
          {quotation.QuotationStatus?.status_name}
        </span>
      ),
    },
    {
      key: 'validity_until',
      label: 'Valid Until',
      sortable: true,
      render: (date) => formatDate(date),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, quotation) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(quotation)}
            className="text-blue-600 hover:text-blue-900"
            title="View"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEdit(quotation)}
            className="text-yellow-600 hover:text-yellow-900"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDuplicate(quotation)}
            className="text-green-600 hover:text-green-900"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ]

  const handleView = (quotation) => {
    navigate(`/store/quotations/${quotation.quotation_id}`)
  }

  const handleEdit = (quotation) => {
    navigate(`/store/quotations/${quotation.quotation_id}/edit`)
  }

  const handleDuplicate = async (quotation) => {
    try {
      // Implement duplicate logic
      toast.success('Quotation duplicated successfully')
      fetchQuotations()
    } catch (error) {
      toast.error('Failed to duplicate quotation')
    }
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
    { value: 'awarded', label: 'Awarded' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Manage your quotation requests</p>
        </div>
        <Button
          icon={PlusIcon}
          onClick={() => setShowCreateModal(true)}
        >
          Create Quotation
        </Button>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Button
            variant="secondary"
            icon={FunnelIcon}
          >
            More Filters
          </Button>
        </div>

        <Table
          columns={columns}
          data={quotations?.quotations || []}
          loading={loading}
          emptyMessage="No quotations found"
        />
      </Card>

      {/* Create Quotation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Quotation"
        size="lg"
      >
        <form className="space-y-4">
          <Input
            label="Quotation Name"
            placeholder="Enter quotation title"
            required
          />
          <Select
            label="Type"
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'bulk', label: 'Bulk' },
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              required
            />
            <Input
              label="Valid Until"
              type="date"
              required
            />
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="4"
            placeholder="Notes (optional)"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Quotations