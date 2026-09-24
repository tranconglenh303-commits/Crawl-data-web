import {
  ScrapedData,
  ScrapeOptions,
  ScrapedTable,
  ScrapedImage,
  ScrapedLink,
  ScrapedHeading,
  CustomSelectorResult,
  ScrapedStats,
  ScrapedMetadata,
} from '../types/scraper';

export async function scrapeOnClient(
  url: string,
  rawHtml: string,
  options?: ScrapeOptions
): Promise<ScrapedData> {
  const startTime = Date.now();
  let html = rawHtml ? rawHtml.trim() : '';
  let finalUrl = url.trim();

  if (!html && finalUrl) {
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const corsProxies = [
      `https://corsproxy.io/?url=${encodeURIComponent(finalUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`,
    ];

    let fetchedHtml = '';

    for (const proxyUrl of corsProxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 50 && (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<body') || text.includes('<div') || text.includes('<table'))) {
            fetchedHtml = text;
            break;
          }
        }
      } catch (err) {
        // Thử proxy kế tiếp
      }
    }

    if (!fetchedHtml) {
      throw new Error(
        'Không thể tải trực tiếp trang này do chính sách CORS/Cloudflare của website đích. Bạn hãy mở trang đó, ấn Ctrl+U copy toàn bộ mã nguồn HTML rồi dán vào tab "Dán mã nguồn HTML" để cào dữ liệu ngay nhé!'
      );
    }
    html = fetchedHtml;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let domain = 'web';
  try {
    if (finalUrl) domain = new URL(finalUrl).hostname;
  } catch {
    domain = 'custom-html';
  }

  const baseHref = finalUrl || 'https://example.com';
  const toAbsoluteUrl = (rel: string | null): string => {
    if (!rel) return '';
    try {
      return new URL(rel.trim(), baseHref).href;
    } catch {
      return rel.trim();
    }
  };

  const title = doc.querySelector('title')?.textContent?.trim() || '';
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';

  const metadata: ScrapedMetadata = {
    title,
    description,
    domain,
  };

  // Trích xuất Tables
  const tables: ScrapedTable[] = [];
  doc.querySelectorAll('table').forEach((tbl, idx) => {
    const headers: string[] = [];
    tbl.querySelectorAll('thead tr th, tr th').forEach((th, cIdx) => {
      headers.push(th.textContent?.trim() || `Cột ${cIdx + 1}`);
    });

    const rows: string[][] = [];
    tbl.querySelectorAll('tbody tr, tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length > 0) {
        const row = Array.from(cells).map((c) => c.textContent?.trim().replace(/\s+/g, ' ') || '');
        rows.push(row);
      }
    });

    if (rows.length > 0 || headers.length > 0) {
      tables.push({
        index: idx,
        id: `tbl-${idx + 1}`,
        caption: tbl.querySelector('caption')?.textContent?.trim() || `Bảng dữ liệu #${idx + 1}`,
        headers: headers.length > 0 ? headers : (rows[0] || []).map((_, i) => `Cột ${i + 1}`),
        rows,
        rowCount: rows.length,
        colCount: headers.length || (rows[0] ? rows[0].length : 0),
      });
    }
  });

  // Trích xuất Headings
  const headings: ScrapedHeading[] = [];
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const text = h.textContent?.trim();
    if (text) {
      headings.push({
        level: h.tagName.toUpperCase() as any,
        text: text.replace(/\s+/g, ' '),
      });
    }
  });

  // Trích xuất Images
  const images: ScrapedImage[] = [];
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      images.push({
        src: toAbsoluteUrl(src),
        alt: img.getAttribute('alt')?.trim() || '',
      });
    }
  });

  // Trích xuất Links
  const links: ScrapedLink[] = [];
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({
        href: toAbsoluteUrl(href),
        text: a.textContent?.trim().replace(/\s+/g, ' ') || '',
        isInternal: href.startsWith('/') || href.includes(domain),
      });
    }
  });

  const rawText = doc.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  const stats: ScrapedStats = {
    wordCount,
    charCount: rawText.length,
    readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
    totalTables: tables.length,
    totalImages: images.length,
    totalLinks: links.length,
    totalHeadings: headings.length,
    internalLinksCount: links.filter((l) => l.isInternal).length,
    externalLinksCount: links.filter((l) => !l.isInternal).length,
  };

  return {
    url: finalUrl,
    fetchTimeMs: Date.now() - startTime,
    responseStatus: 200,
    contentType: 'text/html; charset=UTF-8',
    metadata,
    stats,
    headings,
    images: images.slice(0, 200),
    links: links.slice(0, 300),
    markdown: rawText,
    rawText,
    tables,
    customResults: [],
  };
}
