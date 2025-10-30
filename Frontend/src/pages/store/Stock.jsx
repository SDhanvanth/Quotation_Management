import { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  ArrowsRightLeftIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/forms/Button'
import Input from '../../components/forms/Input'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import { useApi } from '../../hooks/useApi'
import stockService from '../../services/stock.service'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const Stock = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  const { data: stockData, loading, execute: fetchStock } = useApi(
    () => stockService.getStockByStore(user?.Store?.store_id, { 
      search: searchTerm, 
      low_stock: showLowStock 
    }),
    false
  )

  useEffect(() => {
    if (user?.Store?.store_id) {
      fetchStock()
    }
  }, [searchTerm, showLowStock, user])

  const columns = [
    {
      key: 'item',
      label: 'Item',
      render: (_, stock) => (
        <div>
          <p className="font-medium">{stock.Item?.item_name}</p>
          <p className="text-sm text-gray-500">{stock.Item?.item_code}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, stock) => stock.Item?.Category?.category_name || '-',
          },
    {
      key: 'current_stock',
      label: 'Current Stock',
      sortable: true,
      render: (value, stock) => (
        <span className={value <= stock.min_stock_level ? 'text-red-600 font-medium' : ''}>
          {value} {stock.Item?.unit_of_measure}
        </span>
      ),
    },
    {
      key: 'available_stock',
      label: 'Available',
      render: (_, stock) => `${stock.available_stock} ${stock.Item?.unit_of_measure}`,
    },
    {
      key: 'reserved_stock',
      label: 'Reserved',
      render: (_, stock) => `${stock.reserved_stock} ${stock.Item?.unit_of_measure}`,
    },
    {
      key: 'min_stock_level',
      label: 'Min Level',
      render: (value, stock) => `${value || 0} ${stock.Item?.unit_of_measure}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, stock) => {
        if (stock.current_stock === 0) {
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>
        } else if (stock.current_stock <= stock.min_stock_level) {
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, stock) => (
        <Button
          size="sm"
          onClick={() => handleUpdateStock(stock)}
        >
          Update
        </Button>
      ),
    },
  ]

  const handleUpdateStock = (stock) => {
    setSelectedItem(stock)
    setShowUpdateModal(true)
  }

  const handleStockUpdate = async (data) => {
    try {
      await stockService.updateStock({
        store_id: user?.Store?.store_id,
        item_id: selectedItem.item_id,
        ...data,
      })
      toast.success('Stock updated successfully')
      setShowUpdateModal(false)
      fetchStock()
    } catch (error) {
      toast.error('Failed to update stock')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await stockService.exportStockReport({ 
        store_id: user?.Store?.store_id,
        format: 'csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Stock report exported successfully')
    } catch (error) {
      toast.error('Failed to export stock report')
    }
  }

  const lowStockCount = stockData?.stocks?.filter(s => s.current_stock <= s.min_stock_level).length || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Monitor and manage your inventory</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            icon={ArrowDownTrayIcon}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            icon={ArrowsRightLeftIcon}
          >
            Transfer Stock
          </Button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <Alert
          type="warning"
          title="Low Stock Alert"
          message={`${lowStockCount} items are running low on stock`}
          dismissible={false}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {stockData?.pagination?.total || 0}
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">
                {lowStockCount}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {stockData?.stocks?.filter(s => s.current_stock === 0).length || 0}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹0
              </p>
            </div>
            <CubeIcon className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show low stock only</span>
          </label>
        </div>

        <Table
          columns={columns}
          data={stockData?.stocks || []}
          loading={loading}
          emptyMessage="No stock data found"
        />
      </Card>

      {/* Update Stock Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Stock - ${selectedItem?.Item?.item_name}`}
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          handleStockUpdate({
            quantity: formData.get('quantity'),
            operation: formData.get('operation'),
          })
        }} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Current Stock: {selectedItem?.current_stock} {selectedItem?.Item?.unit_of_measure}</p>
            <p className="text-sm text-gray-600">Available: {selectedItem?.available_stock} {selectedItem?.Item?.unit_of_measure}</p>
          </div>
          
          <Select
            label="Operation"
            name="operation"
            options={[
              { value: 'add', label: 'Add Stock' },
              { value: 'subtract', label: 'Remove Stock' },
              { value: 'set', label: 'Set Stock Level' },
            ]}
            required
          />
          
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.01"
            required
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowUpdateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Stock