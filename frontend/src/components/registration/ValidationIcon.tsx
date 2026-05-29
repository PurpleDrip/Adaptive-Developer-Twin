import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationIconProps {
    status: 'idle' | 'checking' | 'valid' | 'invalid';
}

export const ValidationIcon: React.FC<ValidationIconProps> = ({ status }) => {
    if (status === 'checking') {
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
    if (status === 'valid') {
        return <CheckCircle size={16} className="text-green-500" />;
    }
    if (status === 'invalid') {
        return <AlertTriangle size={16} className="text-red-500" />;
    }
    return null;
};
