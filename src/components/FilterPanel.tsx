import React from 'react';
import { Recipe, FilterOptions } from '../types';

interface FilterPanelProps {
  recipes: Recipe[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ recipes, filters, onFiltersChange }) => {
  const getUniqueValues = (key: keyof Recipe) => {
    const values = recipes.map(recipe => recipe[key] as string).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleRangeChange = (key: 'prepTimeRange' | 'cookTimeRange', index: number, value: number) => {
    const newRange = [...filters[key]] as [number, number];
    newRange[index] = value;
    onFiltersChange({
      ...filters,
      [key]: newRange
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Diet Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
        <select
          value={filters.diet}
          onChange={(e) => handleFilterChange('diet', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">All diets</option>
          {getUniqueValues('diet').map(diet => (
            <option key={diet} value={diet}>{diet}</option>
          ))}
        </select>
      </div>

      {/* Course Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
        <select
          value={filters.course}
          onChange={(e) => handleFilterChange('course', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">All courses</option>
          {getUniqueValues('course').map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
      </div>

      {/* Region Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
        <select
          value={filters.region}
          onChange={(e) => handleFilterChange('region', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">All regions</option>
          {getUniqueValues('region').map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Flavor Profile Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Flavor Profile</label>
        <select
          value={filters.flavorProfile}
          onChange={(e) => handleFilterChange('flavorProfile', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">All flavors</option>
          {getUniqueValues('flavorProfile').map(flavor => (
            <option key={flavor} value={flavor}>{flavor}</option>
          ))}
        </select>
      </div>

      {/* Prep Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prep Time: {filters.prepTimeRange[0]}-{filters.prepTimeRange[1]} minutes
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="120"
            value={filters.prepTimeRange[0]}
            onChange={(e) => handleRangeChange('prepTimeRange', 0, parseInt(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="120"
            value={filters.prepTimeRange[1]}
            onChange={(e) => handleRangeChange('prepTimeRange', 1, parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Cook Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cook Time: {filters.cookTimeRange[0]}-{filters.cookTimeRange[1]} minutes
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="120"
            value={filters.cookTimeRange[0]}
            onChange={(e) => handleRangeChange('cookTimeRange', 0, parseInt(e.target.value))}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="120"
            value={filters.cookTimeRange[1]}
            onChange={(e) => handleRangeChange('cookTimeRange', 1, parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;