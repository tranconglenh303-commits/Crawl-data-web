import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Search,
  Table as TableIcon,
  Code,
  FileSpreadsheet,
  Lightbulb,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ScrapedData, AiExtractionResult } from '../types/scraper';
import { exportToCsv, exportToJson, copyToClipboard } from '../utils/exportUtils';

interface AiExtractionTabProps {
  scrapedData: ScrapedData;
}

const SCHEMA_TEMPLATES = [
  {
    id: 'products',
    title: '📦 Danh sách Sản phẩm & Giá',
    prompt: 'Trích xuất toàn bộ danh sách sản phẩm hiển thị trên trang gồm: Tên sản phẩm, Giá bán hiện tại, Giá gốc/niêm yết, Mức giảm giá, Thương hiệu, Đánh giá sao/Số lượt mua, Tình trạng hàng.',
    badge: 'E-commerce',
  },
  {
    id: 'contacts',
    title: '🏢 Thông tin Liên hệ & Doanh nghiệp',
    prompt: 'Trích xuất thông tin liên hệ đầy đủ: Tên công ty/tổ chức, Số điện thoại hotline, Email liên hệ, Địa chỉ trụ sở/chi nhánh, Liên kết mạng xã hội (Facebook, Zalo, LinkedIn), Giờ làm việc.',
    badge: 'Lead Gen',
  },
  {
    id: 'jobs',
    title: '💼 Tin Tuyển dụng / Việc làm',
    prompt: 'Trích xuất danh sách các vị trí việc làm tuyển dụng: Chức danh công việc, Mức lương đề xuất, Địa điểm làm việc, Kinh nghiệm yêu cầu, Hình thức làm việc (Full-time/Remote), Hạn nộp hồ sơ.',
    badge: 'Tuyển dụng',
  },
  {
    id: 'faq',
    title: '❓ Hỏi đáp / FAQ / Thắc mắc',
    prompt: 'Trích xuất toàn bộ các câu hỏi thường gặp và câu trả lời chi tiết tương ứng trên trang web.',
    badge: 'Q&A Support',
  },
  {
    id: 'articles',
    title: '📰 Danh mục Tin bài / Điểm tin',
    prompt: 'Trích xuất danh sách các bài viết/tin tức trên trang: Tiêu đề bài, Tác giả, Ngày đăng, Tóm tắt nội dung, Chuyên mục.',
    badge: 'Content',
  },
  {
    id: 'custom',
    title: '⚡ Tự nhập yêu cầu tùy ý',
    prompt: '',
    badge: 'Custom',
  },
];

export const AiExtractionTab: React.FC<AiExtractionTabProps> = ({ scrapedData }) => {
  const [selectedSchema, setSelectedSchema] = useState<string>('products');
  const [prompt, setPrompt] = useState<string>(SCHEMA_TEMPLATES[0].prompt);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AiExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectTemplate = (tmpl: typeof SCHEMA_TEMPLATES[0]) => {
    setSelectedSchema(tmpl.id);
    if (tmpl.id !== 'custom') {
      setPrompt(tmpl.prompt);
    }
  };

  const handleExtract = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: scrapedData.markdown || scrapedData.rawText,
          url: scrapedData.url,
          prompt,
          schemaType: selectedSchema,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Trích xuất thất bại.');
      }

      setResult(resData.data);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi gọi AI trích xuất.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!result || !result.items || result.items.length === 0) return;
    const columns = result.columns && result.columns.length > 0
      ? result.columns
      : Object.keys(result.items[0]);

    const rows = result.items.map((item) =>
      columns.map((col) => {
        const val = item[col];
        if (typeof val === 'object') return JSON.stringify(val);
        return val !== undefined ? String(val) : '';
      })
    );

    exportToCsv(columns, rows, `ai-extracted-${selectedSchema}-${Date.now()}.csv`);
  };

  const handleExportJson = () => {
    if (!result) return;
    exportToJson(result, `ai-extracted-${selectedSchema}-${Date.now()}.json`);
  };

  const handleCopy = async () => {
    if (!result) return;
    const success = await copyToClipboard(JSON.stringify(result, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter items for display
  const displayItems = React.useMemo(() => {
    if (!result?.items) return [];
    if (!searchFilter.trim()) return result.items;
    const q = searchFilter.toLowerCase();
    return result.items.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [result, searchFilter]);

  const columns = React.useMemo(() => {
    if (result?.columns && result.columns.length > 0) return result.columns;
    if (result?.items && result.items.length > 0) return Object.keys(result.items[0]);
    return [];
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Trích xuất dữ liệu có cấu trúc bằng AI Gemini 3.8
            </h3>
            <p className="text-xs text-slate-500">
              AI sẽ đọc hiểu toàn bộ nội dung website và trích xuất thành bảng dữ liệu chuyên nghiệp theo ý bạn.
            </p>
          </div>
        </div>

        {/* Template Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          {SCHEMA_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                selectedSchema === tmpl.id
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-2xs ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="truncate mb-1">{tmpl.title}</div>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200/60 text-slate-500">
                {tmpl.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Yêu cầu trích xuất chi tiết (Prompt):
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập yêu cầu trích xuất cụ thể..."
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden text-slate-800"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Thực thi trích xuất</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Summary */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{result.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {result.items?.length || 0} mục dữ liệu
                </span>
              </div>
              {result.summary && (
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">{result.summary}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs mr-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'table' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Bảng
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                    viewMode === 'json' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  JSON
                </button>
              </div>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Tải bảng dạng CSV/Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Xuất CSV
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                title="Tải JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Tải JSON
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                title="Sao chép kết quả"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* Key Insights if available */}
          {result.keyInsights && result.keyInsights.length > 0 && (
            <div className="p-3 bg-amber-50/70 border-b border-amber-100 flex items-start gap-2.5 text-xs text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Điểm nổi bật: </span>
                <span>{result.keyInsights.join(' • ')}</span>
              </div>
            </div>
          )}

          {/* Search bar inside result */}
          {viewMode === 'table' && (
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc nhanh kết quả..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Content: Table or JSON */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              {displayItems.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                      {columns.map((col, idx) => (
                        <th key={idx} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayItems.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {rIdx + 1}
                        </td>
                        {columns.map((col, cIdx) => {
                          const val = row[col];
                          let displayVal = val;
                          if (typeof val === 'object' && val !== null) {
                            displayVal = JSON.stringify(val);
                          }
                          return (
                            <td key={cIdx} className="py-2.5 px-3 text-slate-800 leading-relaxed">
                              {displayVal !== undefined && displayVal !== null && displayVal !== '' ? (
                                String(displayVal)
                              ) : (
                                <span className="text-slate-300 italic">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Không tìm thấy mục dữ liệu nào phù hợp với bộ lọc tìm kiếm.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
