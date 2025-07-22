import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Trash2, 
  MoreHorizontal, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { Column, Row } from '@/types/database'
import { cn } from '@/lib/utils'

interface DataGridProps {
  columns: Column[]
  rows: Row[]
  onColumnAdd: () => void
  onColumnUpdate: (columnId: string, updates: Partial<Column>) => void
  onColumnDelete: (columnId: string) => void
  onRowAdd: () => void
  onRowUpdate: (rowId: string, columnId: string, value: any) => void
  onRowDelete: (rowId: string) => void
  onCellEdit: (rowId: string, columnId: string, value: any) => void
}

export function DataGrid({
  columns,
  rows,
  onColumnAdd,
  onColumnUpdate,
  onColumnDelete,
  onRowAdd,
  onRowUpdate,
  onRowDelete,
  onCellEdit
}: DataGridProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleCellClick = (rowId: string, columnId: string) => {
    setEditingCell({ rowId, columnId })
  }

  const handleCellBlur = (rowId: string, columnId: string, value: any) => {
    onCellEdit(rowId, columnId, value)
    setEditingCell(null)
  }

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const renderCell = (row: Row, column: Column) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id
    const value = row[column.id] || ''

    if (isEditing) {
      return (
        <CellEditor
          column={column}
          value={value}
          onBlur={(newValue) => handleCellBlur(row.id, column.id, newValue)}
          autoFocus
        />
      )
    }

    return (
      <div
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 min-h-[40px] flex items-center"
        onClick={() => handleCellClick(row.id, column.id)}
      >
        <CellDisplay column={column} value={value} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button onClick={onRowAdd} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
          <Button onClick={onColumnAdd} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
          {selectedRows.size > 0 && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => {
                selectedRows.forEach(rowId => onRowDelete(rowId))
                setSelectedRows(new Set())
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedRows.size})
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 border-b">
            <tr>
              <th className="w-12 p-2 border-r">
                <Checkbox
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRows(new Set(rows.map(r => r.id)))
                    } else {
                      setSelectedRows(new Set())
                    }
                  }}
                />
              </th>
              {columns.map((column) => (
                <th key={column.id} className="border-r min-w-[150px]">
                  <ColumnHeader
                    column={column}
                    sortDirection={sortColumn === column.id ? sortDirection : null}
                    onSort={() => handleSort(column.id)}
                    onUpdate={(updates) => onColumnUpdate(column.id, updates)}
                    onDelete={() => onColumnDelete(column.id)}
                  />
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr key={row.id} className={cn(
                "border-b hover:bg-gray-50",
                selectedRows.has(row.id) && "bg-blue-50"
              )}>
                <td className="p-2 border-r text-center">
                  <Checkbox
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedRows)
                      if (checked) {
                        newSelected.add(row.id)
                      } else {
                        newSelected.delete(row.id)
                      }
                      setSelectedRows(newSelected)
                    }}
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.id} className="border-r">
                    {renderCell(row, column)}
                  </td>
                ))}
                <td className="p-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRowDelete(row.id)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl opacity-50">📊</div>
                    <p>No data yet</p>
                    <p className="text-sm">Add your first row to get started</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ColumnHeader({ 
  column, 
  sortDirection, 
  onSort, 
  onUpdate, 
  onDelete 
}: {
  column: Column
  sortDirection: 'asc' | 'desc' | null
  onSort: () => void
  onUpdate: (updates: Partial<Column>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)

  return (
    <div className="flex items-center justify-between p-2 group">
      {isEditing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            onUpdate({ name })
            setIsEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onUpdate({ name })
              setIsEditing(false)
            }
          }}
          className="h-6 text-sm"
          autoFocus
        />
      ) : (
        <div 
          className="flex items-center gap-1 cursor-pointer flex-1"
          onClick={onSort}
        >
          <span className="font-medium text-sm">{column.name}</span>
          {sortDirection && (
            sortDirection === 'asc' ? 
              <ArrowUp className="h-3 w-3" /> : 
              <ArrowDown className="h-3 w-3" />
          )}
        </div>
      )}
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function CellEditor({ 
  column, 
  value, 
  onBlur, 
  autoFocus 
}: {
  column: Column
  value: any
  onBlur: (value: any) => void
  autoFocus?: boolean
}) {
  const [editValue, setEditValue] = useState(value)

  const handleBlur = () => {
    onBlur(editValue)
  }

  switch (column.type) {
    case 'boolean':
      return (
        <Checkbox
          checked={editValue}
          onCheckedChange={(checked) => {
            setEditValue(checked)
            onBlur(checked)
          }}
          autoFocus={autoFocus}
        />
      )
    
    case 'select':
      return (
        <Select value={editValue} onValueChange={(val) => {
          setEditValue(val)
          onBlur(val)
        }}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'number':
      return (
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          className="h-8"
          autoFocus={autoFocus}
        />
      )
    
    case 'date':
      return (
        <Input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          className="h-8"
          autoFocus={autoFocus}
        />
      )
    
    default:
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          className="h-8"
          autoFocus={autoFocus}
        />
      )
  }
}

function CellDisplay({ column, value }: { column: Column; value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 italic">Empty</span>
  }

  switch (column.type) {
    case 'boolean':
      return (
        <div className="flex items-center">
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center",
            value ? "bg-green-500 border-green-500" : "border-gray-300"
          )}>
            {value && <div className="w-2 h-2 bg-white rounded-sm" />}
          </div>
        </div>
      )
    
    case 'date':
      return <span>{new Date(value).toLocaleDateString()}</span>
    
    case 'number':
      return <span className="font-mono">{Number(value).toLocaleString()}</span>
    
    default:
      return <span>{String(value)}</span>
  }
}