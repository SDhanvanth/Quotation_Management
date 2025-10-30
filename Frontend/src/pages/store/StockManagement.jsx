import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/ui/Modal';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import stockService from '../../services/stock.service';
import { itemService } from '../../services/item.service';
import toast from 'react-hot-toast';

const StockManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [formData, setFormData] = useState({
    item_id: '',
    current_stock: '',
    min_stock_level: ''
  });

  const columns = [
    {
      key: 'item_code',
      label: 'Item Code',
      sortable: true,
      render: (value, row) => row.Item?.item_code || value || '-'
    },
    {
      key: 'item_name',
      label: 'Item Name',
      sortable: true,
      render: (value, row) => row.Item?.item_name || value || '-'
    },
    {
      key: 'current_stock',
      label: 'Current Stock',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${value <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {value || 0}
        </span>
      )
    },
    {
      key: 'reserved_stock',
      label: 'Reserved',
      sortable: true,
      render: (value) => value || 0
    },
    {
      key: 'available_stock',
      label: 'Available',
      sortable: true,
      render: (value, row) => {
        const available = (row.current_stock || 0) - (row.reserved_stock || 0);
        return (
          <span className={`font-medium ${available <= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {available}
          </span>
        );
      }
    },
    {
      key: 'min_stock_level',
      label: 'Min. Stock',
      sortable: true,
      render: (value, row) => {
        // Check both possible field names
        const minStock = value || row.minimum_stock || 0;
        return minStock;
      }
    },
    {
      key: 'unit_of_measure',
      label: 'Unit',
      sortable: false,
      render: (value, row) => row.Item?.unit_of_measure || value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => {
        const currentStock = row.current_stock || 0;
        // Check both possible field names
        const minStock = row.min_stock_level || row.minimum_stock || 0;
        const isLowStock = currentStock <= minStock && minStock > 0;

        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {isLowStock ? 'Low Stock' : 'In Stock'}
          </span>
        );
      }
    },
    { 
      key: 'actions', 
      label: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="Update Stock"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    // Get store ID from user
    const userStoreId = user?.Store?.store_id;

    console.log('User data:', user);
    console.log('Store ID:', userStoreId);

    if (!userStoreId) {
      setLoading(false);
      toast.error('Store information not found. Please complete your store setup.');
      return;
    }

    setStoreId(userStoreId);
    fetchStock(userStoreId);
    fetchItems();
  }, [user]);

  const fetchStock = async (storeIdParam) => {
    try {
      setLoading(true);
      console.log('Fetching stock for store:', storeIdParam);

      const response = await stockService.getStockByStore(storeIdParam);
      console.log('Raw stock response:', response);
      
      // ✅ Handle different response formats - check all possible data locations
      let stockData = [];
      
      if (response.stocks && Array.isArray(response.stocks)) {
        stockData = response.stocks;
      } else if (response.stock && Array.isArray(response.stock)) {
        stockData = response.stock;
      } else if (response.data && Array.isArray(response.data)) {
        stockData = response.data;
      } else if (Array.isArray(response)) {
        stockData = response;
      }
      
      console.log('Processed stock data:', stockData);
      console.log('Stock data length:', stockData.length);
      
      // Ensure each stock item has the necessary fields
      const normalizedStock = stockData.map(item => ({
        ...item,
        // Normalize field names
        min_stock_level: item.min_stock_level || item.minimum_stock || 0,
        current_stock: item.current_stock || 0,
        reserved_stock: item.reserved_stock || 0
      }));
      
      console.log('Normalized stock data:', normalizedStock);
      setStock(normalizedStock);
    } catch (error) {
      console.error('Error fetching stock:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.error || 'Failed to fetch stock data');
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      console.log('Fetching items...');

      const response = await itemService.getItems({ page: 1, limit: 100 });
      console.log('Items response:', response);
      
      // Handle different response formats
      const itemsData = response.items || response.data || [];
      console.log('Items data:', itemsData);
      
      const activeItems = Array.isArray(itemsData) 
        ? itemsData.filter(item => item.is_active) 
        : [];
      
      console.log('Active items:', activeItems);
      setItems(activeItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      console.error('Error response:', error.response?.data);
      setItems([]);
    }
  };

  const handleAdd = () => {
    if (items.length === 0) {
      toast.error('No items available. Please add items first from Item Management.');
      return;
    }

    setFormData({
      item_id: '',
      current_stock: '',
      min_stock_level: ''
    });
    setSelectedStock(null);
    setAddModalOpen(true);
  };

  const handleEdit = (stockItem) => {
    console.log('Editing stock item:', stockItem);
    setSelectedStock(stockItem);
    setFormData({
      item_id: stockItem.item_id?.toString() || '',
      current_stock: stockItem.current_stock?.toString() || '0',
      min_stock_level: (stockItem.min_stock_level || stockItem.minimum_stock || 0).toString()
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId) {
      toast.error('Store ID not found');
      return;
    }

    try {
      setSubmitting(true);

      const stockData = {
        store_id: storeId,
        item_id: parseInt(formData.item_id),
        current_stock: parseFloat(formData.current_stock) || 0,
        minimum_stock: parseFloat(formData.min_stock_level) || 0,
        operation: 'set'
      };

      console.log('Submitting stock data:', stockData);

      if (selectedStock) {
        // Update existing stock
        await stockService.bulkUpdateStock({
          updates: [stockData]
        });
        toast.success('Stock updated successfully');
      } else {
        // Add new stock - check if item already exists in stock
        const existingStock = stock.find(s => s.item_id === parseInt(formData.item_id));
        
        if (existingStock) {
          toast.error('This item already exists in stock. Please update the existing entry.');
          setSubmitting(false);
          return;
        }

        await stockService.bulkUpdateStock({
          updates: [stockData]
        });
        toast.success('Stock added successfully');
      }

      // Close modals and refresh
      setAddModalOpen(false);
      setEditModalOpen(false);
      setSelectedStock(null);
      setFormData({
        item_id: '',
        current_stock: '',
        min_stock_level: ''
      });

      // ✅ Add a small delay before fetching to ensure backend has processed
      setTimeout(() => {
        fetchStock(storeId);
      }, 500);
      
    } catch (error) {
      console.error('Error saving stock:', error);
      console.error('Error response:', error.response);

      // Show specific validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save stock');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter stock based on search
  const filteredStock = stock.filter(item => {
    if (!search) return true;

    const searchLower = search.toLowerCase();
    const itemName = item.Item?.item_name?.toLowerCase() || item.item_name?.toLowerCase() || '';
    const itemCode = item.Item?.item_code?.toLowerCase() || item.item_code?.toLowerCase() || '';
    const categoryName = item.Item?.Category?.category_name?.toLowerCase() || '';

    return itemName.includes(searchLower) || 
           itemCode.includes(searchLower) ||
           categoryName.includes(searchLower);
  });

  if (!storeId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Store Information Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your store setup first</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/store/setup'}
          >
            Complete Store Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Store: {user?.Store?.store_name || 'N/A'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleAdd}
          className="flex items-center"
          disabled={items.length === 0}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Stock Item
        </Button>
      </div>

      {items.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-medium">No items available</p>
          <p className="text-sm">Please add items from Item Management before managing stock.</p>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="text-sm text-gray-600">
              {!loading && (
                <span>
                  Showing {filteredStock.length} of {stock.length} items
                </span>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredStock}
            loading={loading}
            sortable={true}
            emptyMessage={search ? "No stock items found matching your search" : "No stock items. Click 'Add Stock Item' to get started."}
          />
        </div>
      </Card>

      {/* Add/Edit Stock Modal */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setSelectedStock(null);
          setFormData({
            item_id: '',
            current_stock: '',
            min_stock_level: ''
          });
        }}
        title={selectedStock ? 'Update Stock' : 'Add Stock Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item *
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.item_id}
              onChange={(e) => setFormData({
                ...formData,
                item_id: e.target.value
              })}
              required
              disabled={!!selectedStock}
            >
              <option value="">Select Item</option>
              {items.map(item => (
                <option key={item.item_id} value={item.item_id}>
                  {item.item_name} ({item.item_code})
                </option>
              ))}
            </select>
            {items.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No active items available. Please add items first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.current_stock}
              onChange={(e) => setFormData({
                ...formData,
                current_stock: e.target.value
              })}
              required
              placeholder="Enter current stock quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stock Level *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.min_stock_level}
              onChange={(e) => setFormData({
                ...formData,
                min_stock_level: e.target.value
              })}
              required
              placeholder="Enter minimum stock threshold"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be notified when stock falls below this level
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddModalOpen(false);
                setEditModalOpen(false);
                setSelectedStock(null);
                setFormData({
                  item_id: '',
                  current_stock: '',
                  min_stock_level: ''
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || items.length === 0}
            >
              {submitting ? 'Saving...' : (selectedStock ? 'Update Stock' : 'Add Stock')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StockManagement;