/**
 * Shelter Trust Score Algorithm
 *
 * finalScore = structuredScore * 0.7 + reviewScore * 0.3
 *
 * Scoring is based on:
 *  1. Structured shelter data (presence / value of key fields)
 *  2. Average user review rating (with confidence factor for few reviews)
 *
 * Missing data does NOT equal score 0 — neutral fallback is used instead.
 */

// ─── Structured score ────────────────────────────────────────────────────────

function calcStructuredScore(shelter) {
  let score = 0;

  // License / oversight
  if (shelter.license_status)           score += 10;
  if (shelter.veterinary_supervision)   score += 10;
  if (shelter.municipality_cooperation) score += 10;

  // Organisation identity
  if (shelter.operator_name)            score += 8;
  if (shelter.nip)                      score += 6;
  // krs: any non-empty value counts (including "nie dotyczy" for municipal shelters)
  if (shelter.krs)                      score += 6;

  // Contact
  if (shelter.website)                  score += 6;
  if (shelter.phone_1 || shelter.phone) score += 4;
  if (shelter.email)                    score += 4;

  // Data richness
  const sources = shelter.data_sources;
  if (Array.isArray(sources) && sources.length >= 2) score += 8;
  else if (sources && !Array.isArray(sources))        score += 4; // single source

  // Transparency level
  const tl = (shelter.transparency_level || '').toLowerCase();
  if      (tl === 'high'   || tl === 'wysoki')   score += 10;
  else if (tl === 'medium' || tl === 'sredni')   score += 6;
  else if (tl === 'low'    || tl === 'niski')    score += 2;

  // Public access
  const pa = (shelter.public_access || '').toLowerCase();
  if      (pa === 'open'    || pa === 'otwarty')   score += 6;
  else if (pa === 'limited' || pa === 'ograniczony') score += 4;

  // Volunteering
  if (shelter.volunteering === true || shelter.volunteering === 'true') score += 4;

  // Accepted animals
  const hasAnimals =
    shelter.accepted_dogs != null ||
    shelter.accepted_cats != null ||
    shelter.accepted_other != null;
  if (hasAnimals) score += 4;

  // Verification date
  if (shelter.last_verified) score += 4;

  return Math.min(score, 100);
}

// ─── Review score ─────────────────────────────────────────────────────────────

const NEUTRAL_REVIEW_SCORE = 60; // fallback when few/no reviews

function calcReviewScore(comments) {
  const rated = (comments || []).filter((c) => c.rating != null);
  const reviewCount = rated.length;

  if (reviewCount === 0) return { reviewScore: NEUTRAL_REVIEW_SCORE, reviewCount: 0 };

  const avgRating = rated.reduce((sum, c) => sum + c.rating, 0) / reviewCount;
  const rawReviewScore = (avgRating - 1) * 25; // 1→0, 3→50, 5→100

  // Confidence factor: needs 5 reviews for full weight
  const confidence = Math.min(reviewCount / 5, 1);
  const reviewScore = confidence * rawReviewScore + (1 - confidence) * NEUTRAL_REVIEW_SCORE;

  return { reviewScore, reviewCount, avgRating };
}

// ─── Trust level & colour ─────────────────────────────────────────────────────

export function getTrustLevel(finalScore) {
  if (finalScore >= 80) return { level: 'high',   label: 'Wysoki',  color: '#22c55e' }; // green-500
  if (finalScore >= 50) return { level: 'medium', label: 'Średni',  color: '#eab308' }; // yellow-500
  return                       { level: 'low',    label: 'Niski',   color: '#ef4444' }; // red-500
}

/** Returns the hex marker colour for a given finalScore */
export function getShelterMarkerColor(finalScore) {
  return getTrustLevel(finalScore).color;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {object} shelter  - shelter object from API
 * @param {Array}  comments - comments for THIS shelter (already filtered)
 * @returns {{ structuredScore, reviewScore, finalScore, reviewCount, avgRating,
 *             trustLevel, trustLabel, color, dataCompleteness }}
 */
export function calculateShelterScore(shelter, comments = []) {
  const structuredScore = calcStructuredScore(shelter);
  const { reviewScore, reviewCount, avgRating } = calcReviewScore(comments);
  const finalScore = Math.round(structuredScore * 0.7 + reviewScore * 0.3);

  const { level: trustLevel, label: trustLabel, color } = getTrustLevel(finalScore);

  // Data completeness hint
  let dataCompleteness = 'high';
  if (structuredScore < 20)      dataCompleteness = 'low';
  else if (structuredScore < 50) dataCompleteness = 'medium';

  return {
    structuredScore,
    reviewScore: Math.round(reviewScore),
    finalScore,
    reviewCount: reviewCount ?? 0,
    avgRating: avgRating ?? null,
    trustLevel,
    trustLabel,
    color,
    dataCompleteness,
  };
}
