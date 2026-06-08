import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { validateRow } from '../../lib/validate-debt-import'
import type { DebtImportRow, DebtImportResult } from '../../types/debt'

interface DebtImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: DebtImportRow[]) => Promise<DebtImportResult>
}

export function DebtImport({ isOpen, onClose, onImport }: DebtImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [rows, setRows] = useState<DebtImportRow[]>([])
  const [result, setResult] = useState<DebtImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validatedRows = (results.data as Record<string, any>[]).map(validateRow)
          setRows(validatedRows)
          setStep('preview')
        },
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        const validatedRows = (jsonData as Record<string, any>[]).map(validateRow)
        setRows(validatedRows)
        setStep('preview')
      }
      reader.readAsArrayBuffer(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    setImporting(true)
    const importResult = await onImport(rows.filter(r => r.valid))
    setResult(importResult)
    setStep('result')
    setImporting(false)
  }

  const handleClose = () => {
    setStep('upload')
    setRows([])
    setResult(null)
    onClose()
  }

  const validCount = rows.filter(r => r.valid).length
  const errorCount = rows.filter(r => !r.valid).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Carga Masiva de Deudas</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                <p className="font-medium mb-2">Formato esperado del archivo:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li><code className="bg-gray-100 px-1 rounded">client_phone</code> o <code className="bg-gray-100 px-1 rounded">telefono</code> - Teléfono del cliente</li>
                  <li><code className="bg-gray-100 px-1 rounded">description</code> o <code className="bg-gray-100 px-1 rounded">descripcion</code> - Descripción de la deuda</li>
                  <li><code className="bg-gray-100 px-1 rounded">amount</code> o <code className="bg-gray-100 px-1 rounded">monto</code> - Monto numérico</li>
                  <li><code className="bg-gray-100 px-1 rounded">due_date</code> o <code className="bg-gray-100 px-1 rounded">fecha</code> - Fecha YYYY-MM-DD</li>
                </ul>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CSV, XLS o XLSX (máximo 10MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <span className="font-medium text-emerald-600">{validCount}</span> válidas
                  {errorCount > 0 && (
                    <> • <span className="font-medium text-red-600">{errorCount}</span> con errores</>
                  )}
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Teléfono</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Monto</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Vence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-900">{row.client_phone}</td>
                        <td className="px-3 py-2 text-gray-600">{row.description}</td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          ${row.amount.toLocaleString('es-MX')}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{row.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 mb-1">Errores encontrados:</p>
                  {rows.filter(r => !r.valid).slice(0, 5).map((row, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Fila {rows.indexOf(row) + 1}: {row.errors.join(', ')}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Importación completada</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium text-emerald-600">{result.created}</span> deudas creadas
                  {result.errors > 0 && (
                    <> • <span className="font-medium text-red-600">{result.errors}</span> errores</>
                  )}
                </p>
              </div>
              {result.details.length > 0 && (
                <div className="text-left bg-gray-50 rounded-lg p-4 max-h-48 overflow-auto">
                  {result.details.map((d, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Fila {d.row}: {d.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {step === 'result' ? 'Cerrar' : 'Cancelar'}
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {importing ? 'Importando...' : `Importar ${validCount} deudas`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
