
import React from 'react';
import { 
  ComposedChart,
  Line,
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import { TransformerDataPoint, TransformerConfig } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react';

interface TransformerRowProps {
  config: TransformerConfig;
  data: TransformerDataPoint[];
  onBack?: () => void;
}

const TransformerRow: React.FC<TransformerRowProps> = ({ config, data, onBack }) => {
  const lastRow = data[data.length - 1];
  const prevRow = data.length > 1 ? data[data.length - 2] : null;
  
  const currentTemp = lastRow[config.id];
  const prevTemp = prevRow ? prevRow[config.id] : null;
  
  const hasData = typeof currentTemp === 'number';
  const hasPrevData = typeof prevTemp === 'number';
  
  const delta = (hasData && hasPrevData) ? (currentTemp as number) - (prevTemp as number) : 0;
  
  const isHighTemp = hasData && (currentTemp as number) > 60;
  
  const recentData = data.slice(-5);

  const safeId = config.id.replace(/[^a-zA-Z0-9]/g, '');
  const areaGradientId = `gradient-area-${safeId}`;
  const barGradientId = `gradient-bar-${safeId}`;
  const barWarningGradientId = `gradient-bar-warning-${safeId}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#262730] border border-[#464B5C] p-3 rounded shadow-xl">
          <p className="text-gray-300 text-xs mb-1">{new Date(label).toLocaleString()}</p>
          <p className="text-[#FAFAFA] font-bold text-sm">
            {config.id}: {payload[0].value.toFixed(2)} °C
          </p>
        </div>
      );
    }
    return null;
  };

  const MiniTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-[#262730] border border-[#464B5C] p-2 rounded shadow-xl text-xs">
          <p className="text-gray-400 mb-1">
            {date.getMonth() + 1}/{date.getDate()} {date.getHours()}:{String(date.getMinutes()).padStart(2, '0')}
          </p>
          <p className="text-[#FAFAFA] font-bold">
            {payload[0].value.toFixed(1)} °C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6">
        {onBack && (
          <button 
              onClick={onBack}
              className="mr-3 p-1.5 hover:bg-[#363945] rounded-full transition-colors text-gray-400 hover:text-white"
              title="전체 목록으로 돌아가기"
          >
              <ArrowLeft size={24} />
          </button>
        )}
        <h3 className="text-2xl font-bold text-[#FAFAFA]">🔹 {config.name} 상세 데이터 분석</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Summary Card - Balanced for better ratio */}
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="bg-[#262730] border border-[#464B5C] rounded-xl p-6 shadow-lg h-full flex flex-col justify-between">
            <div className="mb-4">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{config.name} 실시간 온도</p>
                <div className="flex items-baseline mt-1">
                    <span className="text-4xl font-black text-[#FAFAFA]">
                        {hasData ? `${(currentTemp as number).toFixed(1)} °C` : '-'}
                    </span>
                    {hasData && hasPrevData && (
                        <span className={`ml-4 text-base font-bold flex items-center ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {delta > 0 ? <ArrowUp size={18} className="mr-1"/> : <ArrowDown size={18} className="mr-1"/>}
                            {Math.abs(delta).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* Mini Bar Chart - Adjusted to h-64 and changed time to Date */}
            <div className="h-64 w-full mt-4">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recentData} margin={{ top: 25, right: 10, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id={barGradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#457B9D" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#457B9D" stopOpacity={0.4}/>
                                </linearGradient>
                                <linearGradient id={barWarningGradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF4B4B" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#FF4B4B" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    // 시간대신 날짜(MM/DD)로 변경
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                                tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold'}}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                dy={5}
                            />
                            <Tooltip content={<MiniTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar 
                                dataKey={config.id} 
                                fill={isHighTemp ? `url(#${barWarningGradientId})` : `url(#${barGradientId})`} 
                                radius={[6, 6, 0, 0]}
                            >
                                <LabelList 
                                    dataKey={config.id} 
                                    position="top" 
                                    formatter={(val: number) => val.toFixed(1)} 
                                    style={{ fill: '#FAFAFA', fontSize: '11px', fontWeight: '900' }} 
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-600">
                        데이터 없음
                    </div>
                )}
            </div>
            <p className="text-xs text-center font-bold text-gray-500 mt-4 tracking-tighter uppercase opacity-60">최근 데이터 추이 (날짜별)</p>
          </div>
        </div>

        {/* Right Side: Main Chart - Adjusted height to 380px for better balance */}
        <div className="lg:col-span-9 xl:col-span-9">
            <div className="bg-[#262730] border border-[#464B5C] rounded-xl p-6 shadow-lg h-full">
                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={config.color} stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                                }}
                                stroke="#9CA3AF"
                                tick={{fontSize: 12, fontWeight: 500}}
                                minTickGap={40}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis 
                                stroke="#9CA3AF" 
                                domain={['auto', 'auto']}
                                tick={{fontSize: 12}}
                                axisLine={false}
                                tickLine={false}
                                hide
                            />
                            <Tooltip content={<CustomTooltip />} />
                            
                            <Area 
                                type="monotone" 
                                dataKey={config.id} 
                                stroke="none" 
                                fillOpacity={1} 
                                fill={`url(#${areaGradientId})`} 
                                connectNulls={false}
                            />
                            
                            <Line 
                                type="monotone" 
                                dataKey={config.id} 
                                stroke={config.color} 
                                strokeWidth={4}
                                dot={false}
                                connectNulls={false}
                                style={{ filter: `drop-shadow(0 0 10px ${config.color}99)` }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TransformerRow;
