// Hashtag提取算法
import { YouTubeVideo, ExtractedHashtag, HashtagExtractionResult } from './supabase-types'

// 配置参数
const EXTRACTION_CONFIG = {
  // 是否从标题提取
  extractFromTitle: true,
  // 是否从描述提取
  extractFromDescription: true,
  // 是否使用原生tags
  useNativeTags: true,
  // 最小hashtag长度
  minHashtagLength: 2,
  // 最大hashtag长度
  maxHashtagLength: 50,
  // 置信度阈值
  confidenceThreshold: 0.5,
  // 需要过滤的常见无效hashtag
  blacklist: [
    'youtube', 'video', 'videos', 'new', 'latest', 'official',
    'subscribe', 'like', 'comment', 'share', 'follow',
    'www', 'http', 'https', 'com', 'org', 'net',
    'the', 'and', 'for', 'are', 'with', 'this', 'that',
    'a', 'an', 'in', 'on', 'at', 'to', 'from', 'by',
    'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might'
  ]
}

// 正则表达式模式
const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g
const WORD_BOUNDARY_REGEX = /\b([A-Z][a-zA-Z0-9]+|[a-z]+(?:[A-Z][a-zA-Z0-9]+)*)\b/g

// 主提取函数
export function extractHashtagsFromVideo(video: YouTubeVideo): HashtagExtractionResult {
  const extractedHashtags: ExtractedHashtag[] = []
  let position = 0

  // 1. 从标题提取hashtag
  if (EXTRACTION_CONFIG.extractFromTitle) {
    const titleHashtags = extractFromText(video.snippet.title, 'title')
    titleHashtags.forEach((hashtag, index) => {
      extractedHashtags.push({
        ...hashtag,
        position: index
      })
      position++
    })
  }

  // 2. 从描述提取hashtag
  if (EXTRACTION_CONFIG.extractFromDescription) {
    const descriptionHashtags = extractFromText(video.snippet.description, 'description')
    descriptionHashtags.forEach((hashtag, index) => {
      extractedHashtags.push({
        ...hashtag,
        position: position + index
      })
    })
    position += descriptionHashtags.length
  }

  // 3. 使用YouTube原生tags
  if (EXTRACTION_CONFIG.useNativeTags && video.snippet.tags) {
    const nativeHashtags = extractFromNativeTags(video.snippet.tags)
    nativeHashtags.forEach((hashtag, index) => {
      extractedHashtags.push({
        ...hashtag,
        position: position + index
      })
    })
  }

  // 去重并计算统计
  const uniqueHashtags = deduplicateHashtags(extractedHashtags)

  const result: HashtagExtractionResult = {
    videoId: video.id,
    hashtags: uniqueHashtags,
    extractionStats: {
      totalFromTitle: extractedHashtags.filter(h => h.source === 'title').length,
      totalFromDescription: extractedHashtags.filter(h => h.source === 'description').length,
      totalFromTags: extractedHashtags.filter(h => h.source === 'tags').length,
      totalExtracted: extractedHashtags.filter(h => h.source === 'extracted').length,
      uniqueCount: uniqueHashtags.length
    }
  }

  return result
}

// 从文本中提取hashtag（包括#开头的和有意义的词）
function extractFromText(text: string, source: 'title' | 'description' | 'extracted'): ExtractedHashtag[] {
  const hashtags: ExtractedHashtag[] = []

  // 1. 提取显式的#hashtag
  const explicitHashtags = Array.from(text.matchAll(HASHTAG_REGEX))
  explicitHashtags.forEach(match => {
    const hashtagName = match[1]
    if (isValidHashtag(hashtagName)) {
      hashtags.push({
        name: normalizeHashtag(hashtagName),
        source,
        confidence: 0.9 // 显式hashtag置信度高
      })
    }
  })

  // 2. 对于标题，提取有意义的词作为潜在hashtag
  if (source === 'title') {
    const meaningfulWords = extractMeaningfulWords(text)
    meaningfulWords.forEach(word => {
      if (isValidHashtag(word)) {
        hashtags.push({
          name: normalizeHashtag(word),
          source: 'extracted',
          confidence: 0.6 // 提取的词置信度中等
        })
      }
    })
  }

  return hashtags
}

// 从YouTube原生tags提取
function extractFromNativeTags(nativeTags: string[]): ExtractedHashtag[] {
  return nativeTags
    .filter(tag => isValidHashtag(tag))
    .map(tag => ({
      name: normalizeHashtag(tag),
      source: 'tags' as const,
      confidence: 0.8 // 原生tags置信度较高
    }))
}

// 提取有意义的词
function extractMeaningfulWords(text: string): string[] {
  const words: string[] = []

  // 1. 使用单词边界提取单词
  const wordMatches = Array.from(text.matchAll(WORD_BOUNDARY_REGEX))
  wordMatches.forEach(match => {
    const word = match[1]

    // 只保留有意义的词
    if (word.length >= EXTRACTION_CONFIG.minHashtagLength &&
        word.length <= EXTRACTION_CONFIG.maxHashtagLength &&
        !EXTRACTION_CONFIG.blacklist.includes(word.toLowerCase()) &&
        !isCommonStopWord(word)) {
      words.push(word)
    }
  })

  // 2. 提取数字+字母组合（如"Fortnite", "YouTube"等）
  const brandPatterns = [
    /\b[A-Z][a-z]+[A-Z][a-z]+\b/g, // CamelCase单词
    /\b[a-z]+(?:\d+[a-z]*)*\b/g,   // 包含数字的词
  ]

  brandPatterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern))
    matches.forEach(match => {
      const word = match[0]
      if (isValidHashtag(word)) {
        words.push(word)
      }
    })
  })

  return words
}

// 验证hashtag是否有效
function isValidHashtag(hashtag: string): boolean {
  const normalized = hashtag.toLowerCase()

  return (
    hashtag.length >= EXTRACTION_CONFIG.minHashtagLength &&
    hashtag.length <= EXTRACTION_CONFIG.maxHashtagLength &&
    !EXTRACTION_CONFIG.blacklist.includes(normalized) &&
    !isCommonStopWord(normalized) &&
    !isUrlOrDomain(normalized) &&
    !isNumeric(normalized)
  )
}

// 标准化hashtag名称
function normalizeHashtag(hashtag: string): string {
  return hashtag
    .replace(/^#/, '') // 移除开头的#
    .replace(/[^\w]/g, '') // 移除非字母数字下划线
    .toLowerCase() // 转为小写
    .trim()
}

// 检查是否为常见停用词
function isCommonStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'they', 'have',
    'been', 'has', 'had', 'was', 'were', 'will', 'would', 'could', 'should',
    'can', 'may', 'might', 'must', 'shall', 'about', 'after', 'before', 'during',
    'under', 'over', 'above', 'below', 'between', 'among', 'through', 'into',
    'onto', 'upon', 'within', 'without', 'against', 'along', 'around', 'behind',
    'beneath', 'beside', 'beyond', 'inside', 'outside', 'toward', 'towards',
    'upward', 'downward', 'forward', 'backward', 'outward', 'inward', 'away',
    'back', 'down', 'up', 'off', 'on', 'out', 'some', 'any', 'all', 'both',
    'each', 'few', 'many', 'most', 'none', 'other', 'several', 'such', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there',
    'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
    'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
    'theirs', 'themselves'
  ])

  return stopWords.has(word.toLowerCase())
}

// 检查是否为URL或域名
function isUrlOrDomain(text: string): boolean {
  const urlPatterns = [
    /^https?:\/\//,
    /^www\./,
    /\.com$/,
    /\.org$/,
    /\.net$/,
    /\.io$/,
    /\.co$/,
    /\.app$/,
    /\.gov$/,
    /\.edu$/,
    /\.mil$/,
    /\/\//,
    /\./
  ]

  return urlPatterns.some(pattern => pattern.test(text))
}

// 检查是否为纯数字
function isNumeric(text: string): boolean {
  return /^\d+$/.test(text)
}

// 去重hashtag（保留最高置信度的）
function deduplicateHashtags(hashtags: ExtractedHashtag[]): ExtractedHashtag[] {
  const hashtagMap = new Map<string, ExtractedHashtag>()

  hashtags.forEach(hashtag => {
    const normalizedName = normalizeHashtag(hashtag.name)
    const existing = hashtagMap.get(normalizedName)

    if (!existing || hashtag.confidence > existing.confidence) {
      hashtagMap.set(normalizedName, hashtag)
    }
  })

  return Array.from(hashtagMap.values())
}

// 根据置信度过滤hashtag
export function filterHashtagsByConfidence(
  hashtags: ExtractedHashtag[],
  threshold: number = EXTRACTION_CONFIG.confidenceThreshold
): ExtractedHashtag[] {
  return hashtags.filter(hashtag => hashtag.confidence >= threshold)
}

// 按来源分组hashtag
export function groupHashtagsBySource(hashtags: ExtractedHashtag[]): Record<string, ExtractedHashtag[]> {
  return hashtags.reduce((groups, hashtag) => {
    const source = hashtag.source
    if (!groups[source]) {
      groups[source] = []
    }
    groups[source].push(hashtag)
    return groups
  }, {} as Record<string, ExtractedHashtag[]>)
}

// 计算hashtag质量评分
export function calculateHashtagQuality(hashtag: ExtractedHashtag): number {
  let score = hashtag.confidence * 100

  // 根据来源调整分数
  switch (hashtag.source) {
    case 'tags':
      score += 20 // YouTube原生tags加分
      break
    case 'title':
      score += 10 // 标题中提取加分
      break
    case 'description':
      score += 5 // 描述中提取加分
      break
    case 'extracted':
      score += 0 // 提取的词不加分
      break
  }

  // 根据长度调整分数
  const length = hashtag.name.length
  if (length >= 3 && length <= 15) {
    score += 10 // 理想长度加分
  } else if (length > 30) {
    score -= 10 // 过长扣分
  }

  // 根据是否包含数字或大小写调整分数
  if (/\d/.test(hashtag.name)) {
    score += 5 // 包含数字加分
  }

  if (/[A-Z]/.test(hashtag.name)) {
    score += 3 // 包含大写加分
  }

  return Math.max(0, Math.min(100, score)) // 限制在0-100范围内
}

// 获取hashtag提取统计信息
export function getHashtagExtractionStats(results: HashtagExtractionResult[]): {
  totalVideos: number
  totalHashtags: number
  uniqueHashtags: number
  averageHashtagsPerVideo: number
  topSources: Array<{ source: string; count: number; percentage: number }>
  confidenceDistribution: Array<{ range: string; count: number }>
} {
  const totalVideos = results.length
  const allHashtags = results.flatMap(r => r.hashtags)
  const totalHashtags = allHashtags.length
  const uniqueHashtags = new Set(allHashtags.map(h => h.name)).size
  const averageHashtagsPerVideo = totalHashtags / totalVideos

  // 按来源统计
  const sourceCounts = allHashtags.reduce((counts, hashtag) => {
    counts[hashtag.source] = (counts[hashtag.source] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: (count / totalHashtags) * 100
    }))
    .sort((a, b) => b.count - a.count)

  // 置信度分布
  const confidenceRanges = [
    { range: '0.9-1.0', min: 0.9, max: 1.0 },
    { range: '0.7-0.9', min: 0.7, max: 0.9 },
    { range: '0.5-0.7', min: 0.5, max: 0.7 },
    { range: '0.3-0.5', min: 0.3, max: 0.5 },
    { range: '0.0-0.3', min: 0.0, max: 0.3 }
  ]

  const confidenceDistribution = confidenceRanges.map(range => ({
    range: range.range,
    count: allHashtags.filter(h => h.confidence >= range.min && h.confidence < range.max).length
  }))

  return {
    totalVideos,
    totalHashtags,
    uniqueHashtags,
    averageHashtagsPerVideo,
    topSources,
    confidenceDistribution
  }
}