
import React, { useMemo, useState, useEffect } from 'react';
import { fetchTransformerData, parseCSVData } from './utils/dataGenerator';
import { TransformerDataPoint, TransformerConfig, CHART_PALETTE } from './types';
import Sidebar from './components/Sidebar';
import KPICard from './components/KPICard';
import TransformerRow from './components/TransformerRow';
import TransformerGridCard from './components/TransformerGridCard';
import WeatherWidget from './components/WeatherWidget';
import { Zap, Activity, Loader2, RefreshCw, Play, Pause, LayoutGrid, List, Download, Database } from 'lucide-react';

const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/1K8w405s3SthSLFbYdYT1PAnpnuzGMUOl0qxQDSiCKs8/export?format=csv&gid=69853061`;

const App: React.FC = () => {
  // --- 1. State Declarations (최상단에 배치하여 ReferenceError 방지) ---
  const [data, setData] = useState<TransformerDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cloud' | 'local'>('cloud');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedTRs, setSelectedTRs] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [transformers, setTransformers] = useState<TransformerConfig[]>([]);
  
  const [startYear, setStartYear] = useState<string>('All');
  const [startMonth, setStartMonth] = useState<string>('All');
  const [endYear, setEndYear] = useState<string>('All');
  const [endMonth, setEndMonth] = useState<string>('All');
  
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('transformer_custom_labels');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    }
    return {};
  });

  const [csvUrl, setCsvUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('transformer_monitor_url') || DEFAULT_SHEET_URL;
    }
    return DEFAULT_SHEET_URL;
  });

  // --- 2. Derived State (useMemo) - 상태 선언 이후에 정의 ---
  const displayTransformers = useMemo(() => {
    return transformers.map(t => ({
        ...t,
        name: customLabels[t.id] || t.name
    }));
  }, [transformers, customLabels]);

  const singleSelectedTr = useMemo(() => {
    return displayTransformers.find(t => t.id === focusedId);
  }, [displayTransformers, focusedId]);

  const transformersToDisplay = useMemo(() => {
    if (focusedId) {
      return displayTransformers.filter(t => t.id === focusedId);
    }
    return displayTransformers.filter(t => selectedTRs.includes(t.id));
  }, [displayTransformers, selectedTRs, focusedId]);

  // --- 3. Handlers & Effects ---
  const handleLabelChange = (id: string, newLabel: string) => {
    setCustomLabels(prev => {
        const next = { ...prev, [id]: newLabel };
        localStorage.setItem('transformer_custom_labels', JSON.stringify(next));
        return next;
    });
  };

  const updateTransformersFromData = (dataPoints: TransformerDataPoint[]) => {
    if (dataPoints.length === 0) return;
    const sample = dataPoints[0];
    const keys = Object.keys(sample).filter(k => k !== 'timestamp');
    keys.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.replace(/[^0-9]/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });

    const newConfigs: TransformerConfig[] = keys.map((key, index) => {
        const palette = CHART_PALETTE[index % CHART_PALETTE.length];
        return {
            id: key,
            name: key,
            color: palette.color,
            fillColor: palette.fillColor
        };
    });

    setTransformers(newConfigs);
    setSelectedTRs(prev => {
        if (prev.length === 0) return newConfigs.map(c => c.id);
        const existingIds = prev.filter(id => keys.includes(id));
        return existingIds.length > 0 ? existingIds : newConfigs.map(c => c.id);
    });
  };

  const loadCloudData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsValidating(true);
    setError(null);
    setDataSource('cloud');
    try {
      const result = await fetchTransformerData(csvUrl);
      if (result.length === 0) {
        if (!isBackground) setError("데이터가 비어있습니다.");
      } else {
        setData(result);
        updateTransformersFromData(result);
      }
    } catch (e) {
      if (!isBackground) setError("데이터를 불러올 수 없습니다.");
    } finally {
      if (!isBackground) setIsLoading(false);
      else setIsValidating(false);
    }
  };

  // Fix: Added handleFileUpload function to handle CSV file uploads
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const result = parseCSVData(text);
        if (result.length > 0) {
          setData(result);
          updateTransformersFromData(result);
          setDataSource('local');
          setError(null);
        } else {
          setError("CSV 파일에 유효한 데이터가 없습니다.");
        }
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => { loadCloudData(); }, []);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(d => {
        try { const y = new Date(d.timestamp).getFullYear().toString(); if (y !== 'NaN') years.add(y); } catch {}
    });
    return Array.from(years).sort().reverse();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
        const date = new Date(d.timestamp);
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const val = y * 12 + (m - 1);
        let startVal = -Infinity;
        if (startYear !== 'All') {
            const sy = parseInt(startYear);
            const sm = startMonth === 'All' ? 1 : parseInt(startMonth);
            startVal = sy * 12 + (sm - 1);
        }
        let endVal = Infinity;
        if (endYear !== 'All') {
            const ey = parseInt(endYear);
            const em = endMonth === 'All' ? 12 : parseInt(endMonth);
            endVal = ey * 12 + (em - 1);
        }
        return val >= startVal && val <= endVal;
    });
  }, [data, startYear, startMonth, endYear, endMonth]);

  const systemKPIs = useMemo(() => {
    if (filteredData.length < 1 || transformers.length === 0) return null;
    const lastRow = filteredData[filteredData.length - 1];
    const prevRow = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;
    const trIds = transformers.map(t => t.id);
    const validValuesNow = trIds.map(id => lastRow[id]).filter((v): v is number => typeof v === 'number');
    const validValuesPrev = prevRow ? trIds.map(id => prevRow[id]).filter((v): v is number => typeof v === 'number') : [];
    const avgNow = validValuesNow.length > 0 ? validValuesNow.reduce((a, b) => a + b, 0) / validValuesNow.length : 0;
    const avgPrev = validValuesPrev.length > 0 ? validValuesPrev.reduce((a, b) => a + b, 0) / validValuesPrev.length : 0;
    let maxTemp = -Infinity; let maxTrId = '';
    trIds.forEach(id => {
      const val = lastRow[id];
      if (typeof val === 'number' && val > maxTemp) { maxTemp = val; maxTrId = id; }
    });
    const maxTrName = maxTrId ? (displayTransformers.find(t => t.id === maxTrId)?.name || maxTrId) : 'N/A';
    const warningCount = trIds.filter(id => { const val = lastRow[id]; return typeof val === 'number' && val > 60; }).length;
    return { avgNow, avgDelta: prevRow ? avgNow - avgPrev : 0, maxTemp: maxTemp === -Infinity ? null : maxTemp, maxTrName, activeCount: validValuesNow.length, warningCount };
  }, [filteredData, transformers, displayTransformers]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => headers.map(h => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tr_monitor_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0E1117] text-[#FAFAFA] font-sans overflow-hidden">
      <Sidebar 
          transformers={displayTransformers}
          selectedIds={selectedTRs}
          onToggle={(id) => setSelectedTRs(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id])}
          onSelectAll={() => setSelectedTRs(transformers.map(t => t.id))}
          onDeselectAll={() => setSelectedTRs([])}
          onFileUpload={handleFileUpload}
          currentUrl={csvUrl}
          onUrlChange={(newUrl) => { setCsvUrl(newUrl); localStorage.setItem('transformer_monitor_url', newUrl); setTimeout(() => loadCloudData(false), 100); }}
          onLabelChange={handleLabelChange}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative flex flex-col h-screen transition-all duration-300 ease-in-out">
        <div className="shrink-0 mb-6">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                        <span className="bg-yellow-500/10 p-1.5 rounded-lg text-yellow-500"><Zap size={22} /></span>
                        {focusedId ? `${singleSelectedTr?.name} 상세 분석` : '변압기(TR) 온도 통합 관제'}
                    </h1>
                    <div className="flex items-center gap-3 ml-1 text-gray-500 text-[10px] font-bold uppercase">
                        {dataSource === 'cloud' ? <span className="text-blue-400">Cloud Mode</span> : <span className="text-green-400">Local Mode</span>}
                        <div className="h-2 w-[1px] bg-gray-700"></div>
                        <Database size={10} /> {filteredData.length} Records
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <WeatherWidget />
                    
                    <div className="flex items-center gap-1.5 bg-[#262730] p-1 rounded-lg border border-[#464B5C] text-xs">
                        <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer hover:text-blue-400">
                            <option value="All" className="text-black">전체</option>
                            {availableYears.map(y => <option key={y} value={y} className="text-black">{y}년</option>)}
                        </select>
                        <span className="text-gray-500">~</span>
                        <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer hover:text-blue-400">
                            <option value="All" className="text-black">전체</option>
                            {availableYears.map(y => <option key={y} value={y} className="text-black">{y}년</option>)}
                        </select>
                    </div>

                    <div className="flex bg-[#262730] p-1 rounded-lg border border-[#464B5C]">
                        <button onClick={() => {setFocusedId(null); setViewMode('grid');}} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => {setFocusedId(null); setViewMode('list');}} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><List size={16} /></button>
                    </div>

                    <button onClick={handleExportCSV} className="flex items-center gap-2 bg-[#262730] hover:bg-[#363945] border border-[#464B5C] px-3 h-8 rounded text-xs font-bold text-gray-300 transition-colors">
                        <Download size={14} className="text-blue-400" /> Export
                    </button>
                    
                    {dataSource === 'cloud' && (
                        <button onClick={() => loadCloudData(false)} disabled={isLoading || isValidating} className="w-8 h-8 bg-[#262730] hover:bg-[#363945] border border-[#464B5C] rounded flex items-center justify-center">
                            {(isLoading || isValidating) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500"><Loader2 size={48} className="animate-spin mb-4 text-blue-500" /><p>데이터 로딩 중...</p></div>
            ) : (
                <>
                    {systemKPIs && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <KPICard label="평균 온도" value={`${systemKPIs.avgNow.toFixed(1)}°C`} delta={`${systemKPIs.avgDelta.toFixed(1)}°C`} deltaColor="inverse" />
                            <KPICard label="최고 지점" value={`${systemKPIs.maxTemp?.toFixed(1)}°C`} subtext={systemKPIs.maxTrName} deltaColor="inverse" />
                            <KPICard label="관찰 대상" value={`${systemKPIs.activeCount}대`} deltaColor="off" />
                            <KPICard label="시스템 상태" value={systemKPIs.warningCount === 0 ? "정상" : "주의"} subtext={`경보 ${systemKPIs.warningCount}건`} deltaColor="off" />
                        </div>
                    )}

                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                            {transformersToDisplay.map(tr => (
                                <TransformerGridCard key={tr.id} config={tr} data={filteredData} onClick={() => {setFocusedId(tr.id); setViewMode('list');}} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6 pb-10">
                            {transformersToDisplay.map(tr => (
                                <TransformerRow key={tr.id} config={tr} data={filteredData} onBack={focusedId ? () => {setFocusedId(null); setViewMode('grid');} : undefined} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
