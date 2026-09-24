import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Maximize2,
  X,
  FileText
} from 'lucide-react';
import { ScrapedImage } from '../types/scraper';
import { exportToJson, exportToText, copyToClipboard } from '../utils/exportUtils';

interface ImagesTabProps {
  images: ScrapedImage[];
  domain?: string;
}

export const ImagesTab: React.FC<ImagesTabProps> = ({ images, domain = 'web' }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<ScrapedImage | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredImages = React.useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(img =>
      img.src.toLowerCase().includes(q) || (img.alt && img.alt.toLowerCase().includes(q))
    );
  }, [images, searchQuery]);

  const handleExportLinks = () => {
    const list = images.map(img => img.src).join('\n');
    exportToText(list, `images-urls-${domain}-${Date.now()}.txt`);
  };

  const handleExportJson = () => {
    exportToJson(images, `images-${domain}-${Date.now()}.json`);
  };

  const handleCopyUrls = async () => {
    const list = images.map(img => img.src).join('\n');
    const success = await copyToClipboard(list);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy hình ảnh nào</h3>
        <p className="text-xs text-slate-500">Trang này không chứa thẻ hình ảnh &lt;img&gt; thông thường.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Thư viện hình ảnh ({filteredImages.length}/{images.length})
            </h4>
            <p className="text-[11px] text-slate-500">Bóc tách toàn bộ link ảnh tuyệt đối từ trang web</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Lọc theo tên hoặc alt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleExportLinks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            title="Tải danh sách URL dạng TXT"
          >
            <FileText className="w-3.5 h-3.5" />
            Xuất URL (.TXT)
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          <button
            onClick={handleCopyUrls}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã sao chép' : 'Sao chép URLs'}
          </button>
        </div>
      </div>

      {/* Grid of Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredImages.map((img, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div
              className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => setPreviewImage(img)}
            >
              <img
                src={img.src}
                alt={img.alt || 'Scraped image'}
                loading="lazy"
                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://placehold.co/400x300?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh'
                  );
                }}
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/90 text-slate-900 shadow-xs">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="p-2.5 space-y-1 text-xs">
              <p className="font-medium text-slate-800 truncate" title={img.alt || 'Không có mô tả alt'}>
                {img.alt ? img.alt : <span className="text-slate-400 italic">Không có alt text</span>}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[120px] font-mono" title={img.src}>
                  {img.src.split('/').pop()?.split('?')[0] || 'image'}
                </span>
                <a
                  href={img.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 p-0.5"
                  title="Mở tab mới"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Image Zoom */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 truncate max-w-md">
                {previewImage.alt || previewImage.src}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>
            <div className="p-3 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono break-all max-w-lg truncate">
                {previewImage.src}
              </span>
              <a
                href={previewImage.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
              >
                <span>Mở ảnh gốc</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
