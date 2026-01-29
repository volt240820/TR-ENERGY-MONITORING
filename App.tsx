
import React, { useMemo, useState, useEffect } from 'react';
import { fetchTransformerData, parseCSVData } from './utils/dataGenerator';
import { TransformerDataPoint, TransformerConfig, CHART_PALETTE } from './types';
import Sidebar from './components/Sidebar';
import KPICard from './components/KPICard';
import TransformerRow from './components/TransformerRow';
import TransformerGridCard from './components/TransformerGridCard';
import WeatherWidget from './components/WeatherWidget';
import { Zap, Activity, Loader2, RefreshCw, Play, Pause, LayoutGrid, List, ArrowRight } from 'lucide-react';

const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/1K8w405s3SthSLFbYdYT1PAnpnuzGMUOl0qxQDSiCKs8/export?format=csv&gid=69853061`;

const App: React.FC = () => {
  const [data, setData] = useState<TransformerDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cloud' | 'local'>('cloud');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  
  const [transformers, setTransformers] = useState<TransformerConfig[]>([]);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('transformer_custom_labels');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    }
    return {};
  });

  const handleLabelChange = (id: string, newLabel: string) => {
    setCustomLabels(prev => {
        const next = { ...prev, [id]: newLabel };
        localStorage.setItem('transformer_custom_labels', JSON.stringify(next));
        return next;
    });
  };

  const displayTransformers = useMemo(() => {
    return transformers.map(t => ({
        ...t,
        name: customLabels[t.id] || t.name
    }));
  }, [transformers, customLabels]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  
  const [startYear, setStartYear] = useState<string>('All');
  const [startMonth, setStartMonth] = useState<string>('All');
  const [endYear, setEndYear] = useState<string>('All');
  const [endMonth, setEndMonth] = useState<string>('All');
  
  const [csvUrl, setCsvUrl] = useState<string>(() => {
    return localStorage.getItem('transformer_monitor_url') || DEFAULT_SHEET_URL;
  });
  
  const [selectedTRs, setSelectedTRs] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const handleUrlChange = (newUrl: string) => {
    setCsvUrl(newUrl);
    localStorage.setItem('transformer_monitor_url', newUrl);
    setTimeout(() => loadCloudData(false), 100);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (dataSource === 'cloud' && isAutoRefresh) {
      interval = setInterval(() => loadCloudData(true), 30000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [dataSource, isAutoRefresh, csvUrl]);

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);
    setDataSource('local');
    setIsAutoRefresh(false);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const result = parseCSVData(text);
            if (result.length === 0) setError("데이터가 없습니다.");
            else { setData(result); updateTransformersFromData(result); }
        } catch { setError("오류 발생"); } finally { setIsLoading(false); }
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

  const toggleTR = (id: string) => {
    setSelectedTRs(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedTRs(transformers.map(t => t.id));

  const handleGridCardClick = (id: string) => {
    setFocusedId(id);
    setViewMode('list');
  };

  const switchToGridView = () => {
    setFocusedId(null);
    setViewMode('grid');
  };

  const switchToListView = () => {
    setFocusedId(null);
    setViewMode('list');
  };

  const yearOptions = (
      <>
          <option value="All" className="text-black">전체</option>
          {availableYears.map(y => <option key={y} value={y} className="text-black">{y}년</option>)}
      </>
  );

  const monthOptions = (
      <>
          <option value="All" className="text-black">전체</option>
          {Array.from({length: 12}, (_, i) => i + 1).map(m => (<option key={m} value={m.toString()} className="text-black">{m}월</option>))}
      </>
  );

  const singleSelectedTr = focusedId ? displayTransformers.find(t => t.id === focusedId) : null;

  const transformersToDisplay = useMemo(() => {
    if (viewMode === 'list' && focusedId) {
        return displayTransformers.filter(t => t.id === focusedId);
    }
    return displayTransformers.filter(tr => selectedTRs.includes(tr.id));
  }, [viewMode, focusedId, displayTransformers, selectedTRs]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0E1117] text-[#FAFAFA] font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#262730] shrink-0 border-b border-[#464B5C]">
        <h1 className="text-lg font-bold flex items-center gap-2"><Zap className="text-yellow-500" />TR Monitor</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 border border-gray-600 rounded">
          <Activity size={20} />
        </button>
      </div>

      {/* Sidebar Component with Collapsible Logic */}
      <Sidebar 
          transformers={displayTransformers}
          selectedIds={selectedTRs}
          onToggle={toggleTR}
          onSelectAll={selectAll}
          onFileUpload={handleFileUpload}
          currentUrl={csvUrl}
          onUrlChange={handleUrlChange}
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
                        {singleSelectedTr ? `${singleSelectedTr.name} 상세 분석` : '변압기(TR) 온도 통합 관제'}
                    </h1>
                    <div className="flex items-center gap-2 ml-1">
                        <p className="text-gray-400 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                            {dataSource === 'local' ? (<span className="text-green-400">Local Mode</span>) : (<span className="text-blue-400">Cloud Mode</span>)}
                        </p>
                        {isAutoRefresh && <span className="flex items-center gap-1 text-[10px] text-yellow-500 animate-pulse font-bold"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>LIVE</span>}
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 justify-end w-full xl:w-auto">
                    <WeatherWidget />
                    
                    <div className="flex items-center gap-1.5 bg-[#262730] p-1 rounded-lg border border-[#464B5C] text-xs">
                        <div className="flex items-center"><select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="bg-transparent text-[#FAFAFA] border-none focus:ring-0 outline-none p-1 cursor-pointer hover:text-blue-400">{yearOptions}</select><span className="text-gray-500">.</span><select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="bg-transparent text-[#FAFAFA] border-none focus:ring-0 outline-none p-1 cursor-pointer hover:text-blue-400">{monthOptions}</select></div>
                        <span className="text-gray-500 px-1">~</span>
                        <div className="flex items-center"><select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="bg-transparent text-[#FAFAFA] border-none focus:ring-0 outline-none p-1 cursor-pointer hover:text-blue-400">{yearOptions}</select><span className="text-gray-500">.</span><select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="bg-transparent text-[#FAFAFA] border-none focus:ring-0 outline-none p-1 cursor-pointer hover:text-blue-400">{monthOptions}</select></div>
                    </div>

                    <div className="flex bg-[#262730] p-1 rounded-lg border border-[#464B5C]">
                        <button onClick={switchToGridView} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><LayoutGrid size={16} /></button>
                        <button onClick={switchToListView} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><List size={16} /></button>
                    </div>
                    
                    {dataSource === 'cloud' && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsAutoRefresh(!isAutoRefresh)} className={`flex items-center justify-center w-8 h-8 rounded transition-colors border ${isAutoRefresh ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-[#262730] border-[#464B5C] text-gray-400 hover:text-gray-200'}`} title="Auto Refresh">{isAutoRefresh ? <Pause size={14} /> : <Play size={14} />}</button>
                            <button onClick={() => loadCloudData(false)} disabled={isLoading || isValidating} className="flex items-center justify-center w-8 h-8 bg-[#262730] hover:bg-[#363945] border border-[#464B5C] rounded transition-colors disabled:opacity-50" title="Refresh Now">{(isLoading || isValidating) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin">
            {isLoading && <div className="flex flex-col items-center justify-center py-20 text-gray-500"><Loader2 size={48} className="animate-spin mb-4 text-blue-500" /><p>데이터를 불러오는 중입니다...</p></div>}
            {!isLoading && error && <div className="bg-red-900/20 border border-red-800 text-red-200 p-6 rounded-lg text-center mb-8"><p className="font-bold mb-2">데이터 로드 실패</p><p className="text-sm opacity-90 mb-4">{error}</p></div>}
            {!isLoading && !error && (
                <>
                    {systemKPIs && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <KPICard label="기간 평균 온도" value={`${systemKPIs.avgNow.toFixed(1)}°C`} delta={`${systemKPIs.avgDelta > 0 ? '+' : ''}${systemKPIs.avgDelta.toFixed(1)}°C`} deltaColor="inverse" />
                            <KPICard label="최고 온도 (Hot Spot)" value={systemKPIs.maxTemp !== null ? `${systemKPIs.maxTemp.toFixed(1)}°C` : '-'} subtext={systemKPIs.maxTrName} deltaColor="inverse" />
                            <KPICard label="모니터링 대상" value={`${systemKPIs.activeCount} 대`} subtext="데이터 수신 중" deltaColor="off" />
                            <KPICard label="현재 상태" value={systemKPIs.warningCount === 0 ? "정상" : "주의"} subtext={`경보 ${systemKPIs.warningCount}건`} deltaColor={systemKPIs.warningCount === 0 ? 'off' : 'inverse'} />
                        </div>
                    )}

                    {displayTransformers.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 border border-dashed border-[#464B5C] rounded-lg"><Activity size={48} className="mx-auto mb-4 opacity-50" /><p>표시할 데이터 컬럼을 찾을 수 없습니다.</p></div>
                    ) : selectedTRs.length === 0 && !focusedId ? (
                         <div className="text-center py-20 text-gray-500 border border-dashed border-[#464B5C] rounded-lg"><Activity size={48} className="mx-auto mb-4 opacity-50" /><p>선택된 변압기가 없습니다.</p></div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                                    {transformersToDisplay.map(tr => (
                                        <TransformerGridCard 
                                            key={tr.id}
                                            config={tr}
                                            data={filteredData}
                                            onClick={() => handleGridCardClick(tr.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6 pb-10">
                                    {transformersToDisplay.map(tr => (
                                        <TransformerRow 
                                            key={tr.id}
                                            config={tr}
                                            data={filteredData}
                                            onBack={focusedId ? switchToGridView : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
