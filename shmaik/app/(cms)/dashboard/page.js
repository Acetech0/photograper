'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
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
import { GripVertical, Pencil, Trash2, FolderOpen, Plus, ImageIcon } from 'lucide-react';
import CMSHeader from '../components/CMSHeader';
import Modal from '../components/Modal';

function FolderCard({ folder, onRename, onDelete, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`folder-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      {folder.coverImageUrl ? (
        <img
          src={folder.coverImageUrl}
          alt={folder.name}
          className="folder-card-img"
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
        />
      ) : (
        <div className="folder-card-no-cover">
          <ImageIcon size={32} />
          <span>No cover set</span>
        </div>
      )}
      <div className="folder-card-overlay">
        <div className="folder-card-name">{folder.name}</div>
        <div className="folder-card-count">
          {folder.imageCount} {folder.imageCount === 1 ? 'image' : 'images'}
        </div>
      </div>

      {/* Drag handle */}
      <button
        className="btn-ghost btn-icon folder-card-drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Action buttons */}
      <div className="folder-card-actions">
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); onRename(folder); }}
          aria-label={`Rename ${folder.name}`}
        >
          <Pencil size={12} />
          Rename
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
          aria-label={`Delete ${folder.name}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [renameModal, setRenameModal] = useState(null); // { id, name }
  const [deleteModal, setDeleteModal] = useState(null); // { id, name, imageCount }

  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/folders', { cache: 'no-store' });
      const data = await res.json();
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    const newOrder = arrayMove(folders, oldIndex, newIndex);
    setFolders(newOrder);

    try {
      await fetch('/api/folders/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newOrder.map((f) => f.id) }),
      });
    } catch {
      toast.error('Failed to save order');
      loadFolders();
    }
  }

  async function handleCreateFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Gallery created!');
      setNewFolderModal(false);
      setNewFolderName('');
      await loadFolders();
    } catch (err) {
      toast.error(err.message || 'Failed to create gallery');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!renameName.trim() || !renameModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/folders/${renameModal.id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Gallery renamed!');
      setRenameModal(null);
      await loadFolders();
    } catch (err) {
      toast.error(err.message || 'Failed to rename');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/folders/${deleteModal.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`"${deleteModal.name}" deleted`);
      setDeleteModal(null);
      await loadFolders();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <CMSHeader />

      <main className="cms-page">
        <div className="cms-page-header">
          <div>
            <h1 className="cms-page-title">Your Galleries</h1>
            <p className="cms-page-subtitle">
              {folders.length} {folders.length === 1 ? 'gallery' : 'galleries'} • Drag to reorder
            </p>
          </div>
          <button
            className="btn btn-gold"
            onClick={() => setNewFolderModal(true)}
          >
            <Plus size={16} />
            New Gallery
          </button>
        </div>

        {loading ? (
          <div className="folder-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4/3' }} />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">No galleries yet</div>
            <p className="empty-state-desc">
              Create your first gallery to start organizing your photos.
            </p>
            <button className="btn btn-gold" onClick={() => setNewFolderModal(true)}>
              <Plus size={16} /> New Gallery
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
              <div className="folder-grid">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onRename={(f) => { setRenameModal(f); setRenameName(f.name); }}
                    onDelete={(f) => setDeleteModal(f)}
                    onClick={() => router.push(`/folder/${folder.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* New Folder Modal */}
      {newFolderModal && (
        <Modal
          title="New Gallery"
          description="Enter a name for your new photo gallery."
          onClose={() => { setNewFolderModal(false); setNewFolderName(''); }}
        >
          <form onSubmit={handleCreateFolder}>
            <label className="label" htmlFor="new-folder-name">Gallery Name</label>
            <input
              id="new-folder-name"
              className="input"
              placeholder="e.g. Wedding 2024"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              required
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setNewFolderModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-gold" disabled={actionLoading}>
                {actionLoading ? <><div className="spinner" /> Creating…</> : 'Create Gallery'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <Modal
          title="Rename Gallery"
          onClose={() => setRenameModal(null)}
        >
          <form onSubmit={handleRename}>
            <label className="label" htmlFor="rename-input">New Name</label>
            <input
              id="rename-input"
              className="input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              autoFocus
              required
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setRenameModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-gold" disabled={actionLoading}>
                {actionLoading ? <><div className="spinner" /> Saving…</> : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <Modal
          title="Delete Gallery"
          description={`Delete "${deleteModal.name}" and all ${deleteModal.imageCount} ${deleteModal.imageCount === 1 ? 'image' : 'images'}? This cannot be undone.`}
          onClose={() => setDeleteModal(null)}
        >
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <><div className="spinner" /> Deleting…</> : <>
                <Trash2 size={14} /> Delete Forever
              </>}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
