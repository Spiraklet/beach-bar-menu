'use client'

import { useState, useEffect, useCallback } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import { Button, Toast, ToastType } from '@/components/ui'
import { formatPrice } from '@/lib/utils'

interface DailyStat {
  date: string
  ordersCompleted: number
  totalRevenue: number
}

interface Summary {
  totalOrders: number
  totalRevenue: number
  startDate: string
  endDate: string
}

export default function AnalysisPage() {
  const [stats, setStats] = useState<DailyStat[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Date range state - default to last 30 days
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    now.setDate(now.getDate() - 30)
    return now.toISOString().split('T')[0]
  })

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      const response = await fetch(`/api/client/analysis?${params}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data.stats)
        setSummary(data.data.summary)
      } else {
        setToast({ message: data.error || 'Failed to load analysis', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const setPresetRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
            <p className="text-gray-600 mt-1">Daily order statistics and revenue</p>
          </div>
        </div>

        {/* Date Range Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPresetRange(7)}>
                7 days
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPresetRange(30)}>
                30 days
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPresetRange(90)}>
                90 days
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatPrice(summary.totalRevenue)}
              </p>
            </div>
          </div>
        )}

        {/* Stats Table */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading analysis...</div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
            <p className="text-gray-500">No completed orders in this period</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders Completed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.map((stat) => (
                    <tr key={stat.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateDisplay(stat.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {stat.ordersCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 text-right">
                        {formatPrice(stat.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Summary Footer */}
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {summary?.totalOrders || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 text-right">
                      {formatPrice(summary?.totalRevenue || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ClientLayout>
  )
}
