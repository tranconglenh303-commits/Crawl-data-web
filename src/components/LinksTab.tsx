import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter
} from 'lucide-react';
import { ScrapedLink } from '../types/scraper';
import { exportToCsv, exportToText, copyToClipboard } from '../utils/exportUtils';

interface LinksTabProps {
  links: ScrapedLink[];
  domain?: string;
}

export const LinksTab: React.FC<LinksTabProps> = ({ links, domain = 'web' }) => {
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'external'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const internalCount = links.filter(l => l.isInternal).length;
  const externalCount = links.filter(l => !l.isInternal).length;

  const filteredLinks = React.useMemo(() => {
    return links.filter(link => {
      if (filterType === 'internal' && !link.isInternal) return false;
      if (filterType === 'external' && link.isInternal) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        link.href.toLowerCase().includes(q) ||
        (link.text && link.text.toLowerCase().includes(q))
      );
    });
  }, [links, filterType, searchQuery]);

  const handleExportCsv = () => {
    const headers = ['Văn bản liên kết (Anchor)', 'Đường dẫn (URL)', 'Loại liên kết', 'Thuộc tính Rel', 'Target'];
    const rows = filteredLinks.map(l => [
      l.text || '',
      l.href,
      l.isInternal ? 'Nội bộ (Internal)' : 'Liên kết ngoài (External)',
      l.rel || '',
      l.target || '',
    ]);
    exportToCsv(headers, rows, `links-${filterType}-${domain}-${Date.now()}.csv`);
  };

  const handleExportTxt = () => {
    const textList = filteredLinks.map(l => `${l.text || 'No text'} -> ${l.href}`).join('\n');
    exportToText(textList, `links-${filterType}-${domain}-${Date.now()}.txt`);
  };

  const handleCopyUrls = async () => {
    const urls = filteredLinks.map(l => l.href).join('\n');
    const success = await copyToClipboard(urls);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({links.length})
            </button>
            <button
              onClick={() => setFilterType('internal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'internal' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nội bộ ({internalCount})
            </button>
            <button
              onClick={() => setFilterType('external')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'external' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Liên kết ngoài ({externalCount})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm link hoặc văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            title="Xuất danh sách ra CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            onClick={handleExportTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Xuất dạng file TXT"
          >
            <FileText className="w-3.5 h-3.5" />
            TXT
          </button>

          <button
            onClick={handleCopyUrls}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã chép' : 'Sao chép'}
          </button>
        </div>
      </div>

      {/* Links Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-800 shadow-2xs">
            <tr className="border-b border-slate-200 font-bold">
              <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
              <th className="py-2.5 px-3 w-1/3">Văn bản liên kết (Anchor Text)</th>
              <th className="py-2.5 px-3">Địa chỉ URL</th>
              <th className="py-2.5 px-3 w-28 text-center">Phân loại</th>
              <th className="py-2.5 px-3 w-16 text-center">Mở</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLinks.map((link, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="py-2 px-3 font-medium text-slate-800 break-words">
                  {link.text || <span className="text-slate-400 italic">Không có văn bản</span>}
                </td>
                <td className="py-2 px-3 text-slate-600 font-mono text-[11px] break-all">
                  {link.href}
                </td>
                <td className="py-2 px-3 text-center">
                  {link.isInternal ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      Nội bộ
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                      Liên kết ngoài
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                    title="Truy cập liên kết"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
            {filteredLinks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Không tìm thấy liên kết phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
