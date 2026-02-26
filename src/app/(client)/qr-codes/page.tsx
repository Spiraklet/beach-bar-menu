'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import { Button, Modal, Input, Toast, ToastType } from '@/components/ui'

interface QRCodeData {
  id: string
  tableIdentifier: string
  url: string
  dataUrl: string
  createdAt: string
}

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [deletingQR, setDeletingQR] = useState<QRCodeData | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [singleTableId, setSingleTableId] = useState('')
  const [batchPrefix, setBatchPrefix] = useState('')
  const [batchStart, setBatchStart] = useState('1')
  const [batchEnd, setBatchEnd] = useState('10')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchQRCodes = useCallback(async () => {
    try {
      const response = await fetch('/api/client/qr-codes')
      const data = await response.json()

      if (data.success) {
        setQrCodes(data.data)
      }
    } catch {
      setToast({ message: 'Failed to load QR codes', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQRCodes()
  }, [fetchQRCodes])

  const handleGenerateSingle = async () => {
    if (!singleTableId.trim()) {
      setToast({ message: 'Please enter a table ID', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableIdentifiers: [singleTableId.trim()] }),
      })
      const data = await response.json()

      if (data.success) {
        setToast({ message: 'QR code generated successfully', type: 'success' })
        setSingleTableId('')
        setIsGenerateModalOpen(false)
        fetchQRCodes()
      } else {
        setToast({ message: data.error || 'Failed to generate QR code', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateBatch = async () => {
    const start = parseInt(batchStart)
    const end = parseInt(batchEnd)

    if (isNaN(start) || isNaN(end)) {
      setToast({ message: 'Start and end must be numbers (e.g. 1 and 15)', type: 'error' })
      return
    }

    if (start < 1 || end < 1) {
      setToast({ message: 'Start and end numbers must be 1 or higher', type: 'error' })
      return
    }

    if (start > end) {
      setToast({ message: 'Start number must be less than or equal to end number', type: 'error' })
      return
    }

    if (end - start >= 100) {
      setToast({ message: 'Cannot generate more than 100 QR codes at once', type: 'error' })
      return
    }

    const tableIdentifiers = []
    for (let i = start; i <= end; i++) {
      tableIdentifiers.push(batchPrefix ? `${batchPrefix.trim().toUpperCase()}${i}` : i.toString())
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableIdentifiers }),
      })
      const data = await response.json()

      if (data.success) {
        setToast({ message: `Generated ${tableIdentifiers.length} QR codes`, type: 'success' })
        setBatchPrefix('')
        setBatchStart('1')
        setBatchEnd('10')
        setIsBatchModalOpen(false)
        fetchQRCodes()
      } else {
        setToast({ message: data.error || 'Failed to generate QR codes', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingQR) return

    try {
      const response = await fetch(`/api/client/qr-codes?id=${deletingQR.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        setToast({ message: 'QR code deleted', type: 'success' })
        fetchQRCodes()
      } else {
        setToast({ message: data.error || 'Failed to delete', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setDeletingQR(null)
    }
  }

  const handleDownload = (qr: QRCodeData) => {
    const link = document.createElement('a')
    link.download = `table-${qr.tableIdentifier}-qr.png`
    link.href = qr.dataUrl
    link.click()
  }

  const handlePrint = (qr: QRCodeData) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - Table ${qr.tableIdentifier}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            img {
              width: 300px;
              height: 300px;
            }
            h1 {
              margin-top: 20px;
              font-size: 48px;
            }
            p {
              color: #666;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qr.dataUrl}" alt="QR Code" />
            <h1>Table ${qr.tableIdentifier}</h1>
            <p>Scan to view menu</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const qrHTML = qrCodes
        .map(
          (qr) => `
          <div class="qr-item">
            <img src="${qr.dataUrl}" alt="QR Code" />
            <h2>Table ${qr.tableIdentifier}</h2>
            <p>Scan to view menu</p>
          </div>
        `
        )
        .join('')

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>All QR Codes</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .qr-item {
              text-align: center;
              padding: 20px;
              border: 1px solid #ddd;
              page-break-inside: avoid;
            }
            img {
              width: 200px;
              height: 200px;
            }
            h2 {
              margin: 10px 0 5px;
              font-size: 24px;
            }
            p {
              color: #666;
              margin: 0;
              font-size: 14px;
            }
            @media print {
              .qr-item {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${qrHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
            <p className="text-gray-600 mt-1">{qrCodes.length} table QR codes</p>
          </div>
          <div className="flex gap-2">
            {qrCodes.length > 0 && (
              <Button variant="secondary" onClick={handlePrintAll}>
                Print All
              </Button>
            )}
            <Button variant="secondary" onClick={() => setIsBatchModalOpen(true)}>
              Generate Batch
            </Button>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              Generate Single
            </Button>
          </div>
        </div>

        {/* QR Codes Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading QR codes...</div>
        ) : qrCodes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No QR codes yet</p>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              Generate Your First QR Code
            </Button>
          </div>
        ) : (
          <div ref={printRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="card text-center">
                <img
                  src={qr.dataUrl}
                  alt={`QR Code for table ${qr.tableIdentifier}`}
                  className="w-48 h-48 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900">Table {qr.tableIdentifier}</h3>
                <p className="text-sm text-gray-500 mt-1 break-all">{qr.url}</p>

                <div className="flex gap-2 mt-4 pt-4 border-t justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(qr)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrint(qr)}
                  >
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingQR(qr)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Single Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate QR Code"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Table ID"
            value={singleTableId}
            onChange={(e) => setSingleTableId(e.target.value)}
            placeholder="e.g., A1, 1, VIP1"
          />
          <p className="text-sm text-gray-500">
            Enter any alphanumeric identifier for this table
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateSingle} isLoading={isSubmitting}>
              Generate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Batch Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Generate Batch QR Codes"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Letter Prefix (optional)"
            value={batchPrefix}
            onChange={(e) => setBatchPrefix(e.target.value)}
            placeholder="e.g., A for A1–A15, B for B1–B10"
          />
          <p className="text-sm text-gray-500 -mt-2">
            Leave blank for number-only tables (1, 2, 3…). Enter a letter for labelled tables (A1, A2…).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Number"
              type="number"
              min="1"
              value={batchStart}
              onChange={(e) => setBatchStart(e.target.value)}
            />
            <Input
              label="End Number"
              type="number"
              min="1"
              value={batchEnd}
              onChange={(e) => setBatchEnd(e.target.value)}
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This will generate QR codes for:{' '}
              <strong>
                {batchPrefix ? batchPrefix.trim().toUpperCase() : ''}{batchStart}
                {' '}to{' '}
                {batchPrefix ? batchPrefix.trim().toUpperCase() : ''}{batchEnd}
              </strong>
              {' '}({Math.max(0, parseInt(batchEnd) - parseInt(batchStart) + 1) || 0} codes)
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateBatch} isLoading={isSubmitting}>
              Generate {Math.max(0, parseInt(batchEnd) - parseInt(batchStart) + 1) || 0} QR Codes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingQR}
        onClose={() => setDeletingQR(null)}
        title="Delete QR Code"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete the QR code for{' '}
            <strong>Table {deletingQR?.tableIdentifier}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingQR(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ClientLayout>
  )
}
