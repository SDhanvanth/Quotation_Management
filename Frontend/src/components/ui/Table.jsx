import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import LoadingSpinner from '../common/LoadingSpinner'

const Table = ({
  columns,
  data,
  loading = false,
  sortable = true,
  onSort,
  emptyMessage = 'No data available',
}) => {
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (field) => {
    if (!sortable || !field.sortable) return

    const direction = sortField === field.key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field.key)
    setSortDirection(direction)
    
    if (onSort) {
      onSort(field.key, direction)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  {
                    'cursor-pointer hover:bg-gray-100': sortable && column.sortable,
                  }
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortable && column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUpIcon
                        className={clsx('h-3 w-3', {
                          'text-gray-400': sortField !== column.key || sortDirection !== 'asc',
                          'text-gray-900': sortField === column.key && sortDirection === 'asc',
                        })}
                      />
                      <ChevronDownIcon
                        className={clsx('h-3 w-3 -mt-1', {
                          'text-gray-400': sortField !== column.key || sortDirection !== 'desc',
                          'text-gray-900': sortField === column.key && sortDirection === 'desc',
                        })}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table