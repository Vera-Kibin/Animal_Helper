"""
Сервис для расчета оценок качества приютов
"""
import math
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import asyncpg

# ============================================================
# КОНСТАНТЫ
# ============================================================

NEUTRAL_SCORE        = 60.0   # нейтральный балл при отсутствии отзывов
STRUCTURED_WEIGHT    = 0.55   # вес структурных данных
REVIEW_WEIGHT        = 0.45   # вес отзывов
BAYES_M              = 20.0   # байесовский сглаживатель
AUTHOR_WINDOW_DAYS   = 7      # окно для дедупликации отзывов одного автора
REVIEW_DECAY_MONTHS  = 24.0   # время "старения" отзыва
CONFIDENCE_SCALE     = 15.0   # масштаб уверенности

SYSTEMIC_MIN_AUTHORS       = 3     # мин. авторов для системной проблемы
SYSTEMIC_MIN_SPAN_DAYS     = 30    # мин. период для системной проблемы
SYSTEMIC_MIN_NEG_SHARE     = 0.15  # мин. доля негативных
SYSTEMIC_MAX_PENALTY       = 20.0  # макс. штраф

CATEGORY_KEYWORDS = {
    "cleanliness":         ["brud", "nieczysto", "syf", "smrod", "dirty", "filth"],
    "health_vet":          ["chore", "choroba", "weterynar", "ranny", "sick", "injur"],
    "staff_behavior":      ["personel", "obsługa", "pracownik", "opryskliw", "rude", "unhelpful"],
    "adoption_process":    ["adopcj", "procedur", "formularz", "odmow", "adoption"],
    "communication":       ["telefon", "kontakt", "nie odbiera", "brak odpowiedzi", "response"],
    "crowding_conditions": ["przepeln", "tłok", "klatka", "boks", "overcrowd", "crowded"],
    "safety":              ["niebezpiecz", "uciek", "pogryz", "agresja", "unsafe", "bite"],
}

NEGATIVE_HINTS = [
    "koszmar", "dramat", "fatal", "okrop", "beznadziej", "zly", "zla",
    "bad", "terrible", "awful", "horrible", "poor", "worst",
]


# ============================================================
# УТИЛИТЫ
# ============================================================

def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", text).lower().strip()


def normalize_author(author: Optional[str]) -> str:
    text = normalize_text(author)
    text = re.sub(r"[^a-z0-9 ]+", "", text).strip()
    return text or "anonymous"


def parse_date(value: Any) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%Y/%m/%d"]:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def months_between(older: Optional[date], newer: Optional[date] = None) -> float:
    if older is None:
        return 999.0
    return max(0.0, ((newer or date.today()) - older).days / 30.4375)


def is_present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip().lower() not in {"", "unknown", "not_applicable", "n/a", "none", "null"}
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


# ============================================================
# СТРУКТУРНЫЙ БАЛЛ
# ============================================================

def score_structured(shelter: Dict[str, Any], today: date) -> float:
    score = 0.0

    score += 10 if is_present(shelter.get("license_status"))          else 0
    score += 10 if is_present(shelter.get("veterinary_supervision"))   else 0

    score += {"low": 5, "medium": 12, "high": 18}.get(
        normalize_text(shelter.get("transparency_level")), 5
    )

    m = months_between(parse_date(shelter.get("last_verified")), today)
    score += 2 if m <= 6 else (1 if m <= 12 else 0)

    access = normalize_text(shelter.get("public_access"))
    score += {"none": 3, "limited": 8, "open": 12}.get(access, 3)
    score += 4 if shelter.get("volunteering")        else 0
    score += 4 if is_present(shelter.get("public_access_notes")) else 0

    score += 4 if is_present(shelter.get("phone_1"))      else 0
    score += 4 if is_present(shelter.get("email"))        else 0
    score += 4 if is_present(shelter.get("website"))      else 0
    score += 4 if is_present(shelter.get("social_media")) else 0

    score += 5 if is_present(shelter.get("owner"))                    else 0
    score += 5 if is_present(shelter.get("operator_name"))            else 0
    score += 5 if is_present(shelter.get("operator_type"))            else 0
    score += 5 if is_present(shelter.get("municipality_cooperation")) else 0

    return round(clamp(score, 0, 100), 1)


# ============================================================
# ОБРАБОТКА ОТЗЫВОВ
# ============================================================

def normalize_review(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    shelter_id  = raw.get("shelter_id")
    review_date = parse_date(raw.get("created_at") or raw.get("date"))
    try:
        rating = int(clamp(round(float(raw.get("rating"))), 1, 5))
    except (TypeError, ValueError):
        return None

    if shelter_id is None or review_date is None:
        return None

    return {
        "id":         raw.get("id"),
        "shelter_id": shelter_id,
        "author":     normalize_author(raw.get("author")),
        "rating":     rating,
        "date":       review_date,
        "text":       (raw.get("comment") or raw.get("text") or "").strip(),
    }


def deduplicate(reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped = defaultdict(list)
    for r in reviews:
        grouped[(r["shelter_id"], r["author"])].append(r)

    result = []
    for items in grouped.values():
        items.sort(key=lambda r: r["date"])
        window = [items[0]]
        for r in items[1:]:
            if (r["date"] - window[-1]["date"]).days < AUTHOR_WINDOW_DAYS:
                window.append(r)
            else:
                result.append(max(window, key=lambda x: (x["date"], len(x["text"]))))
                window = [r]
        result.append(max(window, key=lambda x: (x["date"], len(x["text"]))))
    return result


def add_weights(reviews: List[Dict[str, Any]], today: date) -> List[Dict[str, Any]]:
    author_count = Counter((r["shelter_id"], r["author"]) for r in reviews)
    result = []
    for r in reviews:
        months_old = months_between(r["date"], today)
        w_time   = 0.6 + 0.4 * math.exp(-months_old / REVIEW_DECAY_MONTHS)
        w_text   = 1.0 if len(r["text"]) >= 30 else (0.6 if r["text"] else 0.35)
        w_author = 1.0 / math.sqrt(max(1, author_count[(r["shelter_id"], r["author"])]))
        result.append({**r,
            "_weight": round(w_time * w_text * w_author, 6),
            "_score":  (r["rating"] - 1) * 25.0,
        })
    return result


def global_mean(weighted: List[Dict[str, Any]]) -> float:
    total = sum(r["_weight"] for r in weighted)
    if total <= 0:
        return NEUTRAL_SCORE
    return sum(r["_score"] * r["_weight"] for r in weighted) / total


def systemic_penalty(shelter_reviews: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
    total_w = sum(r["_weight"] for r in shelter_reviews)
    if total_w <= 0:
        return 0.0, []

    cats: Dict[str, Dict] = defaultdict(lambda: {"authors": set(), "dates": [], "neg_w": 0.0})

    for r in shelter_reviews:
        is_negative = r["rating"] <= 2 or (
            r["rating"] == 3 and any(h in normalize_text(r["text"]) for h in NEGATIVE_HINTS)
        )
        if not is_negative:
            continue
        text = normalize_text(r["text"])
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(k in text for k in keywords):
                cats[cat]["authors"].add(r["author"])
                cats[cat]["dates"].append(r["date"])
                cats[cat]["neg_w"] += r["_weight"]

    penalties = []
    for cat, info in cats.items():
        if len(info["authors"]) < SYSTEMIC_MIN_AUTHORS:
            continue
        span = (max(info["dates"]) - min(info["dates"])).days if info["dates"] else 0
        if span < SYSTEMIC_MIN_SPAN_DAYS:
            continue
        if info["neg_w"] / total_w < SYSTEMIC_MIN_NEG_SHARE:
            continue
        penalties.append((cat, min(5.0, 2.0 + math.log2(1.0 + info["neg_w"]))))

    total_penalty = min(SYSTEMIC_MAX_PENALTY, sum(p for _, p in penalties))
    flags = [c for c, _ in sorted(penalties, key=lambda x: x[1], reverse=True)]
    return round(total_penalty, 2), flags


def review_score(shelter_reviews: List[Dict[str, Any]], gmean: float) -> Tuple[float, Dict]:
    total_w = sum(r["_weight"] for r in shelter_reviews)
    count   = len(shelter_reviews)

    if total_w <= 0 or count == 0:
        return NEUTRAL_SCORE, {"review_count": 0, "confidence": 0.0,
                                "systemic_penalty": 0.0, "systemic_flags": []}

    wmean = sum(r["_score"] * r["_weight"] for r in shelter_reviews) / total_w
    bayes = (total_w / (total_w + BAYES_M)) * wmean + (BAYES_M / (total_w + BAYES_M)) * gmean

    penalty, flags = systemic_penalty(shelter_reviews)
    raw        = clamp(bayes - penalty, 0.0, 100.0)
    confidence = 1.0 - math.exp(-total_w / CONFIDENCE_SCALE)
    final      = clamp(confidence * raw + (1.0 - confidence) * NEUTRAL_SCORE, 0.0, 100.0)

    return final, {
        "review_count":     count,
        "confidence":       round(confidence, 4),
        "systemic_penalty": penalty,
        "systemic_flags":   flags,
        "bayes_score":      round(bayes, 2),
        "review_score_raw": round(raw, 2),
    }


# ============================================================
# ОСНОВНАЯ ФУНКЦИЯ РАСЧЕТА
# ============================================================

async def calculate_quality_scores(conn: asyncpg.Connection, today: Optional[date] = None) -> Dict[str, Any]:
    """
    Рассчитывает и сохраняет оценки качества для всех приютов

    Args:
        conn: Соединение с базой данных
        today: Дата расчета (по умолчанию текущая дата)

    Returns:
        Словарь со статистикой выполнения
    """
    if today is None:
        today = date.today()

    # Получаем данные
    shelters_rows = await conn.fetch("SELECT * FROM shelters")
    shelters = [dict(r) for r in shelters_rows]

    reviews_rows = await conn.fetch(
        "SELECT id, shelter_id, author, rating, created_at, comment FROM comments WHERE shelter_id IS NOT NULL"
    )
    raw_reviews = [dict(r) for r in reviews_rows]

    # Нормализация и дедупликация отзывов
    normalized = [r for raw in raw_reviews if (r := normalize_review(raw)) is not None]
    deduped    = deduplicate(normalized)
    weighted   = add_weights(deduped, today)
    gmean      = global_mean(weighted)

    # Группировка отзывов по приюту
    by_shelter = defaultdict(list)
    for r in weighted:
        by_shelter[r["shelter_id"]].append(r)

    # Подсчёт баллов
    updated_count = 0
    for shelter in shelters:
        s_score = score_structured(shelter, today)
        r_score, r_meta = review_score(by_shelter.get(shelter["id"], []), gmean)

        quality_score = round(STRUCTURED_WEIGHT * s_score + REVIEW_WEIGHT * r_score, 1)
        quality_score_meta = {
            "structured_score": round(s_score, 2),
            "review_score":     round(r_score, 2),
            "global_mean":      round(gmean, 2),
            **r_meta,
        }

        # Сохраняем в БД
        await conn.execute("""
            INSERT INTO shelter_quality_scores (shelter_id, quality_score, quality_score_meta, updated_at)
            VALUES ($1, $2, $3, now())
            ON CONFLICT (shelter_id) DO UPDATE SET
                quality_score      = EXCLUDED.quality_score,
                quality_score_meta = EXCLUDED.quality_score_meta,
                updated_at         = now()
        """, shelter["id"], quality_score, quality_score_meta)
        updated_count += 1

    return {
        "status": "success",
        "shelters_processed": len(shelters),
        "reviews_processed": len(weighted),
        "scores_updated": updated_count,
        "global_mean": round(gmean, 2),
        "calculation_date": today.isoformat()
    }


async def ensure_scores_table(conn: asyncpg.Connection) -> None:
    """Создает таблицу оценок качества, если она не существует"""
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS shelter_quality_scores (
            shelter_id      INT PRIMARY KEY REFERENCES shelters(id) ON DELETE CASCADE,
            quality_score   NUMERIC(5, 2) NOT NULL,
            quality_score_meta JSONB      NOT NULL,
            updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
        )
    """)

