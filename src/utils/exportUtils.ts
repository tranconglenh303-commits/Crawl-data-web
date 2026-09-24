export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJson(data: any, filename: string = 'scraped-data.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, filename, 'application/json;charset=utf-8');
}

export function exportToMarkdown(markdown: string, filename: string = 'scraped-content.md') {
  downloadFile(markdown, filename, 'text/markdown;charset=utf-8');
}

export function exportToText(text: string, filename: string = 'scraped-content.txt') {
  downloadFile(text, filename, 'text/plain;charset=utf-8');
}

export function generateCsvString(headers: string[], rows: (string | number | boolean)[][]): string {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines: string[] = [];
  if (headers && headers.length > 0) {
    lines.push(headers.map(escapeCsv).join(','));
  }

  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }

  return '\uFEFF' + lines.join('\r\n'); // Add BOM for Excel Vietnamese Unicode support
}

export function exportToCsv(headers: string[], rows: (string | number | boolean)[][], filename: string = 'table-data.csv') {
  const csvContent = generateCsvString(headers, rows);
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
