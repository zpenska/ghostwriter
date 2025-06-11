'use client';

import { useState } from 'react';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface Version {
  id: string;
  timestamp: Date;
  author: string;
  changes: string;
  snapshot?: any;
}

interface VersionHistoryProps {
  versions: Version[];
  onRestore: (version: Version) => void;
  onCompare: (v1: Version, v2: Version) => void;
}

export default function VersionHistory({ versions, onRestore, onCompare }: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const v1 = versions.find(v => v.id === selectedVersions[0])!;
      const v2 = versions.find(v => v.id === selectedVersions[1])!;
      onCompare(v1, v2);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        {selectedVersions.length === 2 && (
          <button
            onClick={handleCompare}
            className="mt-2 text-sm text-accent-lavender hover:text-accent-lavender/80"
          >
            Compare selected versions
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              selectedVersions.includes(version.id) ? 'bg-accent-lavender/5' : ''
            }`}
            onClick={() => handleVersionSelect(version.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {version.timestamp.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm mt-1">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{version.author}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{version.changes}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(version);
                }}
                className="ml-4 text-sm text-accent-lavender hover:text-accent-lavender/80"
              >
                Restore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}