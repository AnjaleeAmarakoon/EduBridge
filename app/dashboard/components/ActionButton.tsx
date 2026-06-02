import React from 'react';
import Link from 'next/link';

interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  gradient: string;
}

export default function ActionButton({ 
  title, 
  description, 
  icon, 
  onClick, 
  href,
  variant = 'secondary',
  gradient 
}: ActionButtonProps) {
  const className = `group p-6 ${gradient} rounded-xl hover:shadow-lg transition-all duration-200 text-left border border-opacity-50 hover:scale-105 transform ${
    variant === 'primary' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
  }`;

  const content = (
    <>
      <div className="w-12 h-12 bg-white bg-opacity-90 backdrop-blur rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
        {icon}
      </div>
      <h4 className={`font-bold mb-2 text-lg ${variant === 'primary' ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
      <p className={`text-sm ${variant === 'primary' ? 'text-white text-opacity-90' : 'text-gray-700'}`}>{description}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
