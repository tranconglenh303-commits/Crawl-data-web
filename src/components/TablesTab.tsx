import React, { useState } from 'react';
import {
  Table as TableIcon,
  Download,
  Copy,
  Check,
  Search,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ScrapedTable } from '../types/scraper';
import { exportToCsv, exportToJson, copyToClipboard } from '../utils/exportUtils';

interface TablesTabProps {
  tables: ScrapedTable[];
  domain?: string;
}

export const TablesTab: React.FC<TablesTabProps> = ({ tables, domain = 'web' }) => {
  const [selectedTableIdx, setSelectedTableIdx] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <TableIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Không tìm thấy thẻ bảng HTML (&lt;table&gt;)</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Trang web này không sử dụng bảng HTML chuẩn. Bạn có thể sử dụng tính năng{' '}
          <strong className="text-indigo-600">Trích xuất AI</strong> để tự động bóc tách danh sách thành bảng biểu.
        </p>
      </div>
    );
  }

  const currentTable = tables[selectedTableIdx] || tables[0];

  const filteredRows = React.useMemo(() => {
    if (!searchFilter.trim()) return currentTable.rows;
    const q = searchFilter.toLowerCase();
    return currentTable.rows.filter(row =>
      row.some(cell => cell.toLowerCase().includes(q))
    );
  }, [currentTable, searchFilter]);

  const handleExportCsv = () => {
    exportToCsv(
      currentTable.headers,
      currentTable.rows,
      `table-${selectedTableIdx + 1}-${domain}-${Date.now()}.csv`
    );
  };

  const handleExportAllTables = () => {
    tables.forEach((tbl, i) => {
      exportToCsv(tbl.headers, tbl.rows, `table-${i + 1}-${domain}.csv`);
    });
  };

  const handleCopyTable = async () => {
    const formatted = [
      currentTable.headers.join('\t'),
      ...currentTable.rows.map(r => r.join('\t')),
    ].join('\n');

    const success = await copyToClipboard(formatted);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Selector bar if multiple tables exist */}
      {tables.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
            Chọn bảng ({tables.length} bảng tìm thấy):
          </span>
          {tables.map((t, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedTableIdx(idx);
                setSearchFilter('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTableIdx === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.caption || `Bảng #${idx + 1}`} ({t.rowCount} dòng)
            </button>
          ))}
        </div>
      )}

      {/* Main Table Viewer Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                {currentTable.caption || `Bảng dữ liệu #${selectedTableIdx + 1}`}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {currentTable.rowCount} hàng × {currentTable.colCount} cột
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm ô dữ liệu..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden w-40 sm:w-52"
              />
            </div>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Xuất bảng này ra file CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xuất CSV
            </button>

            {tables.length > 1 && (
              <button
                onClick={handleExportAllTables}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Tải tất cả các bảng thành từng file CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Tải tất cả ({tables.length})
              </button>
            )}

            <button
              onClick={handleCopyTable}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Sao chép bảng dạng tab-separated để dán trực tiếp vào Google Sheets / Excel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Đã sao chép' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-800 shadow-2xs">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {h || `Cột ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {rIdx + 1}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3 text-slate-800 leading-normal">
                      {cell || <span className="text-slate-300 italic">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(currentTable.headers.length + 1, 2)}
                    className="p-8 text-center text-slate-400"
                  >
                    Không có dòng dữ liệu nào khớp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
