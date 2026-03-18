import { useState } from 'react';
import { useComments } from '../hooks/useComments';

// Renders 1–5 filled/empty stars
function Stars({ rating, size = 'sm' }) {
  const r = Math.round(Math.max(0, Math.min(5, rating ?? 0)));
  const sz = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <span className={`${sz} leading-none select-none`} aria-label={`${r} z 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < r ? 'text-[#FFFC0F]' : 'text-gray-600'}>★</span>
      ))}
    </span>
  );
}

// Average score bar
function AverageBar({ avg, count }) {
  const pct = (avg / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#FFFC0F] text-3xl font-bold tabular-nums">{avg.toFixed(1)}</span>
      <div className="flex-1">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-1">{count} {count === 1 ? 'opinia' : count < 5 ? 'opinie' : 'opinii'}</p>
      </div>
      <Stars rating={avg} size="sm" />
    </div>
  );
}

// Single comment card
function CommentCard({ comment }) {
  const dateStr = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="border border-gray-700 rounded-xl p-3 space-y-1 bg-[#111]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-gray-300 text-sm font-medium truncate max-w-35">
          {comment.author || 'Anonim'}
        </span>
        <div className="flex items-center gap-2">
          {comment.rating != null && <Stars rating={comment.rating} />}
          {dateStr && <span className="text-gray-600 text-xs">{dateStr}</span>}
        </div>
      </div>
      {comment.comment && (
        <p className="text-gray-300 text-sm leading-relaxed">{comment.comment}</p>
      )}
    </div>
  );
}

export default function CommentsSection({ shelterId }) {
  const { comments, loading, error } = useComments(shelterId);
  const [expanded, setExpanded] = useState(false);

  const rated = comments.filter((c) => c.rating != null);
  const avg = rated.length > 0
    ? rated.reduce((sum, c) => sum + c.rating, 0) / rated.length
    : null;

  const PREVIEW_COUNT = 3;
  const visible = expanded ? comments : comments.slice(0, PREVIEW_COUNT);
  const hasMore = comments.length > PREVIEW_COUNT;

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      {/* Header */}
      <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wider mb-3">
        Komentarze i oceny
      </h3>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          Ładowanie komentarzy…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-red-400 text-sm">⚠️ Błąd ładowania: {error}</p>
      )}

      {/* No comments */}
      {!loading && !error && comments.length === 0 && (
        <p className="text-gray-600 text-sm italic">Brak komentarzy dla tego schroniska.</p>
      )}

      {/* Average score */}
      {!loading && !error && avg != null && (
        <div className="mb-4">
          <AverageBar avg={avg} count={rated.length} />
        </div>
      )}

      {/* Comment cards */}
      {!loading && !error && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </div>
      )}

      {/* Expand / Collapse button */}
      {!loading && !error && hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 w-full text-xs font-semibold text-[#FFFC0F] hover:text-yellow-300
                     border border-gray-700 hover:border-yellow-400 rounded-lg py-2
                     transition-all duration-200 flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>▲ Zwiń komentarze</>
          ) : (
            <>▼ Pokaż wszystkie komentarze ({comments.length})</>
          )}
        </button>
      )}
    </div>
  );
}
