import React, { useRef, useState } from 'react';
import { TransformerConfig } from '../types';
import { Filter, Upload, FileSpreadsheet, Link as LinkIcon, Check, Pencil, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface SidebarProps {
  transformers: TransformerConfig[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onFileUpload: (file: File) => void;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  onLabelChange: (id: string, label: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  language: 'ko' | 'en' | 'jp' | 'cn';
}

const sidebarTranslations = {
  ko: {
    source: '데이터 소스',
    upload: 'CSV 업로드',
    filtering: '필터링',
    all: '전체',
    none: '해제',
    status: '시스템 상태',
    secure: '안전'
  },
  en: {
    source: 'DATA SOURCE',
    upload: 'UPLOAD CSV',
    filtering: 'FILTERING',
    all: 'ALL',
    none: 'NONE',
    status: 'SYSTEM STATUS',
    secure: 'SECURE'
  },
  jp: {
    source: 'データソース',
    upload: 'CSVアップロード',
    filtering: 'フィルタリング',
    all: '全選択',
    none: '解除',
    status: 'システム状態',
    secure: '安全'
  },
  cn: {
    source: '数据源',
    upload: '上传 CSV',
    filtering: '过滤',
    all: '全选',
    none: '重置',
    status: '系统状态',
    secure: '安全'
  }
};

const Sidebar: React.FC<SidebarProps> = ({ 
    transformers, 
    selectedIds, 
    onToggle, 
    onSelectAll,
    onDeselectAll,
    onFileUpload,
    currentUrl,
    onUrlChange,
    onLabelChange,
    isOpen,
    setIsOpen,
    language
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempUrl, setTempUrl] = useState(currentUrl);
  const [isUrlSaved, setIsUrlSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const t = sidebarTranslations[language];

  const handleUrlApply = () => {
    onUrlChange(tempUrl);
    setIsUrlSaved(true);
    setTimeout(() => setIsUrlSaved(false), 2000);
  };

  return (
    <aside className={`fixed lg:sticky top-0 left-0 z-40 bg-[#262730] h-screen transition-all duration-300 ease-in-out border-r border-[#464B5C] flex flex-col shrink-0 ${isOpen ? 'w-64' : 'w-0 lg:w-16 -translate-x-full lg:translate-x-0'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="hidden lg:flex absolute top-1/2 -right-4 translate-y-[-50%] w-8 h-8 bg-[#464B5C] hover:bg-[#5a6075] text-white rounded-full items-center justify-center shadow-lg border border-[#262730] z-50 transition-colors">
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className={`flex flex-col h-full transition-opacity duration-200 ${isOpen ? 'opacity-100 p-6' : 'opacity-0 overflow-hidden'}`}>
        <div className="mb-8 shrink-0 flex items-center gap-3">
          <div className="bg-yellow-500/10 p-2 rounded text-yellow-500"><Zap size={20} /></div>
          <h1 className="text-[#FAFAFA] text-lg font-bold truncate">TR Monitor</h1>
        </div>

        <div className="mb-8 shrink-0">
          <h2 className="text-[#FAFAFA] text-xs font-bold flex items-center gap-2 mb-3 uppercase tracking-widest opacity-80"><FileSpreadsheet size={14} /> {t.source}</h2>
          <div className="space-y-3">
              <div className="flex gap-1">
                  <input type="text" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="CSV URL..." className="w-full bg-[#1e1e1e] border border-[#464B5C] text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500" />
                  <button onClick={handleUrlApply} className={`px-2 rounded text-white transition-colors ${isUrlSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}>{isUrlSaved ? <Check size={14} /> : <LinkIcon size={14} />}</button>
              </div>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#464B5C] hover:bg-[#5a6075] text-white text-xs font-bold py-1.5 px-3 rounded flex items-center justify-center gap-2 uppercase tracking-tighter"><Upload size={14} /> {t.upload}</button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-3 shrink-0">
              <div className="flex items-center gap-2">
                  <h2 className="text-[#FAFAFA] text-xs font-bold flex items-center gap-2 uppercase tracking-widest opacity-80"><Filter size={14} /> {t.filtering}</h2>
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-1 rounded transition-colors ${isEditing ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:bg-[#363945]'}`}>{isEditing ? <Check size={12} /> : <Pencil size={12} />}</button>
              </div>
              <div className="flex gap-2">
                <button onClick={onSelectAll} className="text-[10px] text-blue-400 hover:text-blue-300 font-black uppercase">{t.all}</button>
                <button onClick={onDeselectAll} className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase">{t.none}</button>
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin content-start pb-4">
            {transformers.map((tr) => {
              const isSelected = selectedIds.includes(tr.id);
              const displayName = tr.name.startsWith('TR #') ? tr.name.replace('TR #', '#') : tr.name;
              return (
                  <div 
                    key={tr.id} 
                    className={`relative flex items-center justify-center rounded border text-[11px] transition-all text-center min-h-[40px] cursor-pointer overflow-hidden ${isSelected ? 'text-white font-black' : 'bg-[#1e1e1e] text-gray-500 border-[#464B5C] hover:border-gray-400'}`} 
                    style={isSelected ? { backgroundColor: tr.fillColor.replace('0.2', '0.75'), borderColor: tr.color } : {}} 
                    onClick={() => !isEditing && onToggle(tr.id)}
                  >
                      {isEditing ? (
                          <input type="text" value={tr.name} onChange={(e) => onLabelChange(tr.id, e.target.value)} className="w-full h-full bg-transparent text-center focus:outline-none text-white font-bold" autoFocus />
                      ) : (
                          <div className="truncate px-1 uppercase tracking-tighter">{displayName}</div>
                      )}
                      {isSelected && !isEditing && (
                          <div className="absolute top-0 right-0 p-0.5">
                              <Check size={8} className="text-white opacity-60" />
                          </div>
                      )}
                  </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-4 shrink-0 border-t border-white/5">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t.status}: <span className="text-green-400">{t.secure}</span></p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
