import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { Column } from '@/types/database'

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTable: (name: string, columns: Column[]) => void
}

export function CreateTableDialog({ open, onOpenChange, onCreateTable }: CreateTableDialogProps) {
  const [tableName, setTableName] = useState('')
  const [columns, setColumns] = useState<Column[]>([
    { id: 'col_1', name: 'Name', type: 'text', required: true, width: 200 },
    { id: 'col_2', name: 'Email', type: 'text', required: false, width: 200 }
  ])

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: `Column ${columns.length + 1}`,
      type: 'text',
      required: false,
      width: 200
    }
    setColumns([...columns, newColumn])
  }

  const handleUpdateColumn = (index: number, updates: Partial<Column>) => {
    const updated = [...columns]
    updated[index] = { ...updated[index], ...updates }
    setColumns(updated)
  }

  const handleRemoveColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index))
    }
  }

  const handleCreate = () => {
    if (tableName.trim() && columns.length > 0) {
      onCreateTable(tableName.trim(), columns)
      setTableName('')
      setColumns([
        { id: 'col_1', name: 'Name', type: 'text', required: true, width: 200 },
        { id: 'col_2', name: 'Email', type: 'text', required: false, width: 200 }
      ])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name..."
              className="w-full"
            />
          </div>

          {/* Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Columns</Label>
              <Button onClick={handleAddColumn} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            </div>

            <div className="space-y-3">
              {columns.map((column, index) => (
                <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Column Name</Label>
                        <Input
                          value={column.name}
                          onChange={(e) => handleUpdateColumn(index, { name: e.target.value })}
                          placeholder="Column name"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={column.type}
                          onValueChange={(type: Column['type']) => handleUpdateColumn(index, { type })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {column.type === 'select' && (
                      <div>
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={column.options?.join(', ') || ''}
                          onChange={(e) => handleUpdateColumn(index, { 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="h-8"
                        />
                      </div>
                    )}
                  </div>

                  {columns.length > 1 && (
                    <Button
                      onClick={() => handleRemoveColumn(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!tableName.trim() || columns.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}