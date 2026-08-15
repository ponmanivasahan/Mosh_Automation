import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, CheckCircle, Sparkles, Upload, X, Check, AlertCircle } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getStories, addStory, updateStory, deleteStory } from '../../../utils/storage';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/settings', label: 'Settings' }
];

const emptyForm = {
  title: '',
  subtitle: 'Automated controller success story',
  description: '',
  image: '',
  youtubeUrl: '',
  instagramUrl: ''
};

const AdminStoriesPage = () => {
  const [stories, setStories] = useState(() => getStories());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [toast, setToast] = useState(null);

  // Live Syncing feed
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.image) {
      setToast({ type: 'error', message: 'Please provide a title, description, and thumbnail image.' });
      return;
    }

    if (editingId) {
      // Editing
      const payload = {
        id: editingId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image: form.image,
        youtubeUrl: form.youtubeUrl.trim(),
        instagramUrl: form.instagramUrl.trim()
      };
      updateStory(payload);
      const next = stories.map(s => s.id === editingId ? payload : s);
      setStories(next);
      setToast({ type: 'success', message: 'Success story updated successfully.' });
    } else {
      // Adding
      const payload = {
        id: `s-${Date.now()}`,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image: form.image,
        youtubeUrl: form.youtubeUrl.trim(),
        instagramUrl: form.instagramUrl.trim()
      };
      addStory(payload);
      setStories(getStories());
      setToast({ type: 'success', message: 'Success story published successfully.' });
    }
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    deleteStory(deletingId);
    const next = stories.filter(s => s.id !== deletingId);
    setStories(next);
    setToast({ type: 'success', message: 'Success story deleted successfully.' });
    if (editingId === deletingId) resetForm();
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
  };

  return (
    <AppShell title="Success Stories Manager" links={adminLinks}>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        
        {/* Toast alerts */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-teal-600 text-white border-teal-500' : 'bg-rose-600 text-white border-rose-500'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form to Add/Edit Story */}
          <article className="lg:col-span-4 panel bg-slate-100 p-6 rounded-lg border border-slate-200">
            <div className="panel-header-section mb-4">
              <span className="badge-kicker text-teal-700 uppercase tracking-wider text-[9px] font-bold">Marketing Control</span>
              <h2 className="text-base font-bold text-slate-800">{editingId ? 'Edit Success Story' : 'Add Success Story'}</h2>
              <p className="text-xs text-slate-500">Publish high-impact case studies to the storefront.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">Story Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. Smart Irrigation System"
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                />
              </div>

              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">Sub-heading / Tagline</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  placeholder="e.g. Saving 90% water manually"
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                />
              </div>

              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">Story Description *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Write the case study summary details..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                />
              </div>

              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">YouTube Video URL (Optional)</label>
                <input
                  type="text"
                  value={form.youtubeUrl}
                  onChange={(e) => updateField('youtubeUrl', e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                />
              </div>

              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">Instagram Reel URL (Optional)</label>
                <input
                  type="text"
                  value={form.instagramUrl}
                  onChange={(e) => updateField('instagramUrl', e.target.value)}
                  placeholder="e.g. https://www.instagram.com/reel/..."
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                />
              </div>

              {/* Thumbnail Selector */}
              <div className="form-field-group">
                <label className="text-xs font-bold text-slate-700">Thumbnail Image *</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="h-16 object-contain" />
                  ) : (
                    <>
                      <Upload size={16} className="text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">Upload Thumbnail Image</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition"
                >
                  {editingId ? 'Save Changes' : 'Publish Story'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs bg-slate-100 border text-slate-600 font-bold py-2.5 px-4 rounded-lg hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>

          {/* Right Column: Stories catalog list */}
          <article className="lg:col-span-8 panel bg-slate-100 p-6 rounded-lg border border-slate-200 max-h-[78vh] overflow-y-auto overflow-x-hidden">
            <div className="panel-header-section mb-6">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                Stories Catalog list
              </h2>
              <p className="text-xs text-slate-500 mt-1">Live client-facing success story entries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stories.map((story) => (
                <article key={story.id} className="border border-slate-200 p-4 rounded-lg bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-3">
                    <img className="w-full h-32 object-cover rounded-lg border" src={story.image} alt={story.title} />
                    <div>
                      <span className="text-[9px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase">Customer success</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-tight">{story.title}</h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{story.subtitle}</p>
                      <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed font-semibold">{story.description}</p>
                      
                      {/* Social badges if URLs exist */}
                      <div className="flex gap-2 mt-3">
                        {story.youtubeUrl && (
                          <span className="text-[8px] bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md font-bold">YouTube Video linked</span>
                        )}
                        {story.instagramUrl && (
                          <span className="text-[8px] bg-pink-50 border border-pink-200 text-pink-600 px-2 py-0.5 rounded-md font-bold">Instagram Reel linked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-4">
                    <button
                      onClick={() => triggerEdit(story)}
                      className="text-[10px] bg-slate-100 border text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition flex items-center gap-1"
                      type="button"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(story.id)}
                      className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition flex items-center gap-1"
                      type="button"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl border flex flex-col space-y-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
                <button onClick={() => setDeletingId('')} className="p-1 rounded hover:bg-slate-100">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Are you sure you want to delete the success story "{stories.find(s => s.id === deletingId)?.title}"?
              </p>
              <div className="flex gap-3 justify-end pt-3">
                <button
                  onClick={handleConfirmDelete}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingId('')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-lg transition border"
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
