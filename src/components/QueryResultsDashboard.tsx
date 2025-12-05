import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { QueryResult } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { format } from 'date-fns';

interface QueryResultsDashboardProps {
  queryDatasets: { [key: string]: QueryResult[] };
}

type SortField = 'queryName' | 'avgExecutionTimeMongo' | 'avgExecutionTimeCode' | 'totalTime' | 'indexCount';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe', '#ff00ff', '#ff0000'];

export default function QueryResultsDashboard({ queryDatasets }: QueryResultsDashboardProps) {
  const datasetNames = Object.keys(queryDatasets);
  const [selectedDataset, setSelectedDataset] = useState<string>(datasetNames[0] || '');
  const [sortField, setSortField] = useState<SortField>('queryName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (datasetNames.length > 0 && !datasetNames.includes(selectedDataset)) {
      setSelectedDataset(datasetNames[0]);
    }
  }, [datasetNames, selectedDataset]);

  const queryResults = queryDatasets[selectedDataset] || [];

  if (datasetNames.length === 0) {
    return (
      <div className="analytics-dashboard">
        <div className="dashboard-header">
          <h1>Query Performance Analytics</h1>
          <p>No query datasets available. Please ensure query result files are loaded.</p>
        </div>
      </div>
    );
  }

  const categories = useMemo(() => {
    const cats = new Set<string>();
    queryResults.forEach(result => {
      const parts = result.queryName.split('_');
      if (parts.length > 1) {
        cats.add(parts[0]);
      }
    });
    return ['all', ...Array.from(cats).sort()];
  }, [queryResults]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return queryResults;
    return queryResults.filter(r => r.queryName.startsWith(selectedCategory + '_'));
  }, [queryResults, selectedCategory]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'queryName':
          aValue = a.queryName;
          bValue = b.queryName;
          break;
        case 'avgExecutionTimeMongo':
          aValue = a.avgExecutionTimeMongo;
          bValue = b.avgExecutionTimeMongo;
          break;
        case 'avgExecutionTimeCode':
          aValue = a.avgExecutionTimeCode;
          bValue = b.avgExecutionTimeCode;
          break;
        case 'totalTime':
          aValue = a.avgExecutionTimeMongo + a.avgExecutionTimeCode;
          bValue = b.avgExecutionTimeMongo + b.avgExecutionTimeCode;
          break;
        case 'indexCount':
          aValue = a.indexesUsed.length;
          bValue = b.indexesUsed.length;
          break;
        default:
          return 0;
      }

      let comparison: number;
      if (sortField === 'queryName') {
        comparison = (aValue as string).localeCompare(bValue as string);
      } else {
        comparison = (aValue as number) - (bValue as number);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredResults, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const summaryStats = useMemo(() => {
    const totalQueries = queryResults.length;
    const avgMongoTime = queryResults.reduce((sum, r) => sum + r.avgExecutionTimeMongo, 0) / totalQueries;
    const avgCodeTime = queryResults.reduce((sum, r) => sum + r.avgExecutionTimeCode, 0) / totalQueries;
    const totalAvgTime = avgMongoTime + avgCodeTime;
    const slowestMongo = Math.max(...queryResults.map(r => r.avgExecutionTimeMongo));
    const slowestCode = Math.max(...queryResults.map(r => r.avgExecutionTimeCode));
    const uniqueIndexes = new Set(queryResults.flatMap(r => r.indexesUsed)).size;

    return {
      totalQueries,
      avgMongoTime: Math.round(avgMongoTime * 100) / 100,
      avgCodeTime: Math.round(avgCodeTime * 100) / 100,
      totalAvgTime: Math.round(totalAvgTime * 100) / 100,
      slowestMongo: Math.round(slowestMongo * 100) / 100,
      slowestCode: Math.round(slowestCode * 100) / 100,
      uniqueIndexes,
    };
  }, [queryResults]);

  const chartData = sortedResults.map((result) => ({
    name: result.queryName.replace(/_/g, ' '),
    queryName: result.queryName,
    'MongoDB (ms)': Math.round(result.avgExecutionTimeMongo * 100) / 100,
    'Code (ms)': Math.round(result.avgExecutionTimeCode * 100) / 100,
    'Total (ms)': Math.round((result.avgExecutionTimeMongo + result.avgExecutionTimeCode) * 100) / 100,
  }));

  const topSlowestMongo = [...queryResults]
    .sort((a, b) => b.avgExecutionTimeMongo - a.avgExecutionTimeMongo)
    .slice(0, 10)
    .map(r => ({
      name: r.queryName.replace(/_/g, ' '),
      queryName: r.queryName,
      time: Math.round(r.avgExecutionTimeMongo * 100) / 100,
    }));

  const topSlowestCode = [...queryResults]
    .sort((a, b) => b.avgExecutionTimeCode - a.avgExecutionTimeCode)
    .slice(0, 10)
    .map(r => ({
      name: r.queryName.replace(/_/g, ' '),
      queryName: r.queryName,
      time: Math.round(r.avgExecutionTimeCode * 100) / 100,
    }));

  const indexUsage = useMemo(() => {
    const indexMap = new Map<string, number>();
    queryResults.forEach(result => {
      result.indexesUsed.forEach(index => {
        indexMap.set(index, (indexMap.get(index) || 0) + 1);
      });
    });
    return Array.from(indexMap.entries())
      .map(([index, count]) => ({ index, count }))
      .sort((a, b) => b.count - a.count);
  }, [queryResults]);

  const handleExport = () => {
    const exportData = sortedResults.map(result => ({
      'Query Name': result.queryName,
      'Avg MongoDB Time (ms)': Math.round(result.avgExecutionTimeMongo * 100) / 100,
      'Avg Code Time (ms)': Math.round(result.avgExecutionTimeCode * 100) / 100,
      'Total Avg Time (ms)': Math.round((result.avgExecutionTimeMongo + result.avgExecutionTimeCode) * 100) / 100,
      'MongoDB Times': result.executionTimesMongo.join(', '),
      'Code Times': result.executionTimesCode.join(', '),
      'Indexes Used': result.indexesUsed.join(', '),
      'Index Count': result.indexesUsed.length,
    }));

    const columns = [
      { header: 'Query Name', key: 'Query Name', width: 40 },
      { header: 'Avg MongoDB Time (ms)', key: 'Avg MongoDB Time (ms)', width: 20 },
      { header: 'Avg Code Time (ms)', key: 'Avg Code Time (ms)', width: 20 },
      { header: 'Total Avg Time (ms)', key: 'Total Avg Time (ms)', width: 20 },
      { header: 'MongoDB Times', key: 'MongoDB Times', width: 30 },
      { header: 'Code Times', key: 'Code Times', width: 30 },
      { header: 'Indexes Used', key: 'Indexes Used', width: 50 },
      { header: 'Index Count', key: 'Index Count', width: 15 },
    ];

    const datasetSuffix = selectedDataset ? `-${selectedDataset.replace(/\s+/g, '-')}` : '';
    exportToExcel(exportData, columns, `query-results${datasetSuffix}-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Query Performance Analytics</h1>
        {datasetNames.length > 1 && (
          <div className="filters-container" style={{ marginBottom: '1.5rem' }}>
            <h3>Select Dataset</h3>
            <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {datasetNames.map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedDataset(name)}
                  className={selectedDataset === name ? 'active' : ''}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '2px solid #667eea',
                    background: selectedDataset === name ? '#667eea' : 'white',
                    color: selectedDataset === name ? 'white' : '#667eea',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    fontSize: '1rem',
                  }}
                >
                  {name} ({queryDatasets[name]?.length || 0} queries)
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-label">Total Queries</div>
            <div className="stat-value">{summaryStats.totalQueries}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg MongoDB Time</div>
            <div className="stat-value">{summaryStats.avgMongoTime} ms</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Code Time</div>
            <div className="stat-value">{summaryStats.avgCodeTime} ms</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Avg Time</div>
            <div className="stat-value">{summaryStats.totalAvgTime} ms</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Slowest MongoDB</div>
            <div className="stat-value">{summaryStats.slowestMongo} ms</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Slowest Code</div>
            <div className="stat-value">{summaryStats.slowestCode} ms</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Indexes</div>
            <div className="stat-value">{summaryStats.uniqueIndexes}</div>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '2rem' }}>
        <h3>Filter by Category</h3>
        <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'active' : ''}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #667eea',
                background: selectedCategory === cat ? '#667eea' : 'white',
                color: selectedCategory === cat ? 'white' : '#667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <h2>MongoDB vs Code Execution Times</h2>
          <p className="chart-subtitle">Comparison of average execution times (milliseconds)</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="MongoDB (ms)" fill="#8884d8" />
              <Bar dataKey="Code (ms)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>Top 10 Slowest MongoDB Queries</h2>
          <p className="chart-subtitle">Queries with highest MongoDB execution times</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSlowestMongo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip formatter={(value: any) => [`${value} ms`, 'MongoDB Time']} />
              <Bar dataKey="time" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>Top 10 Slowest Code Execution Queries</h2>
          <p className="chart-subtitle">Queries with highest code execution times</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSlowestCode} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip formatter={(value: any) => [`${value} ms`, 'Code Time']} />
              <Bar dataKey="time" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h2>Index Usage Analysis</h2>
          <p className="chart-subtitle">Frequency of index usage across queries</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={indexUsage.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" angle={-45} textAnchor="end" height={120} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8">
                {indexUsage.slice(0, 15).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <div className="section-header">
            <h2>Detailed Query Performance Table</h2>
            <button onClick={handleExport} className="export-button">
              Export to Excel
            </button>
          </div>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('queryName')} className="sortable">
                    Query Name {sortField === 'queryName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('avgExecutionTimeMongo')} className="sortable">
                    Avg MongoDB (ms) {sortField === 'avgExecutionTimeMongo' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('avgExecutionTimeCode')} className="sortable">
                    Avg Code (ms) {sortField === 'avgExecutionTimeCode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('totalTime')} className="sortable">
                    Total Avg (ms) {sortField === 'totalTime' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>MongoDB Times</th>
                  <th>Code Times</th>
                  <th onClick={() => handleSort('indexCount')} className="sortable">
                    Index Count {sortField === 'indexCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Indexes Used</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result) => (
                  <tr key={result.queryName}>
                    <td className="sw-name">
                      <div className="sw-name-container">
                        <span className="sw-label">{result.queryName.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className={result.avgExecutionTimeMongo > 50 ? 'warning' : 'highlight'}>
                      {Math.round(result.avgExecutionTimeMongo * 100) / 100}
                    </td>
                    <td className={result.avgExecutionTimeCode > 100 ? 'warning' : 'highlight'}>
                      {Math.round(result.avgExecutionTimeCode * 100) / 100}
                    </td>
                    <td className="highlight">
                      {Math.round((result.avgExecutionTimeMongo + result.avgExecutionTimeCode) * 100) / 100}
                    </td>
                    <td>
                      <div className="sw-values">
                        {result.executionTimesMongo.map((time, idx) => (
                          <span key={idx} className="sw-badge">
                            {time}ms
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="sw-values">
                        {result.executionTimesCode.map((time, idx) => (
                          <span key={idx} className="sw-badge">
                            {time}ms
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{result.indexesUsed.length}</td>
                    <td>
                      <div className="sw-values">
                        {result.indexesUsed.map((index, idx) => (
                          <span key={idx} className="sw-badge" style={{ background: '#e8f0fe', color: '#667eea' }}>
                            {index}
                          </span>
                        ))}
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

