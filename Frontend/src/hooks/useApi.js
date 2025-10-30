import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export const useApi = (apiFunc, immediate = true) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiFunc(...args)
        setData(response)
        return response
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunc]
  )

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    data,
    error,
    loading,
    execute,
    setData,
  }
}

export const usePaginatedApi = (apiFunc, initialPage = 1, initialLimit = 10) => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(
    async (page = pagination.page, limit = pagination.limit, params = {}) => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('usePaginatedApi - Fetching with:', { page, limit, params })
        
        const response = await apiFunc({ page, limit, ...params })
        
        console.log('usePaginatedApi - Raw response:', response)

        // Handle multiple response formats
        let itemsData = []
        let paginationData = {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        }

        // Check different possible response structures
        if (response.stores) {
          // Format: { stores: [...], pagination: {...} }
          itemsData = response.stores
          paginationData = response.pagination || paginationData
        } else if (response.retailers) {
          // Format: { retailers: [...], pagination: {...} }
          itemsData = response.retailers
          paginationData = response.pagination || paginationData
        } else if (response.items) {
          // Format: { items: [...], pagination: {...} }
          itemsData = response.items
          paginationData = response.pagination || paginationData
        } else if (response.data) {
          // Format: { data: [...], pagination: {...} }
          itemsData = Array.isArray(response.data) ? response.data : [response.data]
          paginationData = response.pagination || paginationData
        } else if (Array.isArray(response)) {
          // Response is array directly
          itemsData = response
          paginationData.total = response.length
          paginationData.totalPages = Math.ceil(response.length / limit)
        } else {
          // Unknown format, try to extract data
          console.warn('Unknown response format:', response)
          itemsData = []
        }

        // Update pagination with response data if available
        if (response.pagination) {
          paginationData = {
            ...paginationData,
            ...response.pagination,
            page: parseInt(response.pagination.page || page),
            limit: parseInt(response.pagination.limit || limit),
            total: parseInt(response.pagination.total || 0),
            totalPages: parseInt(response.pagination.totalPages || 0),
          }
        }

        console.log('usePaginatedApi - Processed items:', itemsData)
        console.log('usePaginatedApi - Processed pagination:', paginationData)

        setData(itemsData)
        setPagination(paginationData)
        
        return response
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred'
        setError(errorMessage)
        console.error('usePaginatedApi - Error:', err)
        toast.error(errorMessage)
        setData([])
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunc]
  )

  const goToPage = useCallback((page) => {
    fetchData(page, pagination.limit)
  }, [fetchData, pagination.limit])

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchData(pagination.page + 1, pagination.limit)
    }
  }, [fetchData, pagination.page, pagination.limit, pagination.totalPages])

  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchData(pagination.page - 1, pagination.limit)
    }
  }, [fetchData, pagination.page, pagination.limit])

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    goToPage,
    nextPage,
    previousPage,
  }
}