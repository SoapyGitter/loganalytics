import { useMemo, useState } from 'react';
import { LogEntry } from '../types';
import { extractSWValues } from '../utils/dataProcessor';
import { getSWDisplayName, getSWDescription } from '../utils/swNames';
import { format } from 'date-fns';
import { exportToExcel } from '../utils/excelExport';

interface LogTableProps {
  logs: LogEntry[];
}

export default function LogTable({ logs }: LogTableProps) {
  const [sortField, setSortField] = useState<keyof LogEntry | 'timestamp' | 'modelAction'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'timestamp') {
        aValue = a.Metadata?.Created?.$date ? new Date(a.Metadata.Created.$date).getTime() : 0;
        bValue = b.Metadata?.Created?.$date ? new Date(b.Metadata.Created.$date).getTime() : 0;
      } else if (sortField === 'modelAction') {
        aValue = a.RequestBodyDictionary?.ModelAction || '';
        bValue = b.RequestBodyDictionary?.ModelAction || '';
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [logs, sortField, sortDirection]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedLogs.slice(start, start + itemsPerPage);
  }, [sortedLogs, page]);

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

  const handleSort = (field: keyof LogEntry | 'timestamp' | 'modelAction') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSwValues = (log: LogEntry) => {
    return extractSWValues(log);
  };

  const handleExportLogs = () => {
    const exportData = sortedLogs.map(log => {
      const swValues = getSwValues(log);
      const swKeys = Object.keys(swValues).sort();
      const swValuesString = swKeys.map(sw => `${sw.toUpperCase()}: ${swValues[sw]}ms`).join('; ');

      return {
        'Timestamp': log.Metadata?.Created?.$date
          ? format(new Date(log.Metadata.Created.$date), 'yyyy-MM-dd HH:mm:ss')
          : 'N/A',
        'User': log.User || 'N/A',
        'Path': log.Path || 'N/A',
        'Model Action': log.RequestBodyDictionary?.ModelAction || 'N/A',
        'SW Values': swValuesString || 'No SW data',
        'Vehicle ID': log.RequestBodyDictionary?.VehicleId || 'N/A',
        'Lot ID': log.RequestBodyDictionary?.LotId || 'N/A',
        'Status': log.Status || 'N/A',
      };
    });

    const columns = [
      { header: 'Timestamp', key: 'Timestamp', width: 20 },
      { header: 'User', key: 'User', width: 25 },
      { header: 'Path', key: 'Path', width: 30 },
      { header: 'Model Action', key: 'Model Action', width: 15 },
      { header: 'SW Values', key: 'SW Values', width: 50 },
      { header: 'Vehicle ID', key: 'Vehicle ID', width: 40 },
      { header: 'Lot ID', key: 'Lot ID', width: 40 },
      { header: 'Status', key: 'Status', width: 15 },
    ];

    exportToExcel(exportData, columns, `log-entries-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  return (
    <div className="log-table-container">
      <div className="table-header">
        <h2>Log Entries</h2>
        <div className="table-header-actions">
          <button onClick={handleExportLogs} className="export-button">
            Export to Excel
          </button>
          <div className="pagination-info">
            Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, sortedLogs.length)} of {sortedLogs.length}
          </div>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="log-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')} className="sortable">
                Timestamp {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('User')} className="sortable">
                User {sortField === 'User' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('Path')} className="sortable">
                Path {sortField === 'Path' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('modelAction')} 
                className="sortable"
              >
                Model Action {sortField === 'modelAction' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>SW Values (ms)</th>
              <th>Vehicle ID</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => {
              const swValues = getSwValues(log);
              const swKeys = Object.keys(swValues).sort();
              
              return (
                <tr key={log._id}>
                  <td className="timestamp-cell">
                    {log.Metadata?.Created?.$date
                      ? format(new Date(log.Metadata.Created.$date), 'yyyy-MM-dd HH:mm:ss')
                      : 'N/A'}
                  </td>
                  <td>{log.User || 'N/A'}</td>
                  <td>{log.Path || 'N/A'}</td>
                  <td className="model-action-cell">
                    {log.RequestBodyDictionary?.ModelAction || 'N/A'}
                  </td>
                  <td>
                    <div className="sw-values">
                      {swKeys.length > 0 ? (
                        swKeys.map((sw) => {
                          const description = getSWDescription(sw);
                          const tooltip = description 
                            ? `${getSWDisplayName(sw)}\n\n${description}`
                            : getSWDisplayName(sw);
                          
                          return (
                            <span 
                              key={sw} 
                              className={`sw-badge ${swValues[sw] > 100 ? 'warning' : ''}`} 
                              title={tooltip}
                            >
                              <span className="sw-badge-code">{sw.toUpperCase()}: {swValues[sw]}ms</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="no-sw">No SW data</span>
                      )}
                    </div>
                  </td>
                  <td className="id-cell">
                    {log.RequestBodyDictionary?.VehicleId
                      ? (
                        <span className="vehicle-id" title={log.RequestBodyDictionary.VehicleId}>
                          {log.RequestBodyDictionary.VehicleId}
                        </span>
                      )
                      : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

