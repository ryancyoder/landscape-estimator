import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../data/catalog';
import CatalogCard from './CatalogCard';

function TakeOffGroupCard() {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'catalog-takeoff-group',
    data: { type: 'takeoff-group' },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: 'none' }}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-indigo-300
        bg-indigo-50 cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors
        ${isDragging ? 'opacity-40' : ''}
      `}
    >
      <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-indigo-700">Take Off Group</p>
        <p className="text-xs text-indigo-400">Drag to create a group</p>
      </div>
    </div>
  );
}

export default function CatalogPanel({ catalogItems }) {
  const [activeCategory, setActiveCategory] = useState('plants');

  const visibleItems = catalogItems.filter(item => item.category === activeCategory);

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-white border-r border-gray-200 h-full overflow-hidden print:hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Catalog
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Drag items onto the estimate</p>
      </div>

      {/* Take Off Group card */}
      <div className="px-3 py-2 border-b border-gray-100">
        <TakeOffGroupCard />
      </div>

      {/* Category tabs */}
      <div className="flex flex-col gap-1 px-3 py-2 border-b border-gray-100">
        {CATEGORIES.map(cat => {
          const colors = CATEGORY_COLORS[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                text-left transition-colors duration-100
                ${isActive
                  ? `${colors.bg} ${colors.text}`
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? colors.dot : 'bg-gray-300'}`} />
              {CATEGORY_LABELS[cat]}
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${isActive ? colors.badge : 'bg-gray-100 text-gray-500'}`}>
                {catalogItems.filter(i => i.category === cat).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {visibleItems.map(item => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
}
