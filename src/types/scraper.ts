export interface ScrapeOptions {
  userAgent?: string;
  timeoutMs?: number;
  customSelectors?: Array<{ name: string; selector: string; attribute?: string }>;
  extractMainContentOnly?: boolean;
}

export interface ScrapedMetadata {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  publishedTime?: string;
  canonical?: string;
  language?: string;
  ogImage?: string;
  favicon?: string;
  domain?: string;
}

export interface ScrapedStats {
  wordCount: number;
  charCount: number;
  readingTimeMin: number;
  totalHeadings: number;
  totalTables: number;
  totalImages: number;
  totalLinks: number;
  internalLinksCount: number;
  externalLinksCount: number;
}

export interface ScrapedHeading {
  level: string;
  text: string;
  id?: string;
}

export interface ScrapedTable {
  index: number;
  id?: string;
  caption?: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
  colCount: number;
}

export interface ScrapedImage {
  src: string;
  alt: string;
  width?: string;
  height?: string;
  title?: string;
}

export interface ScrapedLink {
  href: string;
  text: string;
  isInternal: boolean;
  rel?: string;
  target?: string;
}

export interface CustomSelectorResult {
  name: string;
  selector: string;
  count: number;
  results: string[];
}

export interface ScrapedData {
  url: string;
  fetchTimeMs: number;
  responseStatus: number;
  contentType: string;
  metadata: ScrapedMetadata;
  stats: ScrapedStats;
  headings: ScrapedHeading[];
  markdown: string;
  rawText: string;
  tables: ScrapedTable[];
  images: ScrapedImage[];
  links: ScrapedLink[];
  customResults: CustomSelectorResult[];
}

export interface AiExtractionResult {
  title: string;
  summary: string;
  schemaType: string;
  totalItems: number;
  columns: string[];
  items: Record<string, any>[];
  keyInsights?: string[];
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: number;
  stats: ScrapedStats;
  data: ScrapedData;
}
