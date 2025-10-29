import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  /** Unique key for the filter, e.g., 'status' or 'role' */
  id: string;
  /** The label displayed for the filter dropdown */
  label: string;
  /** The options available in the dropdown */
  options: FilterOption[];
}

/**
 * Props for the SearchAndFilter component.
 */
interface SearchAndFilterProps {
  /**
   * The current value of the search input.
   */
  searchTerm: string;
  /**
   * Callback function when the search term changes.
   */
  onSearchChange: (term: string) => void;
  /**
   * An array of filter configurations.
   */
  filters: FilterConfig[];
  /**
   * The current state of active filters. A map of filter id to selected option value.
   */
  activeFilters: Record<string, string>;
  /**
   * Callback function when a filter's value changes.
   */
  onFilterChange: (filterId: string, optionValue: string) => void;
  /**
   * Callback function to clear all filters and search.
   */
  onClearAll: () => void;
}

/**
 * A reusable component for search and filter controls.
 */
const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
}) => {
  const hasActiveFilters = Object.values(activeFilters).some(val => val && val !== '') || searchTerm !== '';

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white card-wise rounded-lg">
      <div className="relative flex-grow">
        <label htmlFor="dashboard-search" className="sr-only">Search</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wise-gray-400" size={20} />
        <input
          id="dashboard-search"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-wise w-full pl-10"
        />
      </div>
      {filters.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {filters.map((filter) => (
            <div key={filter.id} className="min-w-[200px]">
              <label htmlFor={`filter-${filter.id}`} className="sr-only">{filter.label}</label>
              <select
                id={`filter-${filter.id}`}
                value={activeFilters[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="input-wise w-full"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          aria-label="Clear all filters and search"
        >
          <X size={16} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

export default SearchAndFilter;
