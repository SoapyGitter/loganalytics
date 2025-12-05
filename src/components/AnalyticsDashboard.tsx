import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LogEntry } from '../types';
import { calculateAnalytics, calculateThresholdCounts } from '../utils/dataProcessor';
import { getSWName, getSWDescription } from '../utils/swNames';
import { format } from 'date-fns';
import { exportToExcel } from '../utils/excelExport';

interface AnalyticsDashboardProps {
  logs: LogEntry[];
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  };
}

type SortField = 'sw' | 'count' | 'average' | 'min' | 'max' | 'total' | 'over10ms' | 'over20ms' | 'over30ms';

export default function AnalyticsDashboard({ logs, filters }: AnalyticsDashboardProps) {
  const [sortField, setSortField] = useState<SortField>('sw');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [threshold1, setThreshold1] = useState<number>(10);
  const [threshold2, setThreshold2] = useState<number>(20);
  const [threshold3, setThreshold3] = useState<number>(30);

  const analytics = useMemo(() => calculateAnalytics(logs), [logs]);

  const thresholdCounts1 = useMemo(() => calculateThresholdCounts(logs, threshold1), [logs, threshold1]);
  const thresholdCounts2 = useMemo(() => calculateThresholdCounts(logs, threshold2), [logs, threshold2]);
  const thresholdCounts3 = useMemo(() => calculateThresholdCounts(logs, threshold3), [logs, threshold3]);

  const sortedStats = useMemo(() => {
    return [...analytics.swStats].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'sw':
          aValue = a.sw;
          bValue = b.sw;
          break;
        case 'count':
          aValue = a.count;
          bValue = b.count;
          break;
        case 'average':
          aValue = a.average;
          bValue = b.average;
          break;
        case 'min':
          aValue = a.min;
          bValue = b.min;
          break;
        case 'max':
          aValue = a.max;
          bValue = b.max;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'over10ms':
          aValue = thresholdCounts1[a.sw] || 0;
          bValue = thresholdCounts1[b.sw] || 0;
          break;
        case 'over20ms':
          aValue = thresholdCounts2[a.sw] || 0;
          bValue = thresholdCounts2[b.sw] || 0;
          break;
        case 'over30ms':
          aValue = thresholdCounts3[a.sw] || 0;
          bValue = thresholdCounts3[b.sw] || 0;
          break;
        default:
          return 0;
      }

      // String comparison for 'sw', number comparison for others
      let comparison: number;
      if (sortField === 'sw') {
        const aNum = parseInt((aValue as string).replace('sw', ''), 10);
        const bNum = parseInt((bValue as string).replace('sw', ''), 10);
        comparison = aNum - bNum;
      } else {
        comparison = (aValue as number) - (bValue as number);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [analytics.swStats, sortField, sortDirection, thresholdCounts1, thresholdCounts2, thresholdCounts3]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportStats = () => {
    const exportData = sortedStats.map(stat => {
      const over1 = thresholdCounts1[stat.sw] || 0;
      const over2 = thresholdCounts2[stat.sw] || 0;
      const over3 = thresholdCounts3[stat.sw] || 0;
      
      const row: Record<string, any> = {
        'Stopwatch Code': stat.sw.toUpperCase(),
        'Stopwatch Name': getSWName(stat.sw),
        'Description': getSWDescription(stat.sw),
        'Count': stat.count,
        'Average (ms)': Math.round(stat.average * 100) / 100,
        'Min (ms)': stat.min,
        'Max (ms)': stat.max,
        'Total (ms)': Math.round(stat.total),
      };
      
      row[`Over ${threshold1}s`] = over1;
      row[`Over ${threshold1}s %`] = stat.count > 0 ? Math.round((over1 / stat.count) * 10000) / 100 : 0;
      row[`Over ${threshold2}s`] = over2;
      row[`Over ${threshold2}s %`] = stat.count > 0 ? Math.round((over2 / stat.count) * 10000) / 100 : 0;
      row[`Over ${threshold3}s`] = over3;
      row[`Over ${threshold3}s %`] = stat.count > 0 ? Math.round((over3 / stat.count) * 10000) / 100 : 0;
      
      return row;
    });

    const columns = [
      { header: 'Stopwatch Code', key: 'Stopwatch Code', width: 15 },
      { header: 'Stopwatch Name', key: 'Stopwatch Name', width: 40 },
      { header: 'Description', key: 'Description', width: 80 },
      { header: 'Count', key: 'Count', width: 10 },
      { header: 'Average (ms)', key: 'Average (ms)', width: 15 },
      { header: 'Min (ms)', key: 'Min (ms)', width: 12 },
      { header: 'Max (ms)', key: 'Max (ms)', width: 12 },
      { header: 'Total (ms)', key: 'Total (ms)', width: 15 },
      { header: `Over ${threshold1}s`, key: `Over ${threshold1}s`, width: 12 },
      { header: `Over ${threshold1}s %`, key: `Over ${threshold1}s %`, width: 12 },
      { header: `Over ${threshold2}s`, key: `Over ${threshold2}s`, width: 12 },
      { header: `Over ${threshold2}s %`, key: `Over ${threshold2}s %`, width: 12 },
      { header: `Over ${threshold3}s`, key: `Over ${threshold3}s`, width: 12 },
      { header: `Over ${threshold3}s %`, key: `Over ${threshold3}s %`, width: 12 },
    ];

    exportToExcel(exportData, columns, `stopwatch-statistics-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const chartData = sortedStats.map((stat) => ({
    name: getSWName(stat.sw),
    swCode: stat.sw.toUpperCase(),
    Average: Math.round(stat.average * 100) / 100,
    Max: stat.max,
    Min: stat.min,
    Total: stat.total,
  }));

  const sortedByAvg = [...analytics.swStats].sort((a, b) => b.average - a.average);
  const topSlowest = sortedByAvg.slice(0, 5);

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Log Analytics Dashboard</h1>
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value">{analytics.totalEntries.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Users</div>
            <div className="stat-value">{analytics.uniqueUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Date Range</div>
            <div className="stat-value">
              {filters?.dateFrom || filters?.dateTo ? (
                <div className="date-range-filtered">
                  <div className="filtered-dates">
                    {filters.dateFrom ? format(filters.dateFrom, 'MMM dd, yyyy') : 'Start'} - {filters.dateTo ? format(filters.dateTo, 'MMM dd, yyyy') : 'End'}
                  </div>
                  <div className="actual-range">
                    (Data: {format(analytics.dateRange.earliest, 'MMM dd')} - {format(analytics.dateRange.latest, 'MMM dd')})
                  </div>
                </div>
              ) : (
                <div>
                  {format(analytics.dateRange.earliest, 'MMM dd, yyyy')} - {format(analytics.dateRange.latest, 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h2>Stopwatch Performance Overview</h2>
          <p className="chart-subtitle">Average execution time per Stopwatch (milliseconds)</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [value, name]}
                labelFormatter={(label) => {
                  const stat = chartData.find(d => d.name === label);
                  return stat ? `${stat.swCode}: ${label}` : label;
                }}
              />
              <Legend />
              <Bar dataKey="Average" fill="#8884d8" />
              <Bar dataKey="Max" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>Slowest Stopwatches</h2>
          <p className="chart-subtitle">Top 5 stopwatches by average execution time</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={topSlowest.map((stat) => ({
                name: getSWName(stat.sw),
                swCode: stat.sw.toUpperCase(),
                Average: Math.round(stat.average * 100) / 100,
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip 
                formatter={(value: any) => [`${value} ms`, 'Average']}
                labelFormatter={(label) => {
                  const stat = topSlowest.find(s => getSWName(s.sw) === label);
                  return stat ? `${stat.sw.toUpperCase()}: ${label}` : label;
                }}
              />
              <Bar dataKey="Average" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <div className="section-header">
            <h2>Detailed Statistics Table</h2>
            <button onClick={handleExportStats} className="export-button">
              Export to Excel
            </button>
          </div>
          <div className="threshold-controls">
            <div className="threshold-controls-header">
              <h3>Performance Thresholds</h3>
              <span className="threshold-subtitle">Set custom thresholds to analyze execution times</span>
            </div>
            <div className="threshold-inputs">
              <div className="threshold-input-group">
                <label htmlFor="threshold1">Threshold 1</label>
                <div className="threshold-input-wrapper">
                  <input
                    id="threshold1"
                    type="number"
                    min="1"
                    value={threshold1}
                    onChange={(e) => setThreshold1(parseInt(e.target.value) || 10)}
                    className="threshold-input"
                  />
                  <span className="threshold-unit">seconds</span>
                </div>
              </div>
              <div className="threshold-input-group">
                <label htmlFor="threshold2">Threshold 2</label>
                <div className="threshold-input-wrapper">
                  <input
                    id="threshold2"
                    type="number"
                    min="1"
                    value={threshold2}
                    onChange={(e) => setThreshold2(parseInt(e.target.value) || 20)}
                    className="threshold-input"
                  />
                  <span className="threshold-unit">seconds</span>
                </div>
              </div>
              <div className="threshold-input-group">
                <label htmlFor="threshold3">Threshold 3</label>
                <div className="threshold-input-wrapper">
                  <input
                    id="threshold3"
                    type="number"
                    min="1"
                    value={threshold3}
                    onChange={(e) => setThreshold3(parseInt(e.target.value) || 30)}
                    className="threshold-input"
                  />
                  <span className="threshold-unit">seconds</span>
                </div>
              </div>
            </div>
          </div>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('sw')} 
                    className="sortable"
                  >
                    Stopwatch {sortField === 'sw' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Description</th>
                  <th 
                    onClick={() => handleSort('count')} 
                    className="sortable"
                  >
                    Count {sortField === 'count' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('average')} 
                    className="sortable"
                  >
                    Average (ms) {sortField === 'average' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('min')} 
                    className="sortable"
                  >
                    Min (ms) {sortField === 'min' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('max')} 
                    className="sortable"
                  >
                    Max (ms) {sortField === 'max' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('total')} 
                    className="sortable"
                  >
                    Total (ms) {sortField === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('over10ms')} 
                    className="sortable"
                    title={`Number of times execution exceeded ${threshold1} seconds`}
                  >
                    Over {threshold1}s {sortField === 'over10ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('over20ms')} 
                    className="sortable"
                    title={`Number of times execution exceeded ${threshold2} seconds`}
                  >
                    Over {threshold2}s {sortField === 'over20ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('over30ms')} 
                    className="sortable"
                    title={`Number of times execution exceeded ${threshold3} seconds`}
                  >
                    Over {threshold3}s {sortField === 'over30ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((stat) => (
                  <tr key={stat.sw}>
                    <td className="sw-name">
                      <div className="sw-name-container">
                        <span className="sw-code">{stat.sw.toUpperCase()}</span>
                        <span className="sw-label">{getSWName(stat.sw)}</span>
                      </div>
                    </td>
                    <td className="sw-description">
                      {getSWDescription(stat.sw) || 'No description available'}
                    </td>
                    <td>{stat.count.toLocaleString()}</td>
                    <td className="highlight">{Math.round(stat.average * 100) / 100}</td>
                    <td>{stat.min}</td>
                    <td className="warning">{stat.max}</td>
                    <td>{Math.round(stat.total).toLocaleString()}</td>
                    <td className="threshold-cell">
                      <div className="threshold-value">{(thresholdCounts1[stat.sw] || 0).toLocaleString()}</div>
                      <div className="threshold-percentage">
                        ({stat.count > 0 ? Math.round(((thresholdCounts1[stat.sw] || 0) / stat.count) * 10000) / 100 : 0}%)
                      </div>
                    </td>
                    <td className="threshold-cell">
                      <div className="threshold-value">{(thresholdCounts2[stat.sw] || 0).toLocaleString()}</div>
                      <div className="threshold-percentage">
                        ({stat.count > 0 ? Math.round(((thresholdCounts2[stat.sw] || 0) / stat.count) * 10000) / 100 : 0}%)
                      </div>
                    </td>
                    <td className="threshold-cell">
                      <div className="threshold-value">{(thresholdCounts3[stat.sw] || 0).toLocaleString()}</div>
                      <div className="threshold-percentage">
                        ({stat.count > 0 ? Math.round(((thresholdCounts3[stat.sw] || 0) / stat.count) * 10000) / 100 : 0}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

