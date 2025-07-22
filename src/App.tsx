import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { DataGrid } from '@/components/spreadsheet/DataGrid'
import { CreateTableDialog } from '@/components/dialogs/CreateTableDialog'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'
import { Table, Column, Row } from '@/types/database'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<Table[]>([])
  const [activeTable, setActiveTable] = useState<Table | null>(null)
  const [createTableOpen, setCreateTableOpen] = useState(false)
  const { toast } = useToast()

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadTables = useCallback(async () => {
    if (!user) return
    
    try {
      const tablesData = await blink.db.tables.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      const tablesWithRows = await Promise.all(
        tablesData.map(async (table) => {
          const rowsData = await blink.db.tableRows.list({
            where: { tableId: table.id },
            orderBy: { createdAt: 'asc' }
          })

          return {
            id: table.id,
            name: table.name,
            columns: JSON.parse(table.columns),
            rows: rowsData.map(row => ({
              id: row.id,
              ...JSON.parse(row.data)
            })),
            createdAt: table.createdAt,
            updatedAt: table.updatedAt,
            userId: table.userId
          }
        })
      )

      setTables(tablesWithRows)
      
      // Set first table as active if none selected
      if (!activeTable && tablesWithRows.length > 0) {
        setActiveTable(tablesWithRows[0])
      }
    } catch (error) {
      console.error('Failed to load tables:', error)
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive"
      })
    }
  }, [user, activeTable, toast])

  // Load tables when user is authenticated
  useEffect(() => {
    if (user) {
      loadTables()
    }
  }, [user, loadTables])

  const handleCreateTable = async (name: string, columns: Column[]) => {
    try {
      const tableId = `table_${Date.now()}`
      
      await blink.db.tables.create({
        id: tableId,
        name,
        columns: JSON.stringify(columns),
        userId: user.id
      })

      const newTable: Table = {
        id: tableId,
        name,
        columns,
        rows: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }

      setTables(prev => [newTable, ...prev])
      setActiveTable(newTable)
      
      toast({
        title: "Success",
        description: `Table "${name}" created successfully`
      })
    } catch (error) {
      console.error('Failed to create table:', error)
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive"
      })
    }
  }

  const handleTableSelect = (tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    if (table) {
      setActiveTable(table)
    }
  }

  const handleColumnAdd = async () => {
    if (!activeTable) return

    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: `Column ${activeTable.columns.length + 1}`,
      type: 'text',
      required: false,
      width: 200
    }

    const updatedColumns = [...activeTable.columns, newColumn]
    
    try {
      await blink.db.tables.update(activeTable.id, {
        columns: JSON.stringify(updatedColumns),
        updatedAt: new Date().toISOString()
      })

      const updatedTable = { ...activeTable, columns: updatedColumns }
      setActiveTable(updatedTable)
      setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
      
      toast({
        title: "Success",
        description: "Column added successfully"
      })
    } catch (error) {
      console.error('Failed to add column:', error)
      toast({
        title: "Error",
        description: "Failed to add column",
        variant: "destructive"
      })
    }
  }

  const handleColumnUpdate = async (columnId: string, updates: Partial<Column>) => {
    if (!activeTable) return

    const updatedColumns = activeTable.columns.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    )

    try {
      await blink.db.tables.update(activeTable.id, {
        columns: JSON.stringify(updatedColumns),
        updatedAt: new Date().toISOString()
      })

      const updatedTable = { ...activeTable, columns: updatedColumns }
      setActiveTable(updatedTable)
      setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
    } catch (error) {
      console.error('Failed to update column:', error)
      toast({
        title: "Error",
        description: "Failed to update column",
        variant: "destructive"
      })
    }
  }

  const handleColumnDelete = async (columnId: string) => {
    if (!activeTable) return

    const updatedColumns = activeTable.columns.filter(col => col.id !== columnId)
    
    try {
      await blink.db.tables.update(activeTable.id, {
        columns: JSON.stringify(updatedColumns),
        updatedAt: new Date().toISOString()
      })

      // Remove column data from all rows
      const updatedRows = activeTable.rows.map(row => {
        const { [columnId]: removed, ...rest } = row
        return rest
      })

      // Update all rows in database
      await Promise.all(
        updatedRows.map(row =>
          blink.db.tableRows.update(row.id, {
            data: JSON.stringify(row)
          })
        )
      )

      const updatedTable = { ...activeTable, columns: updatedColumns, rows: updatedRows }
      setActiveTable(updatedTable)
      setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
      
      toast({
        title: "Success",
        description: "Column deleted successfully"
      })
    } catch (error) {
      console.error('Failed to delete column:', error)
      toast({
        title: "Error",
        description: "Failed to delete column",
        variant: "destructive"
      })
    }
  }

  const handleRowAdd = async () => {
    if (!activeTable) return

    const rowId = `row_${Date.now()}`
    const newRowData: any = { id: rowId }
    
    // Initialize with empty values for each column
    activeTable.columns.forEach(col => {
      newRowData[col.id] = col.type === 'boolean' ? false : ''
    })

    try {
      await blink.db.tableRows.create({
        id: rowId,
        tableId: activeTable.id,
        data: JSON.stringify(newRowData),
        userId: user.id
      })

      const updatedRows = [...activeTable.rows, newRowData]
      const updatedTable = { ...activeTable, rows: updatedRows }
      setActiveTable(updatedTable)
      setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
      
      toast({
        title: "Success",
        description: "Row added successfully"
      })
    } catch (error) {
      console.error('Failed to add row:', error)
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive"
      })
    }
  }

  const handleRowUpdate = async (rowId: string, columnId: string, value: any) => {
    if (!activeTable) return

    const updatedRows = activeTable.rows.map(row =>
      row.id === rowId ? { ...row, [columnId]: value } : row
    )

    try {
      const updatedRow = updatedRows.find(r => r.id === rowId)
      if (updatedRow) {
        await blink.db.tableRows.update(rowId, {
          data: JSON.stringify(updatedRow)
        })

        const updatedTable = { ...activeTable, rows: updatedRows }
        setActiveTable(updatedTable)
        setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
      }
    } catch (error) {
      console.error('Failed to update row:', error)
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive"
      })
    }
  }

  const handleRowDelete = async (rowId: string) => {
    if (!activeTable) return

    try {
      await blink.db.tableRows.delete(rowId)

      const updatedRows = activeTable.rows.filter(row => row.id !== rowId)
      const updatedTable = { ...activeTable, rows: updatedRows }
      setActiveTable(updatedTable)
      setTables(prev => prev.map(t => t.id === activeTable.id ? updatedTable : t))
      
      toast({
        title: "Success",
        description: "Row deleted successfully"
      })
    } catch (error) {
      console.error('Failed to delete row:', error)
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DataGrid Pro...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold mb-2">DataGrid Pro</h1>
          <p className="text-gray-600 mb-4">Please sign in to access your spreadsheet database</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        tables={tables.map(t => ({ id: t.id, name: t.name }))}
        activeTableId={activeTable?.id}
        onTableSelect={handleTableSelect}
        onCreateTable={() => setCreateTableOpen(true)}
        className="w-64 flex-shrink-0"
      />

      <main className="flex-1 flex flex-col">
        {activeTable ? (
          <>
            <div className="bg-white border-b px-6 py-4">
              <h1 className="text-xl font-semibold">{activeTable.name}</h1>
              <p className="text-sm text-gray-600">
                {activeTable.rows.length} rows • {activeTable.columns.length} columns
              </p>
            </div>
            
            <DataGrid
              columns={activeTable.columns}
              rows={activeTable.rows}
              onColumnAdd={handleColumnAdd}
              onColumnUpdate={handleColumnUpdate}
              onColumnDelete={handleColumnDelete}
              onRowAdd={handleRowAdd}
              onRowUpdate={handleRowUpdate}
              onRowDelete={handleRowDelete}
              onCellEdit={handleRowUpdate}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-semibold mb-2">Welcome to DataGrid Pro</h2>
              <p className="text-gray-600 mb-4">Create your first table to get started</p>
              <button
                onClick={() => setCreateTableOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create Table
              </button>
            </div>
          </div>
        )}
      </main>

      <CreateTableDialog
        open={createTableOpen}
        onOpenChange={setCreateTableOpen}
        onCreateTable={handleCreateTable}
      />

      <Toaster />
    </div>
  )
}

export default App