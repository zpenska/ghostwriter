'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'
import { useDraggable } from '@dnd-kit/core'
import clsx from 'clsx'
import { Text } from '@/components/ui/text'

type Item = {
  id: string
  name: string
  type: string
  description: string
}

type Group =
  | {
      name: string
      variables: Item[]
    }
  | {
      name: string
      components: Item[]
    }

const variableGroups = [
  {
    name: 'Member',
    variables: [
      { id: 'member-name', name: 'MemberName', type: 'Text', description: 'Full name of the member' },
      { id: 'member-id', name: 'MemberID', type: 'ID', description: 'Unique member identifier' },
      { id: 'member-dob', name: 'DateOfBirth', type: 'Date', description: 'Member date of birth' },
    ],
  },
  {
    name: 'Provider',
    variables: [
      { id: 'provider-name', name: 'ProviderName', type: 'Text', description: 'Healthcare provider name' },
      { id: 'provider-npi', name: 'ProviderNPI', type: 'ID', description: 'National Provider Identifier' },
      { id: 'provider-specialty', name: 'Specialty', type: 'Text', description: 'Provider specialty' },
    ],
  },
]

const componentGroups = [
  {
    name: 'Logos',
    components: [
      { id: 'logo-hospital', name: 'HospitalLogo', type: 'Image', description: 'Main hospital logo' },
    ],
  },
  {
    name: 'Blocks',
    components: [
      { id: 'address-block', name: 'AddressBlock', type: 'Block', description: 'Reusable address block' },
      { id: 'barcode-block', name: 'Barcode', type: 'Barcode', description: 'Auto-generated barcode' },
    ],
  },
]

function DraggableItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group flex cursor-grab items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-[#F5F5F1] hover:shadow"
    >
      <Text variant="code" className="truncate">
        {`{{${item.name}}}`}
      </Text>
      <span className="ml-2 text-xs text-zinc-500">{item.type}</span>
    </div>
  )
}

export default function VariablePanel() {
  const [tab, setTab] = useState<'variables' | 'components'>('variables')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const groups: Group[] = tab === 'variables' ? variableGroups : componentGroups
  const label = tab === 'variables' ? 'Variables' : 'Components'

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    newExpanded.has(groupName) ? newExpanded.delete(groupName) : newExpanded.add(groupName)
    setExpandedGroups(newExpanded)
  }

  const filteredGroups = groups
    .map(group => {
      const items = 'variables' in group ? group.variables : group.components
      const filteredItems = items.filter(
        item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return {
        name: group.name,
        items: filteredItems,
      }
    })
    .filter(group => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-[#F5F5F1] font-radio">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 px-4 py-3 bg-white">
        <button
          onClick={() => setTab('variables')}
          className={clsx(
            'text-sm font-medium transition',
            tab === 'variables'
              ? 'text-[#8a7fae] border-b-2 border-[#8a7fae]'
              : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Variables
        </button>
        <button
          onClick={() => setTab('components')}
          className={clsx(
            'text-sm font-medium transition',
            tab === 'components'
              ? 'text-[#8a7fae] border-b-2 border-[#8a7fae]'
              : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          Components
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-zinc-200 px-4 py-3 bg-white">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="search"
            className="block w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#8a7fae]"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F5F5F1]">
        {filteredGroups.map(group => (
          <div key={group.name} className="border-b border-zinc-200 px-4 py-3 bg-white">
            <button
              onClick={() => toggleGroup(group.name)}
              className="flex w-full items-center justify-between text-sm font-semibold text-zinc-800 hover:text-zinc-900"
            >
              <span>{group.name}</span>
              {expandedGroups.has(group.name) ? (
                <ChevronDownIcon className="h-5 w-5 text-zinc-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-zinc-400" />
              )}
            </button>
            {expandedGroups.has(group.name) && (
              <div className="mt-2 space-y-2">
                {group.items.map(item => (
                  <DraggableItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 text-center text-xs text-zinc-500">
        Drag {label.toLowerCase()} into your template
      </div>
    </div>
  )
}
