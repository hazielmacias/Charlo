import type { DebtImportRow } from '../types/debt'

export function validateRow(row: Record<string, any>): DebtImportRow {
  const errors: string[] = []

  const clientPhone = row.client_phone || row.telefono || row.phone || ''
  const description = row.description || row.descripcion || ''
  const amount = parseFloat(row.amount || row.monto || '0')
  const dueDate = row.due_date || row.fecha_vencimiento || row.fecha || ''

  if (!clientPhone) errors.push('Teléfono requerido')
  if (!description) errors.push('Descripción requerida')
  if (!amount || amount <= 0) errors.push('Monto inválido')
  if (!dueDate) errors.push('Fecha de vencimiento requerida')

  return {
    client_phone: clientPhone.toString(),
    client_name: row.client_name || row.nombre || '',
    description,
    amount,
    due_date: dueDate,
    valid: errors.length === 0,
    errors,
  }
}
