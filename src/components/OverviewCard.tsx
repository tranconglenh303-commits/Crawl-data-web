import React, { useState } from 'react';
import {
  Globe,
  Download,
  Copy,
  Check,
  Clock,
  FileText,
  Table,
  Image as ImageIcon,
  Link as LinkIcon,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Share2
} from 'lucide-react';
import { ScrapedData } from '../types/scraper';
import { exportToJson, exportToMarkdown, copyToClipboard } from '../utils/exportUtils';

interface OverviewCardProps {
  data: ScrapedData;
  onSelectTab: (tabId: string) => void;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({ data, onSelectTab }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    const success = await copyToClipboard(JSON.stringify(data, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const safeDomain = data.metadata.domain || 'website';
    exportToJson(data, `scrape-${safeDomain}-${Date.now()}.json`);
  };

  const handleDownloadMarkdown = () => {
    const safeDomain = data.metadata.domain || 'website';
    exportToMarkdown(data.markdown, `content-${safeDomain}-${Date.now()}.md`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
      {/* Top Banner with Title & Quick Actions */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {data.metadata.favicon ? (
                <img
                  src={data.metadata.favicon}
                  alt="favicon"
                  className="w-4 h-4 rounded-xs shrink-0 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                {data.metadata.domain || 'Trang web'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                HTTP {data.responseStatus || 200}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                <Clock className="w-3 h-3 text-blue-500" />
                {data.fetchTimeMs}ms
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {data.metadata.title || 'Không tìm thấy tiêu đề chính'}
            </h2>

            {data.metadata.description && (
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {data.metadata.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline max-w-md truncate"
                title={data.url}
              >
                <span>{data.url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>

              {data.metadata.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {data.metadata.author}
                </span>
              )}

              {data.metadata.publishedTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(data.metadata.publishedTime).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('ai-extract')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Trích xuất bằng AI</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Tải toàn bộ dữ liệu cào dạng JSON"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Tải JSON</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Tải nội dung trang dạng Markdown"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Tải .MD</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Sao chép toàn bộ JSON"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-white">
        <button
          onClick={() => onSelectTab('content')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-indigo-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nội dung từ</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {data.stats.wordCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">~{data.stats.readingTimeMin} phút đọc</div>
        </button>

        <button
          onClick={() => onSelectTab('tables')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bảng dữ liệu</span>
            <Table className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {data.stats.totalTables}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Xuất CSV / Excel</div>
        </button>

        <button
          onClick={() => onSelectTab('images')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hình ảnh</span>
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {data.stats.totalImages}
          </div>
          <div className="text-[11px] text-slate-500">Xem ảnh & tải link</div>
        </button>

        <button
          onClick={() => onSelectTab('links')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Liên kết (Links)</span>
            <LinkIcon className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {data.stats.totalLinks}
          </div>
          <div className="text-[11px] text-slate-500">
            {data.stats.internalLinksCount} nội bộ • {data.stats.externalLinksCount} ngoài
          </div>
        </button>

        <button
          onClick={() => onSelectTab('headings')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cấu trúc H1-H6</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900">
            {data.stats.totalHeadings}
          </div>
          <div className="text-[11px] text-slate-500">Mục lục dàn ý SEO</div>
        </button>

        <button
          onClick={() => onSelectTab('ai-extract')}
          className="p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group bg-indigo-50/30 cursor-pointer"
        >
          <div className="flex items-center justify-between text-indigo-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">AI Gemini</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-indigo-900">
            Thông minh
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">Trích xuất cấu trúc</div>
        </button>
      </div>
    </div>
  );
};
