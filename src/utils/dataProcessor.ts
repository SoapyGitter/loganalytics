import { LogEntry, SWStats, AnalyticsData } from '../types';

export function parseLogData(data: any[]): LogEntry[] {
  if (!Array.isArray(data)) {
    console.error('Log data is not an array:', typeof data);
    return [];
  }
  
  const parsed: LogEntry[] = [];
  let errorCount = 0;
  
  data.forEach((entry, index) => {
    try {
      if (!entry || typeof entry !== 'object') {
        errorCount++;
        return;
      }
      
      parsed.push({
        ...entry,
        Metadata: {
          ...entry.Metadata,
          Created: {
            $date: entry.Metadata?.Created?.$date || new Date().toISOString(),
          },
          Modified: {
            $date: entry.Metadata?.Modified?.$date || new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      errorCount++;
      console.warn(`Error parsing entry at index ${index}:`, error);
    }
  });
  
  if (errorCount > 0) {
    console.warn(`Failed to parse ${errorCount} entries out of ${data.length}`);
  }
  
  console.log(`Successfully parsed ${parsed.length} entries from ${data.length} total`);
  return parsed;
}

export function extractSWValues(logEntry: LogEntry): Record<string, number> {
  const swValues: Record<string, number> = {};
  const regex = /^sw\d+$/i;

  if (logEntry.RequestBodyDictionary) {
    Object.keys(logEntry.RequestBodyDictionary).forEach((key) => {
      if (regex.test(key)) {
        const value = logEntry.RequestBodyDictionary[key];
        if (value) {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            swValues[key] = numValue;
          }
        }
      }
    });
  }

  return swValues;
}

export function calculateAnalytics(logs: LogEntry[]): AnalyticsData {
  const swData: Record<string, number[]> = {};
  const users = new Set<string>();
  const dates: Date[] = [];

  logs.forEach((log) => {
    // Track users
    if (log.User) {
      users.add(log.User);
    }

    // Track dates
    if (log.Metadata?.Created?.$date) {
      dates.push(new Date(log.Metadata.Created.$date));
    }

    // Extract and collect SW values
    const swValues = extractSWValues(log);
    Object.keys(swValues).forEach((sw) => {
      if (!swData[sw]) {
        swData[sw] = [];
      }
      swData[sw].push(swValues[sw]);
    });
  });

  // Calculate statistics for each SW
  const swStats: SWStats[] = Object.keys(swData)
    .sort((a, b) => {
      const aNum = parseInt(a.replace('sw', ''), 10);
      const bNum = parseInt(b.replace('sw', ''), 10);
      return aNum - bNum;
    })
    .map((sw) => {
      const values = swData[sw];
      const sum = values.reduce((acc, val) => acc + val, 0);
      const over10s = values.filter(v => v > 10000).length;
      const over20s = values.filter(v => v > 20000).length;
      const over30s = values.filter(v => v > 30000).length;
      
      return {
        sw,
        average: sum / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        total: sum,
        count: values.length,
        over10ms: over10s,
        over20ms: over20s,
        over30ms: over30s,
      };
    });

  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

  return {
    swStats,
    totalEntries: logs.length,
    uniqueUsers: users.size,
    dateRange: {
      earliest: sortedDates[0] || new Date(),
      latest: sortedDates[sortedDates.length - 1] || new Date(),
    },
  };
}

export function calculateThresholdCounts(
  logs: LogEntry[],
  thresholdSeconds: number
): Record<string, number> {
  const swCounts: Record<string, number> = {};
  const thresholdMs = thresholdSeconds * 1000;

  logs.forEach((log) => {
    const swValues = extractSWValues(log);
    Object.keys(swValues).forEach((sw) => {
      if (!swCounts[sw]) {
        swCounts[sw] = 0;
      }
      if (swValues[sw] > thresholdMs) {
        swCounts[sw]++;
      }
    });
  });

  return swCounts;
}

export function filterLogs(
  logs: LogEntry[],
  filters: {
    user?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }
): LogEntry[] {
  return logs.filter((log) => {
    // Filter by user
    if (filters.user && log.User !== filters.user) {
      return false;
    }

    // Filter by date range
    if (log.Metadata?.Created?.$date) {
      const logDate = new Date(log.Metadata.Created.$date);
      logDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) {
          return false;
        }
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end day
        if (logDate > toDate) {
          return false;
        }
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesPath = log.Path?.toLowerCase().includes(searchLower);
      const matchesUser = log.User?.toLowerCase().includes(searchLower);
      const matchesVehicleId = log.RequestBodyDictionary?.VehicleId?.toLowerCase().includes(searchLower);
      
      if (!matchesPath && !matchesUser && !matchesVehicleId) {
        return false;
      }
    }

    return true;
  });
}

