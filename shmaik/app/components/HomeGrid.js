'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─── helpers ──────────────────────────────────────────────── */
function distributeToColumns(items, numCols = 4) {
  const cols = Array.from({ length: numCols }, () => []);
  items.forEach((item, i) => cols[i % numCols].push(item));
  return cols;
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function SkeletonCol({ count }) {
  return (
    <div className="grid-col" style={{ gap: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i % 2 === 0 ? '320px' : '280px',
            background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Lightbox ──────────────────────────────────────────────── */
function Lightbox({ folder, onClose }) {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/folders/${folder.id}/images`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setImages(Array.isArray(data) ? data : []);
        // start on cover image
        const coverIdx = data.findIndex((img) => img.is_cover);
        setCurrent(coverIdx >= 0 ? coverIdx : 0);
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [folder.id]);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="lb-overlay" onClick={onClose}>
      {/* Close */}
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>

      {/* Folder title */}
      <div className="lb-title">{folder.name}</div>

      {/* Main image area */}
      <div className="lb-main" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div className="lb-loading">Loading…</div>
        ) : images.length === 0 ? (
          <div className="lb-loading">No images</div>
        ) : (
          <>
            {/* Prev arrow */}
            {images.length > 1 && (
              <button className="lb-arrow lb-arrow-left" onClick={prev} aria-label="Previous">‹</button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current}
              className="lb-img"
              src={images[current]?.url}
              alt={images[current]?.original_name || 'Photo'}
            />

            {/* Next arrow */}
            {images.length > 1 && (
              <button className="lb-arrow lb-arrow-right" onClick={next} aria-label="Next">›</button>
            )}
          </>
        )}
      </div>

      {/* Counter */}
      {!loading && images.length > 0 && (
        <div className="lb-counter">{current + 1} / {images.length}</div>
      )}

      {/* Thumbnail strip */}
      {!loading && images.length > 1 && (
        <div className="lb-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.publicId || i}
              className={`lb-thumb ${i === current ? 'active' : ''}`}
              src={img.url}
              alt={img.original_name || 'Photo'}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Cover photo item ─────────────────────────────────────── */
function CoverItem({ folder, num, onClick }) {
  return (
    <div className="photo-item" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={folder.coverImageUrl} alt={folder.name} loading="lazy" />
      <span className="photo-number">{num}</span>
      <div className="photo-folder-name">{folder.name}</div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────── */
export default function HomeGrid() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openFolder, setOpenFolder] = useState(null);

  useEffect(() => {
    async function fetchFolders() {
      try {
        const res = await fetch('/api/folders', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Each folder already has coverImageUrl from the API
        const withCovers = (Array.isArray(data) ? data : []).filter((f) => f.coverImageUrl);
        setFolders(withCovers);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, []);

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div className="photo-grid">
          <SkeletonCol count={3} />
          <SkeletonCol count={2} />
          <SkeletonCol count={3} />
          <SkeletonCol count={2} />
        </div>
      </>
    );
  }

  if (error || folders.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh', color: '#aaa',
        gap: '12px', fontFamily: "'Lato', sans-serif",
        fontWeight: 300, letterSpacing: '0.1em',
      }}>
        <span style={{ fontSize: '32px' }}>📷</span>
        <span style={{ fontSize: '14px', textTransform: 'uppercase' }}>
          {error ? 'Could not load photos' : 'No photos yet'}
        </span>
      </div>
    );
  }

  const [col1, col2, col3, col4] = distributeToColumns(folders, 4);

  const renderCol = (col, colClass, startOffset) => (
    <div className={`grid-col ${colClass}`}>
      {col.map((folder, i) => (
        <CoverItem
          key={folder.id}
          folder={folder}
          num={String(startOffset + i * 4 + 1).padStart(2, '0')}
          onClick={() => setOpenFolder(folder)}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="photo-grid">
        {renderCol(col1, 'col1', 0)}
        {renderCol(col2, 'col2', 1)}
        {renderCol(col3, 'col3', 2)}
        {renderCol(col4, 'col4', 3)}
      </div>

      {openFolder && (
        <Lightbox folder={openFolder} onClose={() => setOpenFolder(null)} />
      )}
    </>
  );
}
