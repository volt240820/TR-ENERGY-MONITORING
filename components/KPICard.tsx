import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string;
  subtext?: string;
  isInverse?: boolean; // If true, positive delta is bad (e.g., high temp)
  deltaColor?: 'normal' | 'inverse' | 'off';
}

const KPICard: React.FC<KPICardProps> = ({ 
  label, 
  value, 
  delta, 
  subtext, 
  deltaColor = 'normal' 
}) => {
  
  let deltaElem = null;
  if (delta) {
    const isPositive = !delta.startsWith('-');
    const numericDelta = parseFloat(delta.replace(/[^0-9.-]/g, ''));
    const isZero = numericDelta === 0;

    let colorClass = 'text-gray-400';
    let Icon = Minus;

    if (!isZero) {
        if (deltaColor === 'inverse') {
            colorClass = isPositive ? 'text-red-400' : 'text-green-400';
            Icon = isPositive ? ArrowUp : ArrowDown;
        } else if (deltaColor === 'normal') {
            colorClass = isPositive ? 'text-green-400' : 'text-red-400';
            Icon = isPositive ? ArrowUp : ArrowDown;
        } else {
            colorClass = 'text-gray-400';
        }
    }

    deltaElem = (
      <span className={`flex items-center text-sm font-medium ${colorClass} ml-2`}>
        {!isZero && <Icon size={14} className="mr-1" />}
        {delta}
      </span>
    );
  }

  return (
    <div className="bg-[#262730] border border-[#464B5C] rounded-lg p-5 shadow-lg flex flex-col justify-between h-full">
      <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{label}</h3>
      <div className="mt-2">
        <div className="text-2xl font-bold text-[#FAFAFA]">{value}</div>
        <div className="flex items-center mt-1">
          {deltaElem}
          {subtext && <span className="text-xs text-gray-500 ml-2">{subtext}</span>}
        </div>
      </div>
    </div>
  );
};

export default KPICard;