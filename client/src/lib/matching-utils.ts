export type MatchableItem = {
  itemTitle?: string;
  title?: string;
  description?: string;
  category?: string;
};

export type MatchLevel = 'High Match' | 'Medium Match' | 'Low Match';

export type MatchResult<T extends MatchableItem> = T & {
  matchScore: number;
  matchPercentage: number;
  matchLevel: MatchLevel;
  matchedKeywords: string[];
  isLowConfidenceMatch: boolean;
};

export type ImageKeywordExtractor = (file: File, contextKeywords?: string[]) => string[];

export type ImageFeatures = {
  // Current matching contract uses keyword overlap.
  keywords: string[];
  // Future AI contract can include dense vector embeddings from TensorFlow.js.
  embeddings?: number[];
};

export type KeywordBuckets = {
  high: string[];
  medium: string[];
  low: string[];
};

export type ImageFeatureExtractor = (file: File, contextKeywords?: string[]) => ImageFeatures;

const KEYWORD_FALLBACK_MAP: Record<string, string[]> = {
  iphone: ['phone', 'mobile', 'smartphone'],
  wallet: ['purse'],
  bag: ['backpack'],
};

const HIGH_PRIORITY_KEYWORDS = [
  'toyota',
  'mitsubishi',
  'iphone',
  'samsung',
  'honda',
  'apple',
  'xiaomi',
  'sony',
  'dell',
  'lenovo',
  'hp',
  'nike',
  'adidas',
  'puma',
  'huawei',
  'oppo',
  'vivo',
] as const;

const MEDIUM_PRIORITY_KEYWORDS = [
  'key',
  'keys',
  'bottle',
  'phone',
  'charger',
  'wallet',
  'bag',
  'backpack',
  'watch',
  'book',
  'card',
  'laptop',
  'tablet',
] as const;

const LOW_PRIORITY_KEYWORDS = [
  'red',
  'blue',
  'black',
  'white',
  'green',
  'gray',
  'grey',
  'brown',
  'silver',
  'gold',
  'yellow',
  'orange',
  'purple',
  'pink',
  'leather',
  'small',
  'large',
  'medium',
] as const;

const KEYWORD_WEIGHTS = {
  high: 5,
  medium: 2,
  low: 1,
} as const;

const EXACT_TITLE_CATEGORY_BOOST = 5;
const HIGH_OVERLAP_BONUS = 3;
const EXACT_TITLE_BONUS = 3;

const KNOWN_COLORS = [
  'red',
  'blue',
  'black',
  'white',
  'green',
  'gray',
  'grey',
  'brown',
  'silver',
  'gold',
  'yellow',
  'orange',
  'purple',
  'pink',
] as const;

const MATCH_COLOR_KEYWORDS = ['red', 'blue', 'green', 'black', 'white'] as const;

const KNOWN_IMAGE_KEYWORDS = [
  'wallet',
  'bag',
  'phone',
  'laptop',
  'watch',
  'keys',
  'backpack',
  'bottle',
  'book',
  'id',
  'card',
  'blue',
  'black',
  'red',
  'white',
  'green',
  'gray',
  'brown',
  'silver',
  'gold',
] as const;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueKeywords(words: string[]): string[] {
  return Array.from(new Set(words));
}

function extractMatchColors(tokens: string[]): string[] {
  return uniqueKeywords(
    tokens.filter((token) =>
      MATCH_COLOR_KEYWORDS.includes(token as (typeof MATCH_COLOR_KEYWORDS)[number])
    )
  );
}

function buildItemKeywordPool(item: MatchableItem): string[] {
  const itemText = `${item.itemTitle ?? item.title ?? ''} ${item.description ?? ''} ${item.category ?? ''}`;
  const itemTokens = tokenize(itemText);
  const fallbackTokens = expandFallbackKeywords(itemTokens);
  const colorTokens = detectColorKeywords(itemTokens);

  return uniqueKeywords([...itemTokens, ...fallbackTokens, ...colorTokens]);
}

function createKeywordBuckets(): KeywordBuckets {
  return {
    high: [],
    medium: [],
    low: [],
  };
}

function bucketKeyword(keyword: string, buckets: KeywordBuckets): void {
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (!normalizedKeyword) return;

  if (HIGH_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof HIGH_PRIORITY_KEYWORDS)[number])) {
    buckets.high.push(normalizedKeyword);
    return;
  }

  if (
    MEDIUM_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof MEDIUM_PRIORITY_KEYWORDS)[number])
  ) {
    buckets.medium.push(normalizedKeyword);
    return;
  }

  if (LOW_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof LOW_PRIORITY_KEYWORDS)[number])) {
    buckets.low.push(normalizedKeyword);
    return;
  }

  buckets.medium.push(normalizedKeyword);
}

function uniqueBucketKeywords(buckets: KeywordBuckets): KeywordBuckets {
  return {
    high: uniqueKeywords(buckets.high),
    medium: uniqueKeywords(buckets.medium),
    low: uniqueKeywords(buckets.low),
  };
}

function getKeywordPriorityWeight(keyword: string): number {
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (HIGH_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof HIGH_PRIORITY_KEYWORDS)[number])) {
    return KEYWORD_WEIGHTS.high;
  }

  if (
    MEDIUM_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof MEDIUM_PRIORITY_KEYWORDS)[number])
  ) {
    return KEYWORD_WEIGHTS.medium;
  }

  if (LOW_PRIORITY_KEYWORDS.includes(normalizedKeyword as (typeof LOW_PRIORITY_KEYWORDS)[number])) {
    return KEYWORD_WEIGHTS.low;
  }

  return KEYWORD_WEIGHTS.low;
}

function detectColorKeywords(tokens: string[]): string[] {
  return tokens.filter((token) =>
    KNOWN_COLORS.includes(token as (typeof KNOWN_COLORS)[number])
  );
}

function expandFallbackKeywords(tokens: string[]): string[] {
  const expanded: string[] = [];

  for (const token of tokens) {
    const synonyms = KEYWORD_FALLBACK_MAP[token] ?? [];
    expanded.push(...synonyms);
  }

  return expanded;
}

function extractKeywordBucketsFromTokens(tokens: string[], contextKeywords: string[] = []): KeywordBuckets {
  const buckets = createKeywordBuckets();
  const normalizedContextKeywords = uniqueKeywords(
    contextKeywords.map((entry) => entry.toLowerCase().trim()).filter(Boolean)
  );
  const combinedTokens = uniqueKeywords([...tokens, ...normalizedContextKeywords]);
  const fallbackTokens = expandFallbackKeywords(combinedTokens);
  const colorTokens = detectColorKeywords(combinedTokens);

  for (const token of combinedTokens) {
    bucketKeyword(token, buckets);
  }

  for (const token of fallbackTokens) {
    bucketKeyword(token, buckets);
  }

  for (const token of colorTokens) {
    bucketKeyword(token, buckets);
  }

  return uniqueBucketKeywords(buckets);
}

/**
 * Structured keyword extraction output.
 *
 * high   -> brand/model names and other strongest signals
 * medium -> item types and general object terms
 * low    -> colors and visual attributes
 *
 * This shape is future-friendly for AI models that may emit grouped tags directly.
 */
export function getImageKeywordBuckets(file: File, contextKeywords: string[] = []): KeywordBuckets {
  const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const filenameTokens = tokenize(filenameWithoutExt);

  return extractKeywordBucketsFromTokens(filenameTokens, contextKeywords);
}

/**
 * Baseline image "matching" using file name tokens only.
 *
 * Future AI upgrade path:
 * Replace this logic with a model-backed extractor that returns
 * semantic tags (objects, colors, brands, patterns) from image pixels.
 */
export function getImageKeywords(file: File, contextKeywords: string[] = []): string[] {
  const buckets = getImageKeywordBuckets(file, contextKeywords);

  return uniqueKeywords([...buckets.high, ...buckets.medium, ...buckets.low]);
}

let imageKeywordExtractor: ImageKeywordExtractor = getImageKeywords;

/**
 * Abstraction boundary for image understanding.
 *
 * Current:
 * - returns keyword features derived from file name tokens.
 *
 * Future TensorFlow.js path:
 * - run image preprocessing + model inference here
 * - return embeddings (and optional keywords)
 * - keep matchItems signature unchanged by translating features inside this module.
 */
let imageFeatureExtractor: ImageFeatureExtractor = (file, contextKeywords = []) => ({
  keywords: imageKeywordExtractor(file, contextKeywords),
});

/**
 * Returns image features used by the matcher.
 *
 * Backward compatibility:
 * Existing keyword-based pipelines keep working because this defaults to
 * keyword extraction and preserves the same behavior as before.
 */
export function getImageFeatures(file: File, contextKeywords: string[] = []): ImageFeatures {
  return imageFeatureExtractor(file, contextKeywords);
}

/**
 * Weighted score calculation:
 * - high priority keywords contribute the most
 * - medium priority keywords contribute moderately
 * - low priority keywords contribute minimally
 *
 * Exact title phrases still get a bonus to keep precise matches on top.
 */
export function calculateScore(
  item: MatchableItem,
  keywords: string[],
  exactKeywordPhrase?: string,
  itemKeywordPool?: string[]
): number {
  const searchableText = `${item.itemTitle ?? item.title ?? ''} ${item.description ?? ''} ${item.category ?? ''}`
    .toLowerCase();
  const normalizedTitle = (item.itemTitle ?? item.title ?? '').toLowerCase();
  const normalizedExactPhrase = exactKeywordPhrase?.trim().toLowerCase() ?? '';

  let score = 0;
  const normalizedKeywords = uniqueKeywords(
    keywords.map((keyword) => keyword.toLowerCase().trim()).filter(Boolean)
  );
  const normalizedItemKeywordPool = uniqueKeywords(
    (itemKeywordPool ?? buildItemKeywordPool(item)).map((keyword) => keyword.toLowerCase().trim())
  );
  const normalizedCategory = (item.category ?? '').toLowerCase();
  let matchedKeywordCount = 0;

  for (const keyword of normalizedKeywords) {
    if (normalizedItemKeywordPool.includes(keyword)) {
      score += getKeywordPriorityWeight(keyword);
      matchedKeywordCount += 1;
    }
  }

  // Strong boost when both title and category are aligned.
  const hasTitleMatch = Boolean(normalizedExactPhrase) && normalizedTitle.includes(normalizedExactPhrase);
  const hasCategoryMatch =
    normalizedCategory.length > 0 &&
    normalizedKeywords.some((entry) => normalizedCategory.includes(entry));

  if (hasTitleMatch && hasCategoryMatch) {
    score += EXACT_TITLE_CATEGORY_BOOST;
  }

  // Bonus when the majority of extracted keywords match the candidate item.
  const keywordOverlap =
    normalizedKeywords.length > 0 ? matchedKeywordCount / normalizedKeywords.length : 0;
  if (normalizedKeywords.length > 0 && keywordOverlap > 0.7) {
    score += HIGH_OVERLAP_BONUS;
  }

  const queryColors = extractMatchColors(normalizedKeywords);
  const itemColors = extractMatchColors(normalizedItemKeywordPool);

  // Color agreement improves ranking, while color mismatch is penalized.
  // This ensures e.g. "blue bottle" ranks above "green bottle".
  if (queryColors.length > 0 && itemColors.length > 0) {
    const hasSameColor = queryColors.some((color) => itemColors.includes(color));
    score += hasSameColor ? 1 : -2;
  }

  // Exact phrase bonus: if the user's keyword phrase appears directly in item title,
  // boost confidence so precise title matches rank significantly higher.
  if (normalizedExactPhrase && normalizedTitle.includes(normalizedExactPhrase)) {
    score += EXACT_TITLE_BONUS;
  }

  return score;
}

/**
 * Backward-compatible wrapper kept for existing call sites.
 */
export function calculateMatchScore(
  item: MatchableItem,
  keywords: string[],
  exactKeywordPhrase?: string,
  itemKeywordPool?: string[]
): number {
  return calculateScore(item, keywords, exactKeywordPhrase, itemKeywordPool);
}

export function normalizeMatchPercentage(score: number, maxPossibleScore: number): number {
  if (maxPossibleScore <= 0) return 0;
  const percentage = Math.round((score / maxPossibleScore) * 100);
  return Math.min(100, Math.max(0, percentage));
}

function extractSearchKeywords(keyword: string, file: File | null): string[] {
  const keywordTokens = tokenize(keyword);
  const imageFeatures = file ? getImageFeatures(file, keywordTokens) : { keywords: [] };
  const imageTokens = imageFeatures.keywords ?? [];
  const fallbackTokens = expandFallbackKeywords([...keywordTokens, ...imageTokens]);
  const colorTokens = detectColorKeywords([...keywordTokens, ...imageTokens]);

  // The current pipeline keeps image matching deterministic by merging text and file-name keywords.
  // A future AI model can replace getImageFeatures() without changing the rest of the flow.
  return uniqueKeywords([...keywordTokens, ...imageTokens, ...fallbackTokens, ...colorTokens]);
}

function calculateItemResult<T extends MatchableItem>(
  item: T,
  combinedKeywords: string[],
  exactKeywordPhrase: string,
  maxPossibleScore: number
): MatchResult<T> {
  const itemKeywordPool = buildItemKeywordPool(item);
  const combinedKeywordPool = uniqueKeywords([...combinedKeywords, ...itemKeywordPool]);
  const matchedKeywords = combinedKeywordPool.filter(
    (entry) => combinedKeywords.includes(entry) && itemKeywordPool.includes(entry)
  );
  const matchScore = calculateScore(item, combinedKeywords, exactKeywordPhrase, itemKeywordPool);

  return {
    ...item,
    matchScore,
    matchPercentage: normalizeMatchPercentage(matchScore, maxPossibleScore),
    matchLevel: getMatchLevel(matchScore),
    matchedKeywords,
    isLowConfidenceMatch: false,
  };
}

function filterLowRelevanceItems<T extends MatchResult<MatchableItem>>(
  items: T[],
  minimumScore: number
): T[] {
  return items.filter((item) => item.matchScore >= minimumScore);
}

function sortByScoreDescending<T extends MatchResult<MatchableItem>>(items: T[]): T[] {
  return [...items].sort((a, b) => b.matchScore - a.matchScore);
}

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 4) return 'High Match';
  if (score >= 2) return 'Medium Match';
  return 'Low Match';
}

/**
 * Allows swapping the file-name extractor with a real AI keyword extractor later
 * without changing call sites that use matchItems.
 */
export function configureImageKeywordExtractor(extractor: ImageKeywordExtractor): void {
  imageKeywordExtractor = extractor;
}

/**
 * Future-ready hook for plugging real AI image models.
 *
 * Example future usage:
 * - configureImageFeatureExtractor(asyncTfExtractorWrappedToSyncOrCached)
 *
 * Embedding migration note:
 * - today score = keyword overlap
 * - later score can combine cosine similarity(embeddings) + keyword overlap
 *   without changing UI call sites.
 */
export function configureImageFeatureExtractor(extractor: ImageFeatureExtractor): void {
  imageFeatureExtractor = extractor;
}

/**
 * Main matching pipeline:
 * 1) user keyword input -> tokens
 * 2) image file -> tokens (currently file-name based)
 * 3) merged keyword set -> score + level per item
 * 4) sorted by highest score first
 */
export function matchItems<T extends MatchableItem>(
  items: T[],
  keyword: string,
  file: File | null
): MatchResult<T>[] {
  if (items.length === 0) return [];

  const normalizedKeywordPhrase = keyword.trim().toLowerCase();
  const combinedKeywords = extractSearchKeywords(keyword, file);
  const exactMatchBonus = normalizedKeywordPhrase ? EXACT_TITLE_BONUS : 0;
  const exactTitleCategoryBoost = normalizedKeywordPhrase && combinedKeywords.length > 0
    ? EXACT_TITLE_CATEGORY_BOOST
    : 0;
  const overlapBonus = combinedKeywords.length > 0 ? HIGH_OVERLAP_BONUS : 0;
  const maxPossibleScore = Math.max(
    1,
    combinedKeywords.reduce((total, entry) => total + getKeywordPriorityWeight(entry), 0) +
      exactMatchBonus +
      exactTitleCategoryBoost +
      overlapBonus
  );
  const minimumScore = file ? 2 : 1;

  const scoredItems = items.map((item) =>
    calculateItemResult(item, combinedKeywords, normalizedKeywordPhrase, maxPossibleScore)
  );
  const sortedScoredItems = sortByScoreDescending(scoredItems);

  const relevantItems = filterLowRelevanceItems(sortedScoredItems, minimumScore);

  if (relevantItems.length > 0) {
    return relevantItems;
  }

  // Fallback: when nothing passes threshold, return closest matches instead of empty output.
  return sortedScoredItems.slice(0, 3).map((item) => ({
    ...item,
    matchLevel: 'Low Match',
    isLowConfidenceMatch: true,
  }));
}
