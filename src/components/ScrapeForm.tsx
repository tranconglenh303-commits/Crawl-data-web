import React, { useState } from 'react';
import {
  Globe,
  Play,
  Settings2,
  Sliders,
  Plus,
  Trash2,
  Code2,
  Sparkles,
  RotateCcw,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ScrapeOptions } from '../types/scraper';

interface ScrapeFormProps {
  onScrape: (url: string, rawHtml: string, options: ScrapeOptions) => void;
  isLoading: boolean;
}

const PRESET_URLS = [
  {
    name: '📚 Wikipedia AI',
    url: 'https://vi.wikipedia.org/wiki/Tr%C3%AD_tu%E1%BB%87_nh%C3%A2n_t%E1%BA%A1o',
    desc: 'Bài viết tri thức bách khoa, mục lục, bảng chú thích',
  },
  {
    name: '📊 GDP Các Quốc Gia',
    url: 'https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(nominal)',
    desc: 'Chứa nhiều bảng dữ liệu số liệu kinh tế chi tiết',
  },
  {
    name: '📰 VnExpress',
    url: 'https://vnexpress.net/khoa-hoc',
    desc: 'Trang tin tức khoa học công nghệ, danh sách bài viết',
  },
  {
    name: '🌐 W3Schools Python',
    url: 'https://www.w3schools.com/python/python_intro.asp',
    desc: 'Trang tài liệu kỹ thuật, code snippet & bảng tham chiếu',
  },
];

const USER_AGENTS = [
  {
    label: 'Chrome Desktop (Khuyên dùng)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
  {
    label: 'Safari iPhone (Mobile)',
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  },
  {
    label: 'Googlebot Crawler',
    value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
  {
    label: 'Firefox Developer',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  },
];

export const ScrapeForm: React.FC<ScrapeFormProps> = ({ onScrape, isLoading }) => {
  const [mode, setMode] = useState<'url' | 'html'>('url');
  const [url, setUrl] = useState('');
  const [rawHtml, setRawHtml] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options
  const [selectedUa, setSelectedUa] = useState(USER_AGENTS[0].value);
  const [timeoutSeconds, setTimeoutSeconds] = useState(25);
  const [customSelectors, setCustomSelectors] = useState<Array<{ name: string; selector: string; attribute?: string }>>([
    { name: '', selector: '', attribute: '' },
  ]);

  const handleAddSelector = () => {
    setCustomSelectors([...customSelectors, { name: '', selector: '', attribute: '' }]);
  };

  const handleRemoveSelector = (index: number) => {
    const updated = [...customSelectors];
    updated.splice(index, 1);
    setCustomSelectors(updated.length ? updated : [{ name: '', selector: '', attribute: '' }]);
  };

  const handleSelectorChange = (index: number, field: 'name' | 'selector' | 'attribute', val: string) => {
    const updated = [...customSelectors];
    updated[index][field] = val;
    setCustomSelectors(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && !url.trim()) return;
    if (mode === 'html' && !rawHtml.trim()) return;

    const validSelectors = customSelectors.filter(s => s.selector.trim() !== '');

    onScrape(
      mode === 'url' ? url.trim() : '',
      mode === 'html' ? rawHtml : '',
      {
        userAgent: selectedUa,
        timeoutMs: timeoutSeconds * 1000,
        customSelectors: validSelectors,
      }
    );
  };

  const handlePastePreset = (presetUrl: string) => {
    setMode('url');
    setUrl(presetUrl);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8 transition-all">
      {/* Top Selector Mode Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 sm:p-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            mode === 'url'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>Cào bằng đường link URL</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('html')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            mode === 'html'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Code2 className="w-4 h-4 text-emerald-500" />
          <span>Dán trực tiếp mã HTML nguồn</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {mode === 'url' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Nhập liên kết website cần cào dữ liệu
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/bai-viet hoặc en.wikipedia.org/wiki/..."
                  className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all text-slate-800 placeholder-slate-400"
                  disabled={isLoading}
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    title="Xóa link"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 shrink-0 text-sm sm:text-base cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Đang cào dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bắt đầu Cào Dữ Liệu</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets suggestions */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500">Mẫu trang web dùng thử nhanh:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_URLS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePastePreset(preset.url)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/60 text-slate-700 transition-all text-left flex items-center gap-1.5"
                    title={preset.desc}
                  >
                    <span>{preset.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Dán toàn bộ mã nguồn HTML (Dùng khi trang cần đăng nhập hoặc có file HTML sẵn)
            </label>
            <textarea
              rows={6}
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              placeholder="<html><body><h1>Tiêu đề</h1><p>Nội dung trang web...</p><table>...</table></body></html>"
              className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all text-slate-800"
              disabled={isLoading}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isLoading || !rawHtml.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md disabled:opacity-50 transition-all text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Đang phân tích HTML...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bóc Tách Dữ Liệu HTML</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Advanced Options Accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Ẩn cấu hình nâng cao' : 'Cấu hình cào nâng cao (User-Agent, Selectors CSS tùy chỉnh, Timeout)'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Agent */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trình duyệt giả lập (User-Agent):
                  </label>
                  <select
                    value={selectedUa}
                    onChange={(e) => setSelectedUa(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {USER_AGENTS.map((ua, i) => (
                      <option key={i} value={ua.value}>
                        {ua.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời gian chờ tối đa (Timeout): {timeoutSeconds} giây
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>5s (Nhanh)</span>
                    <span>25s (Tiêu chuẩn)</span>
                    <span>60s (Trang nặng)</span>
                  </div>
                </div>
              </div>

              {/* Custom CSS Selectors */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-semibold text-slate-800 text-xs">
                      Bóc tách theo CSS Selector tùy chỉnh (Tùy chọn)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSelector}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm bộ lọc
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Bạn có thể nhập selector CSS (như <code className="bg-slate-200 px-1 rounded">.product-title</code>, <code className="bg-slate-200 px-1 rounded">.price</code>, <code className="bg-slate-200 px-1 rounded">article h2</code>) để cào riêng trường dữ liệu đó.
                </p>

                <div className="space-y-2">
                  {customSelectors.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tên trường (vd: Giá bán)"
                        value={item.name}
                        onChange={(e) => handleSelectorChange(idx, 'name', e.target.value)}
                        className="w-1/3 p-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="CSS Selector (vd: .current-price, h2.title)"
                        value={item.selector}
                        onChange={(e) => handleSelectorChange(idx, 'selector', e.target.value)}
                        className="flex-1 p-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Thuộc tính (để trống lấy text, hoặc href/src)"
                        value={item.attribute || ''}
                        onChange={(e) => handleSelectorChange(idx, 'attribute', e.target.value)}
                        className="w-1/4 p-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSelector(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Xóa selector này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
