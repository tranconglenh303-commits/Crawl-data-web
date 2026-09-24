import React, { useState } from 'react';
import { Sliders, Copy, Check, Download, Search } from 'lucide-react';
import { CustomSelectorResult } from '../types/scraper';
import { exportToJson, copyToClipboard } from '../utils/exportUtils';

interface CustomSelectorsTabProps {
  customResults: CustomSelectorResult[];
  domain?: string;
}

export const CustomSelectorsTab: React.FC<CustomSelectorsTabProps> = ({
  customResults,
  domain = 'web',
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (results: string[], idx: number) => {
    const success = await copyToClipboard(results.join('\n'));
    if (success) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const handleExportJson = (item: CustomSelectorResult) => {
    exportToJson(item, `custom-selector-${item.name}-${domain}.json`);
  };

  if (!customResults || customResults.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Sliders className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Chưa thiết lập Selector CSS nào</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Ở lần cào tiếp theo, hãy mở mục <strong className="text-indigo-600">"Cấu hình cào nâng cao"</strong> để nhập các CSS Selectors như <code className="bg-slate-100 px-1 py-0.5 rounded">.price</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">.title</code>, hoặc thuộc tính ảnh <code className="bg-slate-100 px-1 py-0.5 rounded">src</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Kết quả trích xuất theo CSS Selectors tùy chỉnh ({customResults.length} trường)
            </h4>
            <p className="text-[11px] text-slate-500">
              Dữ liệu được lọc trực tiếp qua DOM parser theo đúng selector bạn đã định nghĩa
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customResults.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800">{item.name}</span>
                <span className="ml-2 font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {item.selector}
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {item.count} kết quả
              </span>
            </div>

            <div className="p-3 flex-1 max-h-60 overflow-y-auto space-y-1 bg-slate-50/30 font-mono text-xs">
              {item.results.length > 0 ? (
                item.results.map((res, rIdx) => (
                  <div key={rIdx} className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-700 break-words">
                    <span className="text-slate-400 mr-2 text-[10px]">{rIdx + 1}.</span>
                    {res}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic text-center py-4">Không tìm thấy phần tử nào khớp.</div>
              )}
            </div>

            <div className="p-2.5 border-t border-slate-100 bg-white flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleExportJson(item)}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={() => handleCopy(item.results, idx)}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIdx === idx ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
