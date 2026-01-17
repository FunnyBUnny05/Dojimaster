# TradingView Chart Viewer

A professional, dark-themed web application for visualizing TradingView CSV exports as interactive candlestick charts. Built specifically for clean chart rendering optimized for AI vision analysis and pattern recognition.

## Features

- **CSV Upload**: Drag-and-drop or click to upload TradingView CSV exports
- **Auto-Mapping**: Automatically detects and maps TradingView column headers (Time, Open, High, Low, Close, Volume)
- **Interactive Candlestick Charts**: Powered by TradingView's lightweight-charts library
- **Volume Histogram**: Overlaid volume bars with color-coded buy/sell pressure
- **Screenshot Export**: One-click PNG export optimized for AI vision models
- **Dark Theme**: Professional trading interface with high-contrast visuals
- **Responsive Design**: Full-screen chart rendering that adapts to your viewport
- **Clear Candlesticks**: Green/Red color scheme with distinct wicks for easy pattern recognition

## Why This Tool?

### Standardization
TradingView CSVs can have varying header formats depending on the asset type. This app normalizes the data before any AI processing, ensuring consistent results.

### Vision Optimization
Standard AI models can struggle with cluttered TradingView screenshots (ads, sidebars, social feeds). This app provides clean, high-contrast charts that make it much easier for AI to identify patterns like:
- Rising/Falling Wedges
- Head and Shoulders
- Double Tops/Bottoms
- Triangle patterns
- Support/Resistance levels

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charting**: lightweight-charts (by TradingView)
- **CSV Parsing**: papaparse
- **Screenshot**: html2canvas

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Export from TradingView**:
   - Open your chart on TradingView
   - Click the clock icon (bottom toolbar)
   - Right-click on the data table
   - Select "Export chart data"
   - Save as CSV

2. **Upload to App**:
   - Drag and drop the CSV file onto the upload zone
   - OR click "Upload CSV" to browse for the file

3. **Interact with Chart**:
   - Pan: Click and drag
   - Zoom: Scroll wheel or pinch gesture
   - Crosshair: Hover to see OHLC values

4. **Export Screenshot**:
   - Click "Download Screenshot"
   - High-resolution PNG saved to downloads
   - Optimized for AI vision analysis

## File Structure

```
Dojimaster/
├── public/
├── src/
│   ├── components/
│   │   └── CandlestickChart.jsx    # Main chart component
│   ├── App.jsx                     # Root component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles with Tailwind
├── index.html                      # HTML template
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── vite.config.js                  # Vite build config
├── package.json                    # Dependencies
└── README.md                       # This file
```

## CSV Format Requirements

The app auto-detects columns with the following names (case-insensitive):

| Required | Column Names |
|----------|--------------|
| ✓ | Time, Date, DateTime, Timestamp |
| ✓ | Open |
| ✓ | High |
| ✓ | Low |
| ✓ | Close |
| - | Volume, Vol (optional) |

### Example CSV Format

```csv
Time,Open,High,Low,Close,Volume
2024-01-01 00:00,45000,45500,44800,45200,1500
2024-01-01 01:00,45200,45600,45000,45400,1800
...
```

## Chart Customization

To modify chart appearance, edit `/src/components/CandlestickChart.jsx`:

```javascript
// Candlestick colors
const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#22c55e',      // Green for bullish
  downColor: '#ef4444',    // Red for bearish
  borderUpColor: '#22c55e',
  borderDownColor: '#ef4444',
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
});
```

## Troubleshooting

### CSV Not Loading
- Ensure the file is a valid CSV with proper headers
- Check that Time/Date column is in a recognizable format
- Verify OHLC columns contain numeric values

### Chart Not Rendering
- Check browser console for errors
- Ensure all dependencies are installed (`npm install`)
- Try refreshing the page

### Screenshot Quality
- Screenshots are rendered at 2x scale for better quality
- Larger screens produce higher resolution screenshots
- For best results, maximize the browser window before capturing

## Performance Notes

The app handles large datasets efficiently, but for optimal performance:
- Files with 10,000+ candles may take a few seconds to process
- Consider filtering to relevant time ranges in TradingView before exporting
- The built version (`npm run build`) is faster than dev mode

## License

MIT

## Contributing

Issues and pull requests welcome!
