import { YouTubeCategoryListResponse, YouTubeCategory } from '@/types/youtube';
import categoriesData from '@/data/categories.json';

// 类别映射缓存
let categoriesMap: Record<string, string> | null = null;

// 加载并解析类别数据
export function loadCategories(): Record<string, string> {
  if (categoriesMap) return categoriesMap;

  const categories = (categoriesData as YouTubeCategoryListResponse).items;
  categoriesMap = {};

  categories.forEach((category: YouTubeCategory) => {
    categoriesMap[category.id] = category.snippet.title;
  });

  return categoriesMap;
}

// 获取类别名称
export function getCategoryName(categoryId: string): string {
  const categories = loadCategories();
  return categories[categoryId] || 'Unknown';
}

// 获取所有可用类别
export function getAllCategories(): { id: string; name: string }[] {
  const categories = loadCategories();
  return Object.entries(categories).map(([id, name]) => ({ id, name }));
}

// 语言映射
export const languageMap: Record<string, string> = {
  'en': 'English',
  'en-US': 'English (US)',
  'es': 'Español',
  'es-MX': 'Español (México)',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'ja': '日本語',
  'ko': '한국어',
  'zh': '中文',
  'zh-CN': '中文 (简体)',
  'zh-TW': '中文 (繁體)',
};

// 格式化语言代码
export function formatLanguage(languageCode: string): string {
  return languageMap[languageCode] || languageCode;
}