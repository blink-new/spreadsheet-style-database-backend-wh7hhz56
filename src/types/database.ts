export interface Column {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  options?: string[] // For select type
  required?: boolean
  width?: number
}

export interface Row {
  id: string
  [key: string]: any
}

export interface Table {
  id: string
  name: string
  columns: Column[]
  rows: Row[]
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CellValue {
  rowId: string
  columnId: string
  value: any
}