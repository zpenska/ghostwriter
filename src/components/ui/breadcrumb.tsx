import { ChevronRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export function Breadcrumb({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav className="text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
      <ol className="flex space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRightIcon className="h-4 w-4 mx-1" />}
            <Link href={item.href} className="hover:underline">
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
