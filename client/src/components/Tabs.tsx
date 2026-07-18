import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-brand-200 text-[11px] font-semibold">
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
            activeTab === id
              ? 'bg-white text-brand-900 shadow-[0_1px_1.5px_rgba(0,0,0,0.05)] border border-brand-200/50 font-bold'
              : 'text-brand-500 hover:text-brand-900'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
