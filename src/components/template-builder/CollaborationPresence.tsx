'use client';

interface CollaborationPresenceProps {
  users?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function CollaborationPresence({ users = [] }: CollaborationPresenceProps) {
  // This is a placeholder for the collaboration presence feature
  // In a real implementation, this would show active users editing the document
  
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2 border-b border-gray-200">
      <span className="text-sm text-gray-500">Active users:</span>
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}