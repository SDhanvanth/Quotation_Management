// src/pages/retailer/QuotationList.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  EyeIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import quotationService from '../../services/quotation.service';
import toast from 'react-hot-toast';

const QuotationList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // ✅ Start with empty string
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      key: 'QuotationItems',
      label: 'Items',
      render: (items) => `${items?.length || 0} items`,
    },
    {
      key: 'validity_until',
      label: 'Deadline',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'response_status',
      label: 'My Response',
      render: (_, quotation) => {
        const retailerId = user?.RetailerDetails?.retailer_id || user?.RetailerDetail?.retailer_id;
        const myResponse = quotation.RetailerQuotations?.find(
          rq => rq.retailer_id === retailerId
        );
        
        if (myResponse) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Submitted
            </span>
          );
        }
        
        const isExpired = new Date() > new Date(quotation.validity_until);
        if (isExpired) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              Expired
            </span>
          );
        }
        
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      },
    },
    {
      key: 'QuotationStatus',
      label: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status?.status_name)}`}>
          {status?.status_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, quotation) => {
        const retailerId = user?.RetailerDetails?.retailer_id || user?.RetailerDetail?.retailer_id;
        const myResponse = quotation.RetailerQuotations?.find(
          rq => rq.retailer_id === retailerId
        );
        const isExpired = new Date() > new Date(quotation.validity_until);
        const canRespond = quotation.QuotationStatus?.status_name === 'published' && !myResponse && !isExpired;

        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(quotation)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            {canRespond && (
              <Button
                size="sm"
                onClick={() => handleRespond(quotation)}
                className="flex items-center"
              >
                <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                Respond
              </Button>
            )}
            {myResponse && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleViewResponse(quotation)}
              >
                View Response
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchQuotations();
  }, [page, searchTerm, statusFilter]);

  // ✅ FIXED - fetchQuotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      
      // Build clean params
      const params = {
        page,
        limit: 10
      };
      
      // Only add if not empty
      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await quotationService.getQuotations(params);
      setQuotations(response.quotations || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      
      if (error.response?.status === 400) {
        toast.error('Invalid request parameters');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error('Failed to fetch quotations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = (quotation) => {
    navigate(`/retailer/quotations/${quotation.quotation_id}`);
  };

  const handleRespond = (quotation) => {
    navigate(`/retailer/quotations/${quotation.quotation_id}/respond`);
  };

  const handleViewResponse = (quotation) => {
    navigate(`/retailer/quotations/${quotation.quotation_id}/respond`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'awarded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: '', label: 'All Quotations' },
    { value: 'published', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'awarded', label: 'Awarded' },
  ];

  // Calculate stats
  const retailerId = user?.RetailerDetails?.retailer_id || user?.RetailerDetail?.retailer_id;
  const totalQuotations = quotations.length;
  const pendingResponse = quotations.filter(q => {
    const myResponse = q.RetailerQuotations?.find(
      rq => rq.retailer_id === retailerId
    );
    const isExpired = new Date() > new Date(q.validity_until);
    return q.QuotationStatus?.status_name === 'published' && !myResponse && !isExpired;
  }).length;
  
  const responded = quotations.filter(q => {
    const myResponse = q.RetailerQuotations?.find(
      rq => rq.retailer_id === retailerId
    );
    return !!myResponse;
  }).length;

  const stats = [
    {
      title: 'Total Quotations',
      value: totalQuotations,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Pending Response',
      value: pendingResponse,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Responded',
      value: responded,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <p className="text-gray-600">View and respond to quotation requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="p-4">
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
            </div>
          </Card>
        ))}
      </div>

      {/* Quotations Table */}
      <Card>
        <div className="p-4">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <Table
            columns={columns}
            data={quotations}
            loading={loading}
            emptyMessage="No quotations found"
          />

          {!loading && quotations.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuotationList;