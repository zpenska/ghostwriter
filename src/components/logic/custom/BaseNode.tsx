import React from 'react';
import { 
  Edit2,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

interface BaseNodeProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  hasError?: boolean;
  errorMessage?: string;
}

const BaseNode: React.FC<BaseNodeProps> = ({ 
  children, 
  icon, 
  title, 
  subtitle, 
  color, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  hasError,
  errorMessage 
}) => {
  return (
    <div className={`min-w-64 bg-white border-2 rounded-lg shadow-lg ${
      hasError ? 'border-red-400' : `border-${color}-400`
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 bg-${color}-50 rounded-t-lg border-b`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 bg-${color}-100 rounded-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {hasError && (
            <div className="p-1" title={errorMessage}>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          )}
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="p-1 hover:bg-green-100 rounded"
                title="Save changes"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={onCancel}
                className="p-1 hover:bg-red-100 rounded"
                title="Cancel editing"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit node"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
};

export default BaseNode;