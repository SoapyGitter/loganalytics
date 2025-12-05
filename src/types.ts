export interface LogEntry {
  _id: string;
  Metadata: {
    Created: {
      $date: string;
    };
    Modified: {
      $date: string;
    };
  };
  Status: string | null;
  RequestBody: string | null;
  RequestBodyDictionary: {
    ModelAction?: string;
    VehicleId?: string;
    LotId?: string;
    [key: string]: string | undefined;
  };
  ResponseBody: string | null;
  RequestHeaders: any;
  ResponseHeaders: any;
  Path: string;
  Query: string | null;
  User: string;
}

export interface SWStats {
  sw: string;
  average: number;
  max: number;
  min: number;
  total: number;
  count: number;
  over10ms: number;
  over20ms: number;
  over30ms: number;
}

export interface AnalyticsData {
  swStats: SWStats[];
  totalEntries: number;
  uniqueUsers: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

export interface QueryResult {
  queryName: string;
  avgExecutionTimeMongo: number;
  avgExecutionTimeCode: number;
  executionTimesMongo: number[];
  executionTimesCode: number[];
  indexesUsed: string[];
}

export interface QueryResultsData {
  results: QueryResult[];
}

