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

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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
      <img src={image.url} alt={image.original_name || 'Photo'} loading="lazy" />

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

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params?.folderId;

  const [images, setImages] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Upload state
  const [uploads, setUploads] = useState([]); // { id, name, preview, progress, done }

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

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      // Create preview items
      const newUploads = acceptedFiles.map((f) => ({
        id: `${f.name}-${Date.now()}`,
        name: f.name,
        preview: URL.createObjectURL(f),
        progress: 0,
        done: false,
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      const currentImageCount = images.length;
      let firstUploadPublicId = null;

      const uploadPromises = acceptedFiles.map(async (file, i) => {
        const uploadItem = newUploads[i];
        try {
          // Convert to WebP
          const webpBlob = await convertToWebP(file);

          const orderIndex = currentImageCount + i;
          const formData = new FormData();
          formData.append('file', webpBlob, `${file.name.replace(/\.[^.]+$/, '')}.webp`);
          formData.append('upload_preset', UPLOAD_PRESET);
          formData.append('folder', `galleries/${folderId}`);
          formData.append(
            'context',
            `folder_name=${folderName || folderId}|is_cover=false|order=${orderIndex}|original_name=${file.name}`
          );

          // Simulate progress via XHR
          const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
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
                reject(new Error(xhr.responseText));
              }
            };
            xhr.onerror = () => reject(new Error('Upload failed'));
            xhr.send(formData);
          });

          setUploads((prev) =>
            prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: 100, done: true } : u))
          );

          if (i === 0) firstUploadPublicId = result.public_id;
          return result;
        } catch (err) {
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadItem.id ? { ...u, error: true } : u))
          );
          throw err;
        }
      });

      try {
        const results = await Promise.all(uploadPromises);

        // If this is the first upload in the folder, set cover automatically
        if (currentImageCount === 0 && firstUploadPublicId) {
          await fetch(`/api/images/${encodeURIComponent(firstUploadPublicId)}/set-cover`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId }),
          });
        }

        toast.success(`${results.length} photo${results.length > 1 ? 's' : ''} uploaded!`);

        // Clear uploads after a short delay
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
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    multiple: true,
  });

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
          <div className="drop-zone-hint">Supports PNG, JPG, JPEG, WEBP · Converts to WebP automatically</div>
        </div>
      </div>

      {/* Upload Previews */}
      {uploads.length > 0 && (
        <div className="upload-previews">
          <div className="upload-preview-grid">
            {uploads.map((u) => (
              <div key={u.id} className="upload-preview-item">
                <img src={u.preview} alt={u.name} className="upload-preview-img" />
                {!u.done ? (
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
          description="This will permanently delete the image. This cannot be undone."
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
