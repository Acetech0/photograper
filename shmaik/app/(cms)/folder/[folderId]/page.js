'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Upload, Star, Trash2, CheckCircle2, ImageIcon } from 'lucide-react';
import CMSHeader from '../../components/CMSHeader';
import Modal from '../../components/Modal';

// ─── Allowed types (must match server-side validation) ───────────────────────
const ACCEPTED_TYPES = {
  'image/jpeg': [],
  'image/jpg': [],
  'image/png': [],
  'image/webp': [],
  'image/gif': [],
};
const MAX_SIZE_MB = 10;

// ─── Convert to WebP before upload (client-side, optional optimisation) ──────
async function convertToWebP(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ─── ImageCard ────────────────────────────────────────────────────────────────
function ImageCard({ image, onSetCover, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`image-card ${isDragging ? 'dragging' : ''} ${image.is_cover ? 'is-cover' : ''}`}
    >
      {image.is_cover && <div className="cover-badge">★ Cover</div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.original_name || 'Photo'}
        loading="lazy"
        decoding="async"
        width={400}
        height={300}
      />

      <div className="image-card-actions" {...attributes} {...listeners}>
        <button
          className={`btn btn-sm ${image.is_cover ? 'btn-gold' : 'btn-outline'}`}
          style={{ fontSize: '11px', gap: '4px' }}
          onClick={() => !image.is_cover && onSetCover(image)}
          disabled={image.is_cover}
          title={image.is_cover ? 'Current cover' : 'Set as cover'}
        >
          <Star size={11} fill={image.is_cover ? 'currentColor' : 'none'} />
          {image.is_cover ? 'Cover' : 'Set Cover'}
        </button>
        <button
          className="btn btn-danger btn-sm btn-icon"
          onClick={() => onDelete(image)}
          title="Delete image"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── FolderPage ───────────────────────────────────────────────────────────────
export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params?.folderId;

  const [images, setImages] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Upload state: { id, name, preview, progress, done, error }
  const [uploads, setUploads] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadImages = useCallback(async () => {
    if (!folderId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/folders/${folderId}/images`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setImages(data);
        setFolderName(data[0]?.folder_name || folderId);
      } else {
        setImages([]);
      }
    } catch {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { loadImages(); }, [loadImages]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      // Reject oversized files early (client-side guard)
      const oversized = acceptedFiles.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (oversized.length) {
        toast.error(`${oversized.length} file(s) exceed the ${MAX_SIZE_MB} MB limit`);
      }
      const validFiles = acceptedFiles.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);
      if (!validFiles.length) return;

      // Create preview entries
      const newUploads = validFiles.map((f) => ({
        id: `${f.name}-${Date.now()}`,
        name: f.name,
        preview: URL.createObjectURL(f),
        progress: 0,
        done: false,
        error: false,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      const currentImageCount = images.length;
      let firstUploadFileId = null;

      const uploadPromises = validFiles.map(async (file, i) => {
        const uploadItem = newUploads[i];
        try {
          // Convert to WebP for smaller payload
          const webpBlob = await convertToWebP(file);
          const webpFileName = `${file.name.replace(/\.[^.]+$/, '')}.webp`;

          const orderIndex = currentImageCount + i;

          const formData = new FormData();
          formData.append('file', webpBlob, webpFileName);
          formData.append('folderId', folderId);
          formData.append('folderName', folderName || folderId);
          formData.append('orderIndex', String(orderIndex));
          formData.append('isCover', i === 0 && currentImageCount === 0 ? 'true' : 'false');

          // Use XHR for progress tracking
          const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/images/upload');
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploads((prev) =>
                  prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: pct } : u))
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                const errMsg = (() => {
                  try { return JSON.parse(xhr.responseText).error; } catch { return xhr.responseText; }
                })();
                reject(new Error(`Upload failed for "${file.name}": ${errMsg}`));
              }
            };
            xhr.onerror = () => reject(new Error(`Network error uploading "${file.name}"`));
            xhr.send(formData);
          });

          setUploads((prev) =>
            prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: 100, done: true } : u))
          );

          if (i === 0) firstUploadFileId = result.publicId;
          return result;
        } catch (err) {
          console.error(err.message);
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadItem.id ? { ...u, error: true } : u))
          );
          throw err;
        }
      });

      try {
        const results = await Promise.allSettled(uploadPromises);
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        if (succeeded > 0) {
          toast.success(`${succeeded} photo${succeeded > 1 ? 's' : ''} uploaded!`);
        }
        if (failed > 0) {
          toast.error(`${failed} upload${failed > 1 ? 's' : ''} failed`);
        }

        setTimeout(() => {
          setUploads([]);
          loadImages();
        }, 1500);
      } catch {
        toast.error('Some uploads failed');
        setTimeout(loadImages, 1500);
      }
    },
    [folderId, folderName, images.length, loadImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────
  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.publicId === active.id);
    const newIndex = images.findIndex((img) => img.publicId === over.id);
    const newImages = arrayMove(images, oldIndex, newIndex);
    setImages(newImages);

    try {
      await fetch('/api/images/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, orderedPublicIds: newImages.map((img) => img.publicId) }),
      });
    } catch {
      toast.error('Failed to save order');
      loadImages();
    }
  }

  // ── Set cover ───────────────────────────────────────────────────────────────
  async function handleSetCover(image) {
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.publicId)}/set-cover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Cover image updated!');
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_cover: img.publicId === image.publicId,
        }))
      );
    } catch {
      toast.error('Failed to set cover');
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(deleteModal.publicId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Image deleted');
      setDeleteModal(null);
      setImages((prev) => prev.filter((img) => img.publicId !== deleteModal.publicId));
    } catch {
      toast.error('Failed to delete image');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <CMSHeader />

      {/* Folder Header */}
      <div className="folder-header">
        <button className="back-btn" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={16} />
          Galleries
        </button>
        <div className="folder-title-wrap">
          <h1 className="folder-page-title">{folderName || folderId}</h1>
        </div>
        <span className="badge">{images.length} photos</span>
      </div>

      {/* Drop Zone */}
      <div className="drop-zone-wrap">
        <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="drop-zone-icon">
            <Upload size={36} />
          </div>
          <div className="drop-zone-text">
            {isDragActive ? 'Drop photos here' : 'Drag & drop photos here, or click to browse'}
          </div>
          <div className="drop-zone-hint">
            Supports JPG, PNG, WEBP, GIF · Max {MAX_SIZE_MB} MB · Converts to WebP automatically
          </div>
        </div>
      </div>

      {/* Upload Previews */}
      {uploads.length > 0 && (
        <div className="upload-previews">
          <div className="upload-preview-grid">
            {uploads.map((u) => (
              <div key={u.id} className="upload-preview-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.preview} alt={u.name} className="upload-preview-img" />
                {u.error ? (
                  <div className="upload-preview-done" style={{ color: '#ef4444' }}>✕</div>
                ) : !u.done ? (
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${u.progress}%` }} />
                  </div>
                ) : (
                  <div className="upload-preview-done">
                    <CheckCircle2 size={22} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className="image-grid">
        {loading ? (
          <>
            <div className="image-grid-title">Loading…</div>
            <div className="images-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '1' }} />
              ))}
            </div>
          </>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📷</div>
            <div className="empty-state-title">No photos yet</div>
            <p className="empty-state-desc">Upload your first photos using the drop zone above.</p>
          </div>
        ) : (
          <>
            <div className="image-grid-title">
              {images.length} photo{images.length !== 1 ? 's' : ''} · Drag to reorder
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img.publicId)}
                strategy={rectSortingStrategy}
              >
                <div className="images-grid">
                  {images.map((image) => (
                    <ImageCard
                      key={image.publicId}
                      image={image}
                      onSetCover={handleSetCover}
                      onDelete={(img) => setDeleteModal(img)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <Modal
          title="Delete Image"
          description="This will permanently delete the image from Google Drive. This cannot be undone."
          onClose={() => setDeleteModal(null)}
        >
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <><div className="spinner" /> Deleting…</> : <>
                <Trash2 size={14} /> Delete
              </>}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
