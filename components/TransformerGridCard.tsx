
import React from 'react';
import { 
  ComposedChart,
  Line,
  Area, 
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis
} from 'recharts';
import { TransformerDataPoint, TransformerConfig } from '../types';
import { ArrowUp, ArrowDown, Maximize2 } from 'lucide-react';

interface TransformerGridCardProps {
  config: TransformerConfig;
  data: TransformerDataPoint[];
  onClick?: () => void;
}

const TransformerGridCard: React.FC<TransformerGridCardProps> = ({ config, data, onClick }) => {
  const lastRow = data.length > 0 ? data[data.length - 1] : null;
  const prevRow = data.length > 1 ? data[data.length - 2] : null;
  
  const currentTemp = lastRow ? lastRow[config.id] : null;
  const prevTemp = prevRow ? prevRow[config.id] : null;
  
  const hasData = typeof currentTemp === 'number';
  const hasPrevData = typeof prevTemp === 'number';
  
  const delta = (hasData && hasPrevData) ? (currentTemp as number) - (prevTemp as number) : 0;
  const isHighTemp = hasData && (currentTemp as number) > 60;
  
  const gradientId = `grid-gradient-${config.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const dateStr = !isNaN(date.getTime())
        ? `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
        : label;

      return (
        <div className="bg-[#262730] border border-[#464B5C] p-2 rounded-lg shadow-2xl text-xs z-50">
          <p className="text-gray-400 mb-0.5">{dateStr}</p>
          <p className="text-[#FAFAFA] font-bold text-base">
            {payload[0].value.toFixed(1)} °C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
        onClick={onClick}
        className={`
            relative group bg-[#262730] border rounded-xl p-5 shadow-xl flex flex-col h-[240px] 
            transition-all duration-500 
            ${onClick ? 'cursor-pointer hover:bg-[#2d2e3a] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.99]' : ''} 
            ${isHighTemp ? 'border-red-500/50 bg-red-500/5 shadow-red-500/10' : 'border-[#464B5C] hover:border-blue-400/50'}
        `}
    >
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
        <Maximize2 size={16} />
      </div>

      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5">{config.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isHighTemp ? 'text-red-400' : 'text-[#FAFAFA]'}`}>
                {hasData ? `${(currentTemp as number).toFixed(1)}` : '-'}
                <span className="text-base font-normal text-gray-500 ml-1">°C</span>
            </span>
          </div>
        </div>
        
        {hasData && hasPrevData && (
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-lg ${delta > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {delta > 0 ? <ArrowUp size={12} className="mr-0.5"/> : <ArrowDown size={12} className="mr-0.5"/>}
                {Math.abs(delta).toFixed(1)}
            </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={config.color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    
                    <Area 
                        type="monotone" 
                        dataKey={config.id} 
                        stroke="none"
                        fill={`url(#${gradientId})`} 
                        isAnimationActive={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey={config.id}
                        stroke={config.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        style={{ filter: `drop-shadow(0 4px 8px ${config.color}55)` }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-xs italic">
                데이터를 기다리는 중...
            </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center text-[9px] text-gray-500 pt-2 border-t border-gray-800/50">
          <span className="opacity-60">Real-time</span>
          <span className="font-mono tracking-wider opacity-80 uppercase">UPDATED: {lastRow ? new Date(lastRow.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
      </div>
    </div>
  );
};

export default TransformerGridCard;
