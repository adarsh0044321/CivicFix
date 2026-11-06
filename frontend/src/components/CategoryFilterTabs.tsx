import React from 'react';

interface CategoryFilterTabsProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const tabs = [
    { id: 'ALL', label: 'Recent Issues' },
    { id: 'ROAD_DAMAGE', label: 'Road Damage' },
    { id: 'GARBAGE_WASTE', label: 'Garbage & Waste' },
    { id: 'STREETLIGHT', label: 'Streetlights' },
    { id: 'DRAINAGE', label: 'Drainage' },
    { id: 'WATER_SUPPLY', label: 'Water Supply' },
    { id: 'URGENT', label: 'Urgent' },
  ];

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
