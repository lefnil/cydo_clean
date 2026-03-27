import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  placeholder = 'Search...',
  className = ''
}) => {
  return (
    <div className={`glass rounded-2xl p-4 flex-1 flex flex-col md:flex-row gap-4 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel/50" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel focus:border-transparent outline-none"
        />
      </div>
      
      {onFilterChange && filterOptions.length > 0 && (
        <select
          value={filterValue || ''}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-2 bg-frostee/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-jewel outline-none text-jewel font-medium min-w-[140px]"
        >
          <option value="">All</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      
      {onFilterChange && !filterOptions.length && (
        <Filter className="text-jewel/50 w-6 h-6" />
      )}
    </div>
  );
};

