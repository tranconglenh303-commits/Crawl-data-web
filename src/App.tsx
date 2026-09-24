import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Table,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Layers,
  Sliders,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  Zap,
  Globe2,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { ScrapeForm } from './components/ScrapeForm';
import { OverviewCard } from './components/OverviewCard';
import { AiExtractionTab } from './components/AiExtractionTab';
import { TablesTab } from './components/TablesTab';
import { ContentTab } from './components/ContentTab';
import { ImagesTab } from './components/ImagesTab';
import { LinksTab } from './components/LinksTab';
import { HeadingsTab } from './components/HeadingsTab';
import { CustomSelectorsTab } from './components/CustomSelectorsTab';
import { AiChatTab } from './components/AiChatTab';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ScrapedData, ScrapeOptions, HistoryItem } from './types/scraper';
import { scrapeOnClient } from './utils/clientScraper';

export default function App() {
  const [data, setData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ai-extract');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isStaticMode, setIsStaticMode] = useState<boolean>(false);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('webscraper_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (scraped: ScrapedData) => {
    try {
      const newItem: HistoryItem = {
        id: `h-${Date.now()}`,
        url: scraped.url,
        title: scraped.metadata.title || scraped.url,
        domain: scraped.metadata.domain || '',
        timestamp: Date.now(),
        stats: scraped.stats,
        data: scraped,
      };

      const updated = [newItem, ...history.filter(h => h.url !== scraped.url)].slice(0, 25);
      setHistory(updated);
      localStorage.setItem('webscraper_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('webscraper_history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('webscraper_history', JSON.stringify(updated));
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setData(item.data);
    setError(null);
  };

  const handleScrape = async (url: string, rawHtml: string, options: ScrapeOptions) => {
    setIsLoading(true);
    setError(null);

    let scrapedDataResult: ScrapedData | null = null;
    const isGitHubPages = window.location.hostname.endsWith('github.io');

    // 1. Nếu không phải GitHub Pages, thử gọi backend Node.js (/api/scrape)
    if (!isGitHubPages) {
      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            rawHtml,
            options,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            scrapedDataResult = resData.data;
          }
        }
      } catch (err: any) {
        console.warn('Backend /api/scrape không khả dụng, chuyển sang chế độ Client Scraper...');
      }
    }

    // 2. Chạy trên GitHub Pages hoặc khi Backend không khả dụng: Dùng Client Scraper
    if (!scrapedDataResult) {
      try {
        setIsStaticMode(true);
        scrapedDataResult = await scrapeOnClient(url, rawHtml, options);
      } catch (clientErr: any) {
        setError(clientErr.message || 'Không thể cào dữ liệu từ trang này.');
        setIsLoading(false);
        return;
      }
    }

    if (scrapedDataResult) {
      setData(scrapedDataResult);
      saveToHistory(scrapedDataResult);

      if (scrapedDataResult.tables && scrapedDataResult.tables.length > 0) {
        setActiveTab('tables');
      } else {
        setActiveTab('ai-extract');
      }
    }
    setIsLoading(false);
  };

  const TABS = [
    {
      id: 'ai-extract',
      label: 'Trích xuất bằng AI',
      icon: Sparkles,
      badge: 'Gemini 3.8',
      highlight: true,
    },
    {
      id: 'tables',
      label: 'Bảng dữ liệu',
      icon: Table,
      count: data?.stats.totalTables || 0,
    },
    {
      id: 'content',
      label: 'Nội dung & Markdown',
      icon: FileText,
      count: data?.stats.wordCount ? `${data.stats.wordCount} từ` : undefined,
    },
    {
      id: 'images',
      label: 'Hình ảnh',
      icon: ImageIcon,
      count: data?.stats.totalImages || 0,
    },
    {
      id: 'links',
      label: 'Liên kết',
      icon: LinkIcon,
      count: data?.stats.totalLinks || 0,
    },
    {
      id: 'headings',
      label: 'Dàn ý SEO',
      icon: Layers,
      count: data?.stats.totalHeadings || 0,
    },
    {
      id: 'custom',
      label: 'CSS Selectors',
      icon: Sliders,
      count: data?.customResults?.length || 0,
    },
    {
      id: 'chat',
      label: 'Hỏi đáp AI',
      icon: MessageSquare,
      badge: 'Chat',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans">
      <Header onOpenHistory={() => setIsHistoryOpen(true)} historyCount={history.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-2">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đầy đủ: DOM Parser + Cheerio + Gemini 3.8 Flash AI Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cào và Trích Xuất Dữ Liệu Bất Kỳ Website Nào
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Nhập đường link hoặc dán mã HTML: Hệ thống tự động thu thập toàn bộ văn bản, bảng biểu HTML, hình ảnh, liên kết, metadata SEO và cho phép trích xuất dữ liệu có cấu trúc thành JSON/Excel bằng AI.
          </p>
        </div>

        {/* Scrape Input Form */}
        <ScrapeForm onScrape={handleScrape} isLoading={isLoading} />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="font-bold text-rose-900">Không thể cào dữ liệu từ trang này</div>
              <p className="text-rose-700 leading-relaxed">{error}</p>
              <div className="pt-2 text-[11px] text-rose-600">
                💡 <strong>Mẹo khắc phục:</strong> Một số website có hệ thống Cloudflare / chặn bot. Bạn có thể mở website đó trên trình duyệt, nhấn chuột phải &gt; <em>"Xem nguồn trang" (View Page Source)</em>, copy toàn bộ rồi dán vào tab <strong>"Dán trực tiếp mã HTML nguồn"</strong> phía trên để bóc tách ngay lập tức!
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {data ? (
          <div className="space-y-6">
            <OverviewCard data={data} onSelectTab={(tab) => setActiveTab(tab)} />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? tab.highlight
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                          : 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive && tab.highlight ? 'text-amber-300' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                          isActive && tab.highlight
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              {activeTab === 'ai-extract' && <AiExtractionTab scrapedData={data} />}
              {activeTab === 'tables' && <TablesTab tables={data.tables} domain={data.metadata.domain} />}
              {activeTab === 'content' && (
                <ContentTab
                  markdown={data.markdown}
                  rawText={data.rawText}
                  domain={data.metadata.domain}
                  wordCount={data.stats.wordCount}
                  charCount={data.stats.charCount}
                />
              )}
              {activeTab === 'images' && <ImagesTab images={data.images} domain={data.metadata.domain} />}
              {activeTab === 'links' && <LinksTab links={data.links} domain={data.metadata.domain} />}
              {activeTab === 'headings' && (
                <HeadingsTab headings={data.headings} metadata={data.metadata} />
              )}
              {activeTab === 'custom' && (
                <CustomSelectorsTab
                  customResults={data.customResults}
                  domain={data.metadata.domain}
                />
              )}
              {activeTab === 'chat' && <AiChatTab scrapedData={data} />}
            </div>
          </div>
        ) : (
          /* Empty / Welcome State Guide Cards */
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Cung cấp Link hoặc Mã HTML</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chỉ cần dán URL bất kỳ trang web nào hoặc chọn các trang mẫu có sẵn (Wikipedia, VnExpress, W3Schools, GDP Data...).
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Bóc tách toàn diện dữ liệu</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tự động thu thập bài viết Markdown, trích xuất tất cả các bảng dữ liệu (&lt;table&gt;), toàn bộ ảnh, link nội bộ/ngoài, và thẻ meta SEO.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Trí tuệ nhân tạo Gemini 3.8</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AI đọc hiểu toàn văn bản để tự động trích xuất danh sách sản phẩm, bảng giá, danh bạ liên hệ, việc làm, và cho phép trò chuyện hỏi đáp trực tiếp.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-3 text-xs text-indigo-950">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>
                  Hỗ trợ xuất file định dạng <strong>CSV (tương thích Excel tiếng Việt có dấu chuẩn UTF-8 BOM)</strong>, <strong>JSON</strong>, <strong>Markdown (.MD)</strong>.
                </span>
              </div>
              <span className="font-semibold text-indigo-700">Sẵn sàng sử dụng 🚀</span>
            </div>
          </div>
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistory}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WebScraper AI • Trình cào dữ liệu web tự động và thông minh</span>
          <span>Tương thích với các định dạng bảng, bài viết, đa phương tiện & AI Extraction</span>
        </div>
      </footer>
    </div>
  );
}
