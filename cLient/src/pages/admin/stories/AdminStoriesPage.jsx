import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Sparkles, Upload, X, Check, AlertCircle } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { adminLinks } from '../../../utils/customerLinks';
import { getStories, addStory, updateStory, deleteStory } from '../../../utils/storage';

const emptyForm = {
  title: '',
  subtitle: 'Automated controller success story',
  description: '',
  image: '',
  youtubeUrl: '',
  instagramUrl: ''
};

const PAGE_SIZE = 6;

const AdminStoriesPage = () => {
  const [stories, setStories] = useState(() => getStories());
  const [form, setForm] = useState(emptyForm);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLatest = () => {
      setStories(getStories());
    };
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(stories.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedStories = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return stories.slice(start, start + PAGE_SIZE);
  }, [stories, safePage]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField('image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
    setShowFormModal(false);
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId('');
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.image) {
      setToast({ type: 'error', message: 'Please provide a title, description, and thumbnail image.' });
      return;
    }

    if (editingId) {
      const payload = {
        id: editingId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image: form.image,
        youtubeUrl: form.youtubeUrl.trim(),
        instagramUrl: form.instagramUrl.trim()
      };
      try {
        await updateStory(payload);
        setStories((prev) => prev.map((s) => (s.id === editingId ? payload : s)));
        setToast({ type: 'success', message: 'Success story updated successfully.' });
        resetForm();
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Failed to update success story.' });
      }
    } else {
      const payload = {
        id: `s-${Date.now()}`,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image: form.image,
        youtubeUrl: form.youtubeUrl.trim(),
        instagramUrl: form.instagramUrl.trim()
      };
      try {
        await addStory(payload);
        setStories(getStories());
        setToast({ type: 'success', message: 'Success story published successfully.' });
        resetForm();
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Failed to publish success story.' });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteStory(deletingId);
      setStories((prev) => prev.filter((s) => s.id !== deletingId));
      setToast({ type: 'success', message: 'Success story deleted successfully.' });
      if (editingId === deletingId) resetForm();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete success story.' });
    }
    setDeletingId('');
  };

  const triggerEdit = (story) => {
    setEditingId(story.id);
    setForm({
      title: story.title,
      subtitle: story.subtitle || 'Automated controller success story',
      description: story.description,
      image: story.image || '',
      youtubeUrl: story.youtubeUrl || '',
      instagramUrl: story.instagramUrl || ''
    });
    setShowFormModal(true);
  };

  return (
    <AppShell title="Success Stories Manager" links={adminLinks}>
      <div className="space-y-6 pb-16">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border ${
            toast.type === 'success' ? 'bg-emerald-200 text-emerald-950 border-emerald-300' : 'bg-red-200 text-red-950 border-red-300'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600" />
              Success Stories
            </h2>
            <p className="text-xs text-slate-500 mt-1">Publish and manage client-facing automation case studies.</p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} />
            <span>Add Success Story</span>
          </button>
        </div>

        {/* Empty State or Responsive Cards Grid */}
        {stories.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No success stories published yet"
            description="Showcase real customer installations and automation outcomes on the storefront."
            action={
              <button
                type="button"
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Add Success Story</span>
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {paginatedStories.map((story) => (
                <article
                  key={story.id}
                  className="border border-slate-200/90 p-2.5 rounded-2xl bg-white hover:border-blue-300 transition-all flex flex-col justify-between h-full"
                >
                  <div className="space-y-3">
                    <img className="w-full h-40 object-cover rounded-xl border border-slate-100" src={story.image} alt={story.title} />
                    <div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold uppercase">
                        Customer Success
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">{story.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{story.subtitle}</p>
                      <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">{story.description}</p>

                      {(story.youtubeUrl || story.instagramUrl) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {story.youtubeUrl && (
                            <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md font-bold">
                              YouTube Video
                            </span>
                          )}
                          {story.instagramUrl && (
                            <span className="text-[10px] bg-pink-50 border border-pink-200 text-pink-600 px-2 py-0.5 rounded-md font-bold">
                              Instagram Reel
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-4">
                    <button
                      onClick={() => triggerEdit(story)}
                      className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition flex items-center gap-1"
                      type="button"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(story.id)}
                      className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition flex items-center gap-1"
                      type="button"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <Pagination
              currentPage={safePage}
              totalItems={stories.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Add / Edit Success Story Modal */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" onClick={resetForm}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{editingId ? 'Edit Success Story' : 'Add Success Story'}</h3>
                  <p className="text-xs text-slate-500">Publish high-impact case studies to the storefront.</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form className="p-6 space-y-4 overflow-y-auto" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Story Title *</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Smart Irrigation System"
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sub-heading / Tagline</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="e.g. Saving 90% water manually"
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Story Description *</label>
                  <textarea
                    required
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Write the case study summary details..."
                    rows={3}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">YouTube URL (Optional)</label>
                    <input
                      type="text"
                      value={form.youtubeUrl}
                      onChange={(e) => updateField('youtubeUrl', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Instagram Reel URL (Optional)</label>
                    <input
                      type="text"
                      value={form.instagramUrl}
                      onChange={(e) => updateField('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/reel/..."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thumbnail Image *</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="h-20 object-contain rounded" />
                    ) : (
                      <>
                        <Upload size={18} className="text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500 font-semibold">Upload Thumbnail Image</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition"
                  >
                    {editingId ? 'Save Changes' : 'Publish Story'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs bg-slate-100 border border-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 border flex flex-col space-y-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
                <button onClick={() => setDeletingId('')} className="p-1 rounded hover:bg-slate-100">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Are you sure you want to delete the success story "{stories.find((s) => s.id === deletingId)?.title}"?
              </p>
              <div className="flex gap-3 justify-end pt-3">
                <button
                  onClick={handleConfirmDelete}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingId('')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl transition border"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default AdminStoriesPage;
