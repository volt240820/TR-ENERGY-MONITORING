import { TransformerDataPoint } from '../types';

// Google Sheet CSV Export URL (Default)
const DEFAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/1K8w405s3SthSLFbYdYT1PAnpnuzGMUOl0qxQDSiCKs8/export?format=csv&gid=69853061`;

// Helper to parse date string
const parseDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();

  // Remove quotes if present
  const cleanStr = dateStr.replace(/['"]/g, '').trim();
  
  const timestamp = Date.parse(cleanStr);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  try {
    // Fallback for Custom Format
    const match = cleanStr.match(/(\d{4})[\.\-/]\s*(\d{1,2})[\.\-/]\s*(\d{1,2})[\.\-]?\s*(\d{1,2}):(\d{2})(:(\d{2}))?/);
    if (match) {
      const [_, year, month, day, hour, minute, __, second] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        second ? parseInt(second) : 0
      );
      return date.toISOString();
    }
  } catch (e) {
    console.error("Failed to parse date", cleanStr, e);
  }
  return new Date().toISOString();
};

// Robust function to parse CSV text into Data Points dynamically
export const parseCSVData = (text: string): TransformerDataPoint[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // --- 1. Header Analysis ---
    // Keep original casing for display, but lower for detection
    const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const lowerHeaders = originalHeaders.map(h => h.toLowerCase());

    // Find "Timestamp" column index
    let timestampIdx = lowerHeaders.findIndex(h => 
        h.includes('일시') || h.includes('date') || h.includes('time') || h.includes('timestamp') || h.includes('시간')
    );
    
    // Default to column 0 if not found
    if (timestampIdx === -1) timestampIdx = 0;

    // Identify Data Columns
    // Any column that is NOT the timestamp column AND has a non-empty header is considered a data column.
    const dataColumnIndices: number[] = [];
    originalHeaders.forEach((header, idx) => {
        if (idx !== timestampIdx && header && header.trim() !== '') {
            dataColumnIndices.push(idx);
        }
    });

    // --- 2. Data Parsing ---
    const data: TransformerDataPoint[] = [];

    // Start from line 1 (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');

      // If row is too short to even have the timestamp, skip
      if (parts.length <= timestampIdx) continue;

      const dateStr = parts[timestampIdx];
      const timestamp = parseDate(dateStr);
      
      const point: TransformerDataPoint = { timestamp };
      let hasValidData = false;

      dataColumnIndices.forEach(colIdx => {
          if (colIdx < parts.length) {
              const headerName = originalHeaders[colIdx];
              const valStr = parts[colIdx];
              
              if (!valStr || valStr.trim() === '') {
                  point[headerName] = null;
              } else {
                  const cleanVal = valStr.replace(/^"|"$/g, '').trim();
                  const num = parseFloat(cleanVal);
                  
                  if (isNaN(num)) {
                      point[headerName] = null;
                  } else {
                      point[headerName] = num;
                      hasValidData = true;
                  }
              }
          }
      });
      
      // Only add row if it parsed correctly
      if (point.timestamp) {
          data.push(point);
      }
    }
    
    return data;
};

export const fetchTransformerData = async (customUrl?: string): Promise<TransformerDataPoint[]> => {
  const targetUrl = customUrl || DEFAULT_CSV_URL;
  
  // Cache Buster: Add unique timestamp to URL to prevent browser/proxy caching
  const timestamp = new Date().getTime();
  const getUrlWithTimestamp = (url: string) => {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}_t=${timestamp}`;
  };

  const strategies = [
    { 
        name: 'Direct', 
        url: getUrlWithTimestamp(targetUrl) 
    },
    { 
        name: 'CorsProxy.io', 
        // We add the timestamp to the inner URL so the proxy fetches a fresh copy
        url: `https://corsproxy.io/?${encodeURIComponent(getUrlWithTimestamp(targetUrl))}` 
    },
    { 
        name: 'AllOrigins', 
        // AllOrigins might cache its own response, so we add a param to the wrapper URL too if needed,
        // but adding it to the source URL usually forces a refresh.
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent(getUrlWithTimestamp(targetUrl))}` 
    }
  ];

  for (const strategy of strategies) {
      try {
          const response = await fetch(strategy.url);
          if (!response.ok) {
              console.warn(`[DataFetch] Strategy '${strategy.name}' failed with status: ${response.status}`);
              continue;
          }
          const text = await response.text();
          
          // Basic validation of CSV content
          if (text.trim().startsWith('<') || text.includes('Error')) {
               // Some error pages are HTML. If it doesn't look like CSV (no commas), reject it.
               if (!text.includes(',')) {
                   throw new Error("Invalid content received (HTML or Error)");
               }
          }
          return parseCSVData(text);
      } catch (e) {
          console.warn(`[DataFetch] Strategy '${strategy.name}' threw error:`, e);
      }
  }

  throw new Error("모든 데이터 연결 시도가 실패했습니다. 인터넷 연결을 확인하거나 나중에 다시 시도해주세요.");
};

export const generateData = (periods: number = 0): TransformerDataPoint[] => {
  return [];
};