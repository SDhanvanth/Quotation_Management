// pages/admin/Reports.jsx
import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import reportService from '../../services/report.service';
import storeService from '../../services/store.service';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const [reportType, setReportType] = useState('quotations');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [stores, setStores] = useState([]);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    store_id: '',
    low_stock_only: false,
    is_active: '',
    is_verified: '',
    status_id: '',
    quotation_type: ''
  });

  const reportTypes = [
    { value: 'quotations', label: 'Quotations Report', icon: DocumentTextIcon },
    { value: 'stock', label: 'Stock Report', icon: CubeIcon },
    { value: 'items', label: 'Items Report', icon: ChartBarIcon },
    { value: 'stores', label: 'Stores Report', icon: BuildingStorefrontIcon },
    { value: 'retailers', label: 'Retailers Report', icon: UserGroupIcon }
  ];

  const quickDateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await storeService.getStores({ page: 1, limit: 100 });
      setStores(response.stores || response.data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'all':
        startDate = '';
        endDate = '';
        break;
      default:
        return;
    }

    setFilters({ ...filters, startDate, endDate });
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      let response;

      switch (reportType) {
        case 'stock':
          response = await reportService.getStockReport(filters);
          break;
        case 'items':
          response = await reportService.getItemReport(filters);
          break;
        case 'stores':
          response = await reportService.getStoreReport(filters);
          break;
        case 'retailers':
          response = await reportService.getRetailerReport(filters);
          break;
        case 'quotations':
          response = await reportService.getQuotationReport(filters);
          break;
        default:
          toast.error('Please select a valid report type');
          return;
      }

      setReportData(response);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      switch (reportType) {
        case 'stock':
          await reportService.exportStockReport(filters);
          break;
        case 'items':
          await reportService.exportItemReport(filters);
          break;
        case 'stores':
          await reportService.exportStoreReport(filters);
          break;
        case 'retailers':
          await reportService.exportRetailerReport(filters);
          break;
        case 'quotations':
          await reportService.exportQuotationReport(filters);
          break;
        default:
          toast.error('Please select a valid report type');
          return;
      }

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate comprehensive system reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
          
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  reportType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <type.icon className={`h-8 w-8 ${reportType === type.value ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm text-center ${reportType === type.value ? 'text-blue-900' : 'text-gray-700'}`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {quickDateRanges.map((range) => (
                <Button
                  key={range.value}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDateRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            
            {/* Store Filter for Stock Reports */}
            {reportType === 'stock' && (
              <Select
                label="Store (Optional)"
                value={filters.store_id}
                onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </option>
                ))}
              </Select>
            )}

            {/* Quotation Type Filter */}
            {reportType === 'quotations' && (
              <Select
                label="Quotation Type (Optional)"
                value={filters.quotation_type}
                onChange={(e) => setFilters({ ...filters, quotation_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="regular">Regular</option>
                <option value="stock_request">Stock Request</option>
              </Select>
            )}

            {/* Store Active Filter */}
            {reportType === 'stores' && (
              <Select
                label="Status (Optional)"
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              >
                <option value="">All Stores</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            )}

            {/* Retailer Verified Filter */}
            {reportType === 'retailers' && (
              <Select
                label="Verification (Optional)"
                value={filters.is_verified}
                onChange={(e) => setFilters({ ...filters, is_verified: e.target.value })}
              >
                <option value="">All Retailers</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </Select>
            )}
          </div>

          {/* Additional Options */}
          {reportType === 'stock' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="low_stock_only"
                checked={filters.low_stock_only}
                onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="low_stock_only" className="text-sm font-medium text-gray-700">
                Show only low stock items
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting || !reportData}
              className="flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {reportTypes.find(r => r.value === reportType)?.label}
              </h2>
              <span className="text-sm text-gray-600">
                Total Records: <span className="font-semibold">{reportData.count}</span>
              </span>
            </div>

            {/* Stores Report Summary */}
            {reportType === 'stores' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Stores</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-red-900">
                    {reportData.data.filter(s => !s.is_active).length}
                  </p>
                </div>
              </div>
            )}

            {/* Retailers Report Summary */}
            {reportType === 'retailers' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Retailers</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Verified</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(r => r.is_verified).length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Unverified</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.data.filter(r => !r.is_verified).length}
                  </p>
                </div>
              </div>
            )}

            {/* Summary Cards for other reports */}
            {reportType === 'quotations' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Published</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'published').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Awarded</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'awarded').length}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.data.filter(q => q.QuotationStatus?.status_name === 'closed').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Responses</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.data.reduce((sum, q) => sum + (q.RetailerQuotations?.length || 0), 0)}
                  </p>
                </div>
              </div>
            )}

            {reportType === 'stock' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-red-900">
                    {reportData.data.filter(s => s.current_stock <= s.minimum_stock && s.minimum_stock > 0).length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Stock</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.reduce((sum, s) => sum + s.current_stock, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Reserved</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {reportData.data.reduce((sum, s) => sum + s.reserved_stock, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Available</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportData.data.reduce((sum, s) => sum + (s.current_stock - s.reserved_stock), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {reportType === 'items' && reportData.data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.data.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportData.data.filter(i => i.is_active).length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-red-900">
                    {reportData.data.filter(i => !i.is_active).length}
                  </p>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <p className="text-sm text-gray-600 mb-2">Preview (First 10 records)</p>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {reportType === 'stores' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created On</th>
                      </>
                    )}
                    {reportType === 'retailers' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Number</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created On</th>
                      </>
                    )}
                    {reportType === 'quotations' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quotation No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Responses</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </>
                    )}
                    {reportType === 'stock' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </>
                    )}
                    {reportType === 'items' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportType === 'stores' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.store_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.contact_person || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.contact_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {reportType === 'retailers' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.company_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.contact_person || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.contact_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.gst_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {reportType === 'quotations' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.quotation_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.quotation_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {item.quotation_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {item.QuotationItems?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {item.RetailerQuotations?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.QuotationStatus?.status_name === 'published' ? 'bg-blue-100 text-blue-800' :
                                                    item.QuotationStatus?.status_name === 'awarded' ? 'bg-green-100 text-green-800' :
                          item.QuotationStatus?.status_name === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.QuotationStatus?.status_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.created_on).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {reportType === 'stock' && reportData.data?.slice(0, 10).map((item, index) => {
                    const available = item.current_stock - item.reserved_stock;
                    const isLowStock = item.current_stock <= item.minimum_stock && item.minimum_stock > 0;
                    
                    return (
                      <tr key={index} className={isLowStock ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.Store?.store_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.Item?.item_code || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.Item?.item_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.current_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {item.reserved_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {reportType === 'items' && reportData.data?.slice(0, 10).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.item_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.Category?.category_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ₹{item.price?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.data && reportData.data.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing first 10 of {reportData.data.length} records. 
                  <span className="font-medium text-blue-600"> Export to Excel to view all data.</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <Card>
          <div className="p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-600 mb-4">
              Select a report type, configure filters, and click "Generate Report" to view data
            </p>
            <Button onClick={fetchReport} disabled={loading}>
              Generate Your First Report
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminReports; 