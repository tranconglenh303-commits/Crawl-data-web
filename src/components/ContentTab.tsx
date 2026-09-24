import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Code,
  BookOpen,
  AlignLeft
} from 'lucide-react';
import { exportToMarkdown, exportToText, copyToClipboard } from '../utils/exportUtils';

interface ContentTabProps {
  markdown: string;
  rawText: string;
  domain?: string;
  wordCount: number;
  charCount: number;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  markdown,
  rawText,
  domain = 'web',
  wordCount,
  charCount,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'text'>('preview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const activeContent = viewMode === 'text' ? rawText : markdown;

  const handleCopy = async () => {
    const success = await copyToClipboard(activeContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (viewMode === 'text') {
      exportToText(rawText, `content-${domain}-${Date.now()}.txt`);
    } else {
      exportToMarkdown(markdown, `content-${domain}-${Date.now()}.md`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Đọc trước
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'markdown' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Mã Markdown
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'text' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Văn bản thuần
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>{wordCount.toLocaleString()} từ</span>
            <span>•</span>
            <span>{charCount.toLocaleString()} ký tự</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            title={viewMode === 'text' ? 'Tải tệp .txt' : 'Tải tệp .md'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải {viewMode === 'text' ? '.TXT' : '.MD'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-8 max-h-[750px] overflow-y-auto">
        {viewMode === 'preview' ? (
          <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base space-y-4">
            {markdown ? (
              markdown.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 pt-3 border-b pb-2">
                      {trimmed.replace('# ', '')}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-800 pt-2">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-800">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="pl-4 border-l-4 border-indigo-400 italic text-slate-600 my-2">
                      {trimmed.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (trimmed.startsWith('```')) {
                  return (
                    <pre key={idx} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                      {trimmed.replace(/```/g, '')}
                    </pre>
                  );
                }
                return (
                  <p key={idx} className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {trimmed}
                  </p>
                );
              })
            ) : (
              <p className="text-slate-400 italic">Không có nội dung văn bản bóc tách được.</p>
            )}
          </div>
        ) : (
          <pre className="font-mono text-xs sm:text-sm bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {activeContent || 'Không có dữ liệu.'}
          </pre>
        )}
      </div>
    </div>
  );
};
