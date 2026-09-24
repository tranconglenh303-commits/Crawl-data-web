import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ScrapeRequest {
  url?: string;
  rawHtml?: string;
  options?: {
    userAgent?: string;
    timeoutMs?: number;
    customSelectors?: Array<{ name: string; selector: string; attribute?: string }>;
    extractMainContentOnly?: boolean;
    includeImages?: boolean;
    includeLinks?: boolean;
    includeTables?: boolean;
  };
}

interface CustomSelectorResult {
  name: string;
  selector: string;
  count: number;
  results: string[];
}

function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    if (!relativeUrl || relativeUrl.startsWith('data:') || relativeUrl.startsWith('javascript:')) {
      return relativeUrl;
    }
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

// Convert HTML subtree to clean readable Markdown
function htmlToMarkdown($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
  const clone = element.clone();
  clone.find('script, style, noscript, svg, iframe, nav, footer, header, form').remove();

  let markdown = '';

  clone.find('h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote, pre').each((_, el) => {
    const tagName = (el as any).tagName?.toLowerCase();
    const text = $(el).text().trim().replace(/\s+/g, ' ');

    if (!text) return;

    if (tagName === 'h1') markdown += `\n\n# ${text}\n`;
    else if (tagName === 'h2') markdown += `\n\n## ${text}\n`;
    else if (tagName === 'h3') markdown += `\n\n### ${text}\n`;
    else if (tagName === 'h4') markdown += `\n\n#### ${text}\n`;
    else if (tagName === 'h5' || tagName === 'h6') markdown += `\n\n##### ${text}\n`;
    else if (tagName === 'p') markdown += `\n\n${text}\n`;
    else if (tagName === 'blockquote') markdown += `\n\n> ${text}\n`;
    else if (tagName === 'pre') markdown += `\n\n\`\`\`\n${$(el).text()}\n\`\`\`\n`;
    else if (tagName === 'ul' || tagName === 'ol') {
      $(el).find('li').each((idx, li) => {
        const liText = $(li).text().trim().replace(/\s+/g, ' ');
        if (liText) {
          markdown += tagName === 'ol' ? `\n${idx + 1}. ${liText}` : `\n* ${liText}`;
        }
      });
      markdown += '\n';
    }
  });

  return markdown.trim();
}

// Scrape API Endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, rawHtml, options } = req.body as ScrapeRequest;

    if (!url && !rawHtml) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp URL hoặc mã HTML để cào dữ liệu.',
      });
    }

    let targetUrl = url ? url.trim() : 'https://example.com';
    if (url && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    let htmlContent = '';
    let responseStatus = 200;
    let contentType = 'text/html';
    let fetchTimeMs = 0;

    if (rawHtml) {
      htmlContent = rawHtml;
      fetchTimeMs = 5;
    } else {
      const userAgent = options?.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

      const timeoutMs = options?.timeoutMs || 20000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const startTime = Date.now();
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        fetchTimeMs = Date.now() - startTime;
        responseStatus = response.status;
        contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          return res.status(400).json({
            success: false,
            error: `Website phản hồi mã lỗi HTTP ${response.status} (${response.statusText}).`,
            status: response.status,
          });
        }

        htmlContent = await response.text();
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === 'AbortError';
        return res.status(500).json({
          success: false,
          error: isTimeout
            ? `Quá thời gian chờ tải trang (${timeoutMs / 1000}s). Vui lòng thử lại hoặc kiểm tra đường truyền.`
            : `Không thể kết nối đến URL: ${err.message || 'Lỗi mạng'}`,
        });
      }
    }

    // Load Cheerio
    const $ = cheerio.load(htmlContent);

    // Extract Metadata
    const title = $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() || '';

    const description = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') || '';

    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') || '';
    const publishedTime = $('meta[property="article:published_time"]').attr('content') ||
      $('time').first().attr('datetime') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const language = $('html').attr('lang') || 'vi';

    const ogImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') || '';
    const resolvedOgImage = ogImage ? resolveUrl(ogImage, targetUrl) : '';

    const favicon = $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '/favicon.ico';
    const resolvedFavicon = resolveUrl(favicon, targetUrl);

    // Headings
    const headings: Array<{ level: string; text: string; id?: string }> = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text) {
        headings.push({
          level: (el as any).tagName?.toUpperCase() || 'H',
          text,
          id: $(el).attr('id'),
        });
      }
    });

    // Main content container detection
    let mainContainer = $('article, main, .post-content, .entry-content, #content, [role="main"]').first();
    if (!mainContainer.length) {
      mainContainer = $('body');
    }

    // Clean text and Markdown
    const markdown = htmlToMarkdown($, mainContainer);

    // Text stats
    const rawText = mainContainer.clone().find('script, style, noscript').remove().end().text().trim().replace(/\s+/g, ' ');
    const wordCount = rawText ? rawText.split(/\s+/).length : 0;
    const charCount = rawText.length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    // Extract All Tables
    const tables: Array<{
      index: number;
      id?: string;
      caption?: string;
      headers: string[];
      rows: string[][];
      rowCount: number;
      colCount: number;
    }> = [];

    $('table').each((index, tableEl) => {
      const table$ = $(tableEl);
      const caption = table$.find('caption').text().trim();
      const id = table$.attr('id');

      let headers: string[] = [];
      table$.find('thead th, tr:first-child th').each((_, th) => {
        headers.push($(th).text().trim().replace(/\s+/g, ' '));
      });

      const rows: string[][] = [];
      table$.find('tbody tr, tr').each((trIdx, tr) => {
        // Skip header row if already caught
        if (headers.length > 0 && trIdx === 0 && table$.find('thead').length === 0) {
          const firstRowThs = $(tr).find('th');
          if (firstRowThs.length > 0) return;
        }

        const rowData: string[] = [];
        $(tr).find('td, th').each((_, cell) => {
          rowData.push($(cell).text().trim().replace(/\s+/g, ' '));
        });

        if (rowData.some(cell => cell.length > 0)) {
          rows.push(rowData);
        }
      });

      // If no thead headers found, use first row as headers if rows exist
      if (headers.length === 0 && rows.length > 0) {
        headers = rows[0].map((_, i) => `Cột ${i + 1}`);
      }

      if (rows.length > 0 || headers.length > 0) {
        tables.push({
          index: index + 1,
          id,
          caption: caption || `Bảng dữ liệu #${index + 1}`,
          headers,
          rows,
          rowCount: rows.length,
          colCount: Math.max(headers.length, ...rows.map(r => r.length), 0),
        });
      }
    });

    // Extract All Images
    let hostDomain = '';
    try {
      hostDomain = new URL(targetUrl).hostname;
    } catch {
      hostDomain = '';
    }

    const imagesMap = new Map<string, { src: string; alt: string; width?: string; height?: string; title?: string }>();
    $('img').each((_, img) => {
      const rawSrc = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('srcset')?.split(' ')[0];
      if (rawSrc && !rawSrc.startsWith('data:image/svg')) {
        const fullSrc = resolveUrl(rawSrc, targetUrl);
        if (!imagesMap.has(fullSrc) && fullSrc.startsWith('http')) {
          imagesMap.set(fullSrc, {
            src: fullSrc,
            alt: $(img).attr('alt')?.trim() || '',
            width: $(img).attr('width'),
            height: $(img).attr('height'),
            title: $(img).attr('title'),
          });
        }
      }
    });
    const images = Array.from(imagesMap.values());

    // Extract All Links
    const linksMap = new Map<string, { href: string; text: string; isInternal: boolean; rel?: string; target?: string }>();
    $('a').each((_, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim().replace(/\s+/g, ' ');

      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const fullHref = resolveUrl(href, targetUrl);
        if (fullHref.startsWith('http') && !linksMap.has(fullHref)) {
          let isInternal = false;
          try {
            const linkHost = new URL(fullHref).hostname;
            isInternal = linkHost === hostDomain || linkHost.endsWith('.' + hostDomain);
          } catch {}

          linksMap.set(fullHref, {
            href: fullHref,
            text: text || fullHref,
            isInternal,
            rel: $(a).attr('rel'),
            target: $(a).attr('target'),
          });
        }
      }
    });
    const links = Array.from(linksMap.values());

    // Custom Selectors execution
    const customResults: CustomSelectorResult[] = [];
    if (options?.customSelectors && Array.isArray(options.customSelectors)) {
      for (const item of options.customSelectors) {
        if (item.selector && item.selector.trim()) {
          const list: string[] = [];
          $(item.selector.trim()).each((_, el) => {
            if (item.attribute && item.attribute.trim()) {
              const attrVal = $(el).attr(item.attribute.trim());
              if (attrVal) list.push(attrVal.trim());
            } else {
              const txt = $(el).text().trim().replace(/\s+/g, ' ');
              if (txt) list.push(txt);
            }
          });
          customResults.push({
            name: item.name || item.selector,
            selector: item.selector,
            count: list.length,
            results: list,
          });
        }
      }
    }

    return res.json({
      success: true,
      data: {
        url: targetUrl,
        fetchTimeMs,
        responseStatus,
        contentType,
        metadata: {
          title,
          description,
          keywords,
          author,
          publishedTime,
          canonical,
          language,
          ogImage: resolvedOgImage,
          favicon: resolvedFavicon,
          domain: hostDomain,
        },
        stats: {
          wordCount,
          charCount,
          readingTimeMin,
          totalHeadings: headings.length,
          totalTables: tables.length,
          totalImages: images.length,
          totalLinks: links.length,
          internalLinksCount: links.filter(l => l.isInternal).length,
          externalLinksCount: links.filter(l => !l.isInternal).length,
        },
        headings,
        markdown,
        rawText: rawText.slice(0, 100000), // safe limit for raw text
        tables,
        images: images.slice(0, 500),
        links: links.slice(0, 1000),
        customResults,
      },
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xảy ra trong quá trình cào trang web.',
    });
  }
});

// AI Intelligent Structured Extraction Endpoint
app.post('/api/ai/extract', async (req, res) => {
  try {
    const { content, url, prompt, schemaType } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có nội dung trang web để AI trích xuất.',
      });
    }

    const cleanContent = String(content).slice(0, 45000); // Send generous context to Gemini

    let instruction = `Bạn là chuyên gia trích xuất dữ liệu website (Web Scraping & Data Extraction Expert).
Nhiệm vụ của bạn là phân tích toàn bộ văn bản/nội dung trang web được cung cấp và trích xuất dữ liệu có cấu trúc chính xác theo yêu cầu.
Hãy trả về JSON hợp lệ theo đúng cấu trúc sau:
{
  "title": "Tiêu đề dữ liệu trích xuất",
  "summary": "Tóm tắt ngắn gọn về dữ liệu đã trích xuất (1-2 câu tiếng Việt)",
  "schemaType": "${schemaType || 'custom'}",
  "totalItems": 0,
  "columns": ["Tên cột 1", "Tên cột 2", ...],
  "items": [
    { "cột 1": "giá trị", ... }
  ],
  "keyInsights": ["Điểm nổi bật 1", "Điểm nổi bật 2", ...]
}`;

    if (schemaType === 'products') {
      instruction += `\nYêu cầu đặc thù: Trích xuất danh sách sản phẩm/hàng hóa với các trường: tên sản phẩm, giá bán, giá gốc (nếu có), giảm giá, thương hiệu/hãng, tình trạng kho/đánh giá, mô tả ngắn.`;
    } else if (schemaType === 'contacts') {
      instruction += `\nYêu cầu đặc thù: Trích xuất mọi thông tin liên hệ: email, số điện thoại, địa chỉ, mạng xã hội, tên công ty/người đại diện, giờ làm việc.`;
    } else if (schemaType === 'jobs') {
      instruction += `\nYêu cầu đặc thù: Trích xuất các vị trí tuyển dụng, mức lương, địa điểm, yêu cầu, kinh nghiệm, phúc lợi.`;
    } else if (schemaType === 'faq') {
      instruction += `\nYêu cầu đặc thù: Trích xuất danh sách câu hỏi & câu trả lời (Q&A/FAQ).`;
    }

    const userPrompt = `URL nguồn: ${url || 'Trang cung cấp'}
Yêu cầu cụ thể từ người dùng: ${prompt || 'Hãy trích xuất tất cả dữ liệu có giá trị thành bảng dữ liệu hoàn chỉnh.'}

NỘI DUNG TRANG WEB CẦN TRÍCH XUẤT:
---
${cleanContent}
---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: instruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = {
        title: 'Kết quả trích xuất',
        summary: text,
        columns: [],
        items: [],
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('AI Extraction error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi trích xuất dữ liệu bằng AI.',
    });
  }
});

// AI Q&A Chat about the scraped page
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, content, url } = req.body;
    if (!question || !content) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu câu hỏi hoặc nội dung trang web.',
      });
    }

    const cleanContent = String(content).slice(0, 45000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Nội dung trang web (${url || 'N/A'}):
---
${cleanContent}
---

Câu hỏi của người dùng: ${question}

Hãy trả lời chi tiết, chính xác dựa trên thông tin thực tế trong trang web trên. Định dạng câu trả lời bằng Markdown rõ ràng, gạch đầu dòng và số liệu cụ thể nếu có.`,
      config: {
        systemInstruction: 'Bạn là trợ lý phân tích dữ liệu web thông minh, phản hồi người dùng bằng tiếng Việt chuẩn xác và khách quan.',
      },
    });

    return res.json({
      success: true,
      answer: response.text || 'Không có câu trả lời từ mô hình.',
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xử lý câu hỏi.',
    });
  }
});

// Setup Vite middlewares for development or serve static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
