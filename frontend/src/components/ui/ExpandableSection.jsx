import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ExpandableSection({ title, children, defaultOpen = false, badge }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-surface-50 dark:bg-surface-800/50
                   hover:bg-surface-100 dark:hover:bg-surface-800
                   transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {title}
          </span>
          {badge}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-surface-400 transition-transform duration-200
                     ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
