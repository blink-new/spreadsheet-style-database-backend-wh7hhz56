import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Database, 
  Plus, 
  Table, 
  Settings, 
  FileText,
  Search,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  tables: Array<{ id: string; name: string }>
  activeTableId?: string
  onTableSelect: (tableId: string) => void
  onCreateTable: () => void
  className?: string
}

export function Sidebar({ 
  tables, 
  activeTableId, 
  onTableSelect, 
  onCreateTable,
  className 
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="font-semibold text-lg">DataGrid Pro</h1>
        </div>
        
        <Button 
          onClick={onCreateTable}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Table
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tables List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {filteredTables.map((table) => (
            <Button
              key={table.id}
              variant={activeTableId === table.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3",
                activeTableId === table.id && "bg-blue-100 text-blue-700 border-blue-200"
              )}
              onClick={() => onTableSelect(table.id)}
            >
              <Table className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{table.name}</span>
            </Button>
          ))}
          
          {filteredTables.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tables found</p>
            </div>
          )}
          
          {tables.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tables yet</p>
              <p className="text-xs mt-1">Create your first table to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start">
          <FileText className="h-4 w-4 mr-2" />
          API Docs
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}