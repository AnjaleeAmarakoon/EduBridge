import React from 'react';

interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  gradient: string;
}

export default function ActionButton({ 
  title, 
  description, 
  icon, 
  onClick, 
  variant = 'secondary',
  gradient 
}: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`group p-6 ${gradient} rounded-xl hover:shadow-lg transition-all duration-200 text-left border border-opacity-50 hover:scale-105 transform ${
        variant === 'primary' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      <div className="w-12 h-12 bg-white bg-opacity-90 backdrop-blur rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
        {icon}
      </div>
      <h4 className="font-bold text-gray-900 mb-2 text-lg">{title}</h4>
      <p className="text-sm text-gray-700">{description}</p>
    </button>
  );
}
