# Log Analytics Dashboard

A React application for visualizing and analyzing log data from Biddo Logger, with a focus on Stopwatch (SW) performance metrics.

## Features

- **Analytics Dashboard**: Visual charts and statistics showing:
  - Average, min, max execution times for each Stopwatch
  - Top 5 slowest stopwatches
  - Total entries and unique users
  - Date range analysis

- **Log Table**: Detailed view of all log entries with:
  - Sortable columns
  - Pagination
  - SW values displayed with visual indicators
  - Search and filter capabilities

- **Filtering**: Filter logs by:
  - User
  - Date range
  - Search term (Path, User, Vehicle ID)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
loganalytics/
├── src/
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx  # Main analytics visualization
│   │   ├── LogTable.tsx            # Log entries table
│   │   └── Filters.tsx             # Filter controls
│   ├── utils/
│   │   └── dataProcessor.ts        # Data parsing and analytics
│   ├── types.ts                    # TypeScript types
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── App.css                     # Styles
├── _Biddo_Logger.Logs.json         # Log data file
└── package.json
```

## Technologies Used

- React 18
- TypeScript
- Vite
- Recharts (for data visualization)
- date-fns (for date formatting)

## Data Structure

The application expects log entries with the following structure:
- `RequestBodyDictionary` containing SW values (sw1, sw2, sw8, etc.) as strings in milliseconds
- `Metadata.Created.$date` for timestamps
- `User`, `Path`, and other metadata fields

## Analytics

The dashboard calculates and displays:
- **Average time**: Mean execution time per SW across all entries
- **Max time**: Highest execution time recorded
- **Min time**: Lowest execution time recorded
- **Total time**: Sum of all execution times
- **Count**: Number of entries containing each SW

Stopwatches are automatically sorted by their numeric identifier (sw1, sw2, sw8, etc.)

