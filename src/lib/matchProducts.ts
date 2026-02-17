/**
 * Product matching across retailers.
 * Extracts size/weight/count and scores by brand + name + size similarity.
 * Only returns a match if we're confident it's the same product AND same size.
 */

interface SizeInfo {
  weight?: number;   // grams
  count?: number;    // pack count (capsules, pods, sachets)
  volume?: number;   // ml
}

export function extractSize(name: string): SizeInfo {
  const lower = name.toLowerCase();
  const result: SizeInfo = {};

  // Weight: 1kg, 1.5kg, 250g, 500g
  const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg/);
  const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?\b/);
  if (kgMatch) result.weight = Math.round(parseFloat(kgMatch[1]) * 1000);
  else if (gMatch) result.weight = Math.round(parseFloat(gMatch[1]));

  // Count: 10 pack, 20 capsules, 12 pods, 10pk, x10, pack of 10
  const countMatch = lower.match(/\bpack\s+of\s+(\d+)\b/)
    || lower.match(/(?:x\s*)(\d+)\s*(?:pack|pk|capsule|pod|sachet|serve|ct|count|stick)s?\b/)
    || lower.match(/\b(\d+)\s*(?:pack|pk|capsule|pod|sachet|serve|ct|count|stick)s?\b/);
  if (countMatch) result.count = parseInt(countMatch[1]);

  // Volume: 250ml, 1L, 1l
  const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*ml/);
  const lMatch = lower.match(/(\d+(?:\.\d+)?)\s*l(?:itre|iter)?s?\b/);
  if (mlMatch) result.volume = parseFloat(mlMatch[1]);
  else if (lMatch) result.volume = parseFloat(lMatch[1]) * 1000;

  return result;
}

function sizesMatch(a: SizeInfo, b: SizeInfo): 'match' | 'mismatch' | 'unknown' {
  // If both have weights, compare (allow 5% tolerance)
  if (a.weight && b.weight) {
    return Math.abs(a.weight - b.weight) / Math.max(a.weight, b.weight) < 0.05 ? 'match' : 'mismatch';
  }
  // If both have counts, must match exactly
  if (a.count && b.count) {
    return a.count === b.count ? 'match' : 'mismatch';
  }
  // If both have volume
  if (a.volume && b.volume) {
    return Math.abs(a.volume - b.volume) / Math.max(a.volume, b.volume) < 0.05 ? 'match' : 'mismatch';
  }
  // One has size info, other doesn't — uncertain
  if ((a.weight || a.count || a.volume) && !(b.weight || b.count || b.volume)) return 'unknown';
  if (!(a.weight || a.count || a.volume) && (b.weight || b.count || b.volume)) return 'unknown';
  return 'unknown';
}

const STOP_WORDS = new Set([
  'coffee','pack','the','and','with','for','from','each','per','roast','blend',
  'dark','medium','light','organic','fair','trade','ground','beans','instant',
  'capsules','pods','espresso','australian','premium','special','edition','new',
]);

export function scoreProductMatch(
  nameA: string, brandA: string,
  nameB: string, brandB: string,
): number {
  const lowerA = nameA.toLowerCase();
  const lowerB = nameB.toLowerCase();
  const brandAl = brandA?.toLowerCase() || '';
  const brandBl = brandB?.toLowerCase() || '';

  let score = 0;

  // Brand match is a strong signal
  if (brandAl && brandBl) {
    if (brandAl === brandBl) score += 8;
    else if (lowerA.includes(brandBl) || lowerB.includes(brandAl)) score += 5;
    else if (brandAl.split(' ')[0] === brandBl.split(' ')[0]) score += 3;
    else score -= 5; // Different brand = almost certainly not same product
  }

  // Name word overlap (excluding stop words)
  const wordsA = lowerA.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const wordsB = new Set(lowerB.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  const overlap = wordsA.filter(w => wordsB.has(w)).length;
  score += overlap * 2;

  // Size matching — this is the key differentiator
  const sizeA = extractSize(nameA);
  const sizeB = extractSize(nameB);
  const sizeResult = sizesMatch(sizeA, sizeB);

  if (sizeResult === 'match') score += 10;
  else if (sizeResult === 'mismatch') score -= 15; // Heavy penalty for size mismatch
  // 'unknown' = no penalty, no bonus

  return score;
}

export function findBestMatch<T extends { name: string; brand: string; retailer: string }>(
  product: T,
  candidates: T[],
  minScore = 10,
): T | null {
  let best: T | null = null;
  let bestScore = minScore - 1;

  for (const candidate of candidates) {
    if (candidate.retailer === product.retailer) continue;
    const score = scoreProductMatch(product.name, product.brand, candidate.name, candidate.brand);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function findBestMatchPerRetailer<T extends { name: string; brand: string; retailer: string }>(
  product: T,
  candidates: T[],
  minScore = 10,
): Map<string, T> {
  const retailerMap = new Map<string, { item: T; score: number }>();

  for (const candidate of candidates) {
    if (candidate.retailer === product.retailer) continue;
    const score = scoreProductMatch(product.name, product.brand, candidate.name, candidate.brand);
    if (score < minScore) continue;
    const existing = retailerMap.get(candidate.retailer);
    if (!existing || score > existing.score) {
      retailerMap.set(candidate.retailer, { item: candidate, score });
    }
  }

  return new Map(Array.from(retailerMap.entries()).map(([k, v]) => [k, v.item]));
}
