import { useState, useMemo, useEffect } from 'react';
import { LogEntry, QueryResult } from './types';
import { parseLogData, filterLogs } from './utils/dataProcessor';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LogTable from './components/LogTable';
import QueryResultsDashboard from './components/QueryResultsDashboard';
import Filters from './components/Filters';
import './App.css';

interface QueryDatasets {
  [key: string]: QueryResult[];
}

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queryDatasets, setQueryDatasets] = useState<QueryDatasets>({});
  const [activeTab, setActiveTab] = useState<'analytics' | 'logs' | 'queries'>('analytics');
  const [filters, setFilters] = useState<{
    user?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }>({});

  useEffect(() => {
    const loadLogData = async () => {
      try {
        // Load from public directory
        const response = await fetch('/_Biddo_Logger.Logs.json');
        if (!response.ok) {
          throw new Error('Failed to load log data');
        }
        
        const text = await response.text();
        console.log(`Response size: ${text.length} characters`);
        
        const logData = JSON.parse(text);
        console.log(`Parsed JSON, type: ${Array.isArray(logData) ? 'array' : typeof logData}, length: ${Array.isArray(logData) ? logData.length : 'N/A'}`);
        
        const parsed = parseLogData(logData);
        console.log(`Loaded ${parsed.length} log entries`);
        
        if (parsed.length !== logData.length) {
          console.warn(`Warning: Parsed ${parsed.length} entries but JSON has ${logData.length} entries`);
        }
        
        setLogs(parsed);
      } catch (error) {
        console.error('Error loading log data:', error);
        if (error instanceof SyntaxError) {
          console.error('JSON parsing error - file might be corrupted or truncated');
        }
      }
    };

    const loadQueryResults = async () => {
      const datasets: QueryDatasets = {};
      
      const files = [
        { name: 'Default', path: '/queries/queryResults.json' },
        { name: 'Filters', path: '/queries/queryResultsFilters.json' },
        { name: 'Search', path: '/queries/queryResultsSearch.json' },
        { name: 'Search + Filters', path: '/queries/queryResultsSearchFilters.json' },
      ];

      for (const file of files) {
        try {
          const response = await fetch(file.path);
          if (!response.ok) {
            console.warn(`Failed to load ${file.name} query results`);
            continue;
          }
          
          const data = await response.json();
          console.log(`Loaded ${file.name}: ${data.results?.length || 0} query results`);
          
          if (data.results) {
            datasets[file.name] = data.results;
          }
        } catch (error) {
          console.error(`Error loading ${file.name} query results:`, error);
        }
      }

      setQueryDatasets(datasets);
    };

    loadLogData();
    loadQueryResults();
  }, []);

  const filteredLogs = useMemo(() => {
    return filterLogs(logs, filters);
  }, [logs, filters]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Biddo Logger Analytics</h1>
        <nav className="tab-nav">
          <button
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button
            className={activeTab === 'logs' ? 'active' : ''}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button
            className={activeTab === 'queries' ? 'active' : ''}
            onClick={() => setActiveTab('queries')}
          >
            Query Results
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'analytics' ? (
          <>
            <Filters logs={logs} filters={filters} onFilterChange={setFilters} />
            <AnalyticsDashboard logs={filteredLogs} filters={filters} />
          </>
        ) : activeTab === 'logs' ? (
          <>
            <Filters logs={logs} filters={filters} onFilterChange={setFilters} />
            <LogTable logs={filteredLogs} />
          </>
        ) : (
          <QueryResultsDashboard 
            queryDatasets={queryDatasets} 
            onDatasetAdd={(name, results) => {
              setQueryDatasets(prev => ({
                ...prev,
                [name]: results,
              }));
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;

