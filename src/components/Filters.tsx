import { LogEntry } from '../types';
import { useMemo } from 'react';

interface FiltersProps {
  logs: LogEntry[];
  filters: {
    user?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  };
  onFilterChange: (filters: {
    user?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }) => void;
}

export default function Filters({ logs, filters, onFilterChange }: FiltersProps) {
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    logs.forEach((log) => {
      if (log.User) {
        users.add(log.User);
      }
    });
    return Array.from(users).sort();
  }, [logs]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value || undefined;
    onFilterChange({ ...filters, user });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value || undefined;
    onFilterChange({ ...filters, searchTerm });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateFrom = e.target.value ? new Date(e.target.value) : undefined;
    onFilterChange({ ...filters, dateFrom });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateTo = e.target.value ? new Date(e.target.value) : undefined;
    onFilterChange({ ...filters, dateTo });
  };

  return (
    <div className="filters-container">
      <h3>Filters</h3>
      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="user-filter">User:</label>
          <select 
            id="user-filter" 
            value={filters.user || ''} 
            onChange={handleUserChange}
          >
            <option value="">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search-filter">Search:</label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search by Path, User, or Vehicle ID..."
            value={filters.searchTerm || ''}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="date-from">From Date:</label>
          <input
            id="date-from"
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={handleDateFromChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="date-to">To Date:</label>
          <input
            id="date-to"
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={handleDateToChange}
          />
        </div>
      </div>
    </div>
  );
}

