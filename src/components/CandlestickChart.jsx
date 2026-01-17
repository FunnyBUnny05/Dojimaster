import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

const CandlestickChart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0f0f0f' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2e2e2e',
      },
      timeScale: {
        borderColor: '#2e2e2e',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart when data changes
  useEffect(() => {
    if (chartData && candlestickSeriesRef.current && volumeSeriesRef.current) {
      candlestickSeriesRef.current.setData(chartData.candlesticks);
      if (chartData.volumes.length > 0) {
        volumeSeriesRef.current.setData(chartData.volumes);
      }
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  // Parse CSV file
  const parseCSV = (file) => {
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = processCSVData(results.data);
          setChartData(data);
          setIsProcessing(false);
        } catch (err) {
          setError(err.message);
          setIsProcessing(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setIsProcessing(false);
      },
    });
  };

  // Process and normalize CSV data
  const processCSVData = (data) => {
    if (!data || data.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Auto-detect column names (case-insensitive mapping)
    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    const columnMap = {
      time: null,
      open: null,
      high: null,
      low: null,
      close: null,
      volume: null,
    };

    // Try to find matching columns
    keys.forEach(key => {
      const lowerKey = key.toLowerCase().trim();

      if (lowerKey === 'time' || lowerKey === 'date' || lowerKey === 'datetime' || lowerKey === 'timestamp') {
        columnMap.time = key;
      } else if (lowerKey === 'open') {
        columnMap.open = key;
      } else if (lowerKey === 'high') {
        columnMap.high = key;
      } else if (lowerKey === 'low') {
        columnMap.low = key;
      } else if (lowerKey === 'close') {
        columnMap.close = key;
      } else if (lowerKey === 'volume' || lowerKey === 'vol') {
        columnMap.volume = key;
      }
    });

    // Validate required columns
    if (!columnMap.time || !columnMap.open || !columnMap.high || !columnMap.low || !columnMap.close) {
      throw new Error(`Missing required columns. Found: ${keys.join(', ')}`);
    }

    const candlesticks = [];
    const volumes = [];

    data.forEach((row, index) => {
      try {
        // Parse time - handle various formats
        let time;
        const timeStr = row[columnMap.time];

        if (!timeStr) return; // Skip rows with no time

        // Try to parse as timestamp or date
        const parsedDate = new Date(timeStr);
        if (!isNaN(parsedDate.getTime())) {
          time = Math.floor(parsedDate.getTime() / 1000); // Convert to seconds
        } else {
          // Try parsing as Unix timestamp
          time = parseInt(timeStr);
          if (isNaN(time)) return; // Skip invalid times
        }

        const open = parseFloat(row[columnMap.open]);
        const high = parseFloat(row[columnMap.high]);
        const low = parseFloat(row[columnMap.low]);
        const close = parseFloat(row[columnMap.close]);

        // Validate OHLC data
        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
          return; // Skip invalid rows
        }

        candlesticks.push({ time, open, high, low, close });

        // Add volume if available
        if (columnMap.volume && row[columnMap.volume]) {
          const volume = parseFloat(row[columnMap.volume]);
          if (!isNaN(volume)) {
            const color = close >= open ? '#22c55e80' : '#ef444480';
            volumes.push({ time, value: volume, color });
          }
        }
      } catch (err) {
        console.warn(`Skipping row ${index + 1}: ${err.message}`);
      }
    });

    if (candlesticks.length === 0) {
      throw new Error('No valid candlestick data found in CSV');
    }

    // Sort by time
    candlesticks.sort((a, b) => a.time - b.time);
    volumes.sort((a, b) => a.time - b.time);

    return { candlesticks, volumes };
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      parseCSV(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      parseCSV(file);
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  // Download screenshot
  const downloadScreenshot = async () => {
    if (!chartContainerRef.current) return;

    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#0f0f0f',
        scale: 2, // Higher quality
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `chart-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      setError(`Screenshot error: ${err.message}`);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2e2e2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">TradingView Chart Viewer</h1>
          {fileName && (
            <span className="text-sm text-gray-400 bg-[#0f0f0f] px-3 py-1 rounded">
              {fileName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            Upload CSV
          </label>

          {/* Screenshot Button */}
          {chartData && (
            <button
              onClick={downloadScreenshot}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Download Screenshot
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!chartData && !isProcessing && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <svg
              className="w-16 h-16 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="text-center">
              <p className="text-lg text-gray-300 mb-2">
                Drag and drop your CSV file here
              </p>
              <p className="text-sm text-gray-500">or click Upload CSV to browse</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Processing CSV file...</p>
          </div>
        )}

        {chartData && !isProcessing && (
          <div
            ref={chartContainerRef}
            className="w-full h-full rounded-lg overflow-hidden"
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
