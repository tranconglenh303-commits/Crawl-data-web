import React, { useState } from 'react';
import {
  Layers,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search
} from 'lucide-react';
import { ScrapedHeading, ScrapedMetadata } from '../types/scraper';
import { copyToClipboard } from '../utils/exportUtils';

interface HeadingsTabProps {
  headings: ScrapedHeading[];
  metadata: ScrapedMetadata;
}

export const HeadingsTab: React.FC<HeadingsTabProps> = ({ headings, metadata }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const h1Count = headings.filter(h => h.level === 'H1').length;
  const h2Count = headings.filter(h => h.level === 'H2').length;
  const h3Count = headings.filter(h => h.level === 'H3').length;

  const filteredHeadings = React.useMemo(() => {
    if (filterLevel === 'all') return headings;
    return headings.filter(h => h.level === filterLevel);
  }, [headings, filterLevel]);

  const handleCopyOutline = async () => {
    const text = headings.map(h => `${'  '.repeat(parseInt(h.level.replace('H', '')) - 1)}- [${h.level}] ${h.text}`).join('\n');
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* SEO & Meta Audit Check Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          Kiểm toán cấu trúc SEO cơ bản (SEO & Meta Audit)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Thẻ H1 (Tiêu đề chính)</span>
              {h1Count === 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-slate-500 text-[11px]">
              {h1Count === 1
                ? 'Chuẩn SEO (1 thẻ H1 duy nhất)'
                : h1Count === 0
                ? 'Thiếu thẻ H1 trên trang'
                : `Có ${h1Count} thẻ H1 (Nên có 1 H1 duy nhất)`}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Meta Description</span>
              {metadata.description ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-slate-500 text-[11px]">
              {metadata.description
                ? `${metadata.description.length} ký tự (Tốt)`
                : 'Chưa có mô tả meta description'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">OpenGraph Image</span>
              {metadata.ogImage ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-slate-500 text-[11px]">
              {metadata.ogImage ? 'Đã cài đặt ảnh chia sẻ MXH' : 'Không có thẻ og:image'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Ngôn ngữ trang</span>
              <span className="font-mono font-bold text-indigo-600 uppercase">
                {metadata.language || 'N/A'}
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">Khai báo qua thuộc tính &lt;html lang&gt;</p>
          </div>
        </div>
      </div>

      {/* Headings Hierarchy Tree Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Dàn ý tiêu đề trang web ({headings.length} mục)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterLevel === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterLevel('H1')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterLevel === 'H1' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                H1 ({h1Count})
              </button>
              <button
                onClick={() => setFilterLevel('H2')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterLevel === 'H2' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                H2 ({h2Count})
              </button>
              <button
                onClick={() => setFilterLevel('H3')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterLevel === 'H3' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                H3 ({h3Count})
              </button>
            </div>

            <button
              onClick={handleCopyOutline}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép dàn ý'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-2 max-h-[600px] overflow-y-auto font-sans text-xs sm:text-sm">
          {filteredHeadings.length > 0 ? (
            filteredHeadings.map((h, idx) => {
              const levelNum = parseInt(h.level.replace('H', '')) || 1;
              const indentClass =
                levelNum === 1
                  ? 'pl-2 border-l-4 border-indigo-600 font-bold text-slate-900 text-sm sm:text-base'
                  : levelNum === 2
                  ? 'pl-6 border-l-2 border-blue-400 font-semibold text-slate-800'
                  : levelNum === 3
                  ? 'pl-10 text-slate-700 font-medium'
                  : 'pl-14 text-slate-500';

              const badgeColor =
                levelNum === 1
                  ? 'bg-indigo-100 text-indigo-800'
                  : levelNum === 2
                  ? 'bg-blue-100 text-blue-800'
                  : levelNum === 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600';

              return (
                <div
                  key={idx}
                  className={`py-1.5 flex items-start gap-2 rounded-lg hover:bg-slate-50 transition-colors ${indentClass}`}
                >
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold shrink-0 ${badgeColor}`}
                  >
                    {h.level}
                  </span>
                  <span className="leading-snug">{h.text}</span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">Không tìm thấy tiêu đề phù hợp.</div>
          )}
        </div>
      </div>
    </div>
  );
};
