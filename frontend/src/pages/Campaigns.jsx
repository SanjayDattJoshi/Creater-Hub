import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiBriefcase, HiPlus, HiSearch, HiClock, HiCurrencyRupee,
  HiPencil, HiTrash, HiSpeakerphone, HiCheckCircle, HiXCircle,
  HiUsers, HiCalendar,
} from 'react-icons/hi';

const categories = ['all','fashion','tech','food','travel','fitness','beauty','gaming','education','lifestyle','other'];
const emptyForm  = { title:'', description:'', budget:'', requirements:'', deadline:'', category:'other', minFollowers:0 };

/* ═══════════════════════════════════════════════════════════════
   BRAND — My Campaigns dashboard
═══════════════════════════════════════════════════════════════ */
const BrandCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [editForm, setEditForm]         = useState(emptyForm);
  const [editSaving, setEditSaving]     = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState(null);
  const [deleting, setDeleting]             = useState(false);

  const fetchMyCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campaigns/my');
      setCampaigns(data.campaigns ?? data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMyCampaigns(); }, []);

  /* ─ create ─ */
  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.post('/campaigns', createForm);
      setCampaigns((prev) => [data.campaign, ...prev]);
      setShowCreate(false); setCreateForm(emptyForm);
      toast.success('Campaign created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  /* ─ edit ─ */
  const openEdit = (c) => {
    setEditCampaign(c);
    setEditForm({
      title: c.title || '', description: c.description || '',
      budget: c.budget || '', requirements: c.requirements || '',
      deadline: c.deadline ? c.deadline.slice(0, 10) : '',
      category: c.category || 'other', minFollowers: c.minFollowers || 0,
    });
  };
  const handleEdit = async (e) => {
    e.preventDefault(); setEditSaving(true);
    try {
      const { data } = await api.put(`/campaigns/${editCampaign._id}`, editForm);
      setCampaigns((prev) => prev.map((c) => c._id === editCampaign._id ? data.campaign : c));
      setEditCampaign(null);
      toast.success('Campaign updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  /* ─ delete ─ */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/campaigns/${deleteCampaign._id}`);
      setCampaigns((prev) => prev.filter((c) => c._id !== deleteCampaign._id));
      setDeleteCampaign(null);
      toast.success('Campaign deleted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  /* ─ stats ─ */
  const active   = campaigns.filter((c) => c.status === 'active').length;
  const closed   = campaigns.filter((c) => c.status !== 'active').length;
  const totalApplicants = campaigns.reduce((sum, c) => sum + (c.applicantsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HiSpeakerphone className="w-6 h-6 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">My Campaigns</h1>
          <span className="ml-1 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-sm font-medium">
            {campaigns.length}
          </span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> New Campaign
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active',      value: active,          icon: HiCheckCircle, color: 'text-green-400' },
          { label: 'Closed',      value: closed,          icon: HiXCircle,     color: 'text-gray-400'  },
          { label: 'Applicants',  value: totalApplicants, icon: HiUsers,       color: 'text-brand-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <Icon className={`w-8 h-8 ${color}`} />
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? <Loader /> : campaigns.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <HiSpeakerphone className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-gray-400 font-medium">No campaigns yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto flex items-center gap-2">
            <HiPlus className="w-4 h-4" /> Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Deadline</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Applicants</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => {
                const isExpired = new Date(c.deadline) < new Date();
                return (
                  <tr key={c._id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Title */}
                    <td className="px-5 py-4">
                      <Link to={`/campaigns/${c._id}`} className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                        {c.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="badge badge-gray capitalize">{c.category}</span>
                    </td>
                    {/* Budget */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-brand-300 font-semibold">
                        <HiCurrencyRupee className="w-4 h-4" />
                        {c.budget?.toLocaleString()}
                      </div>
                    </td>
                    {/* Deadline */}
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
                        <HiCalendar className="w-4 h-4" />
                        {new Date(c.deadline).toLocaleDateString()}
                      </div>
                    </td>
                    {/* Applicants */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-300">
                        <HiUsers className="w-4 h-4 text-gray-500" />
                        {c.applicantsCount || 0}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-400/10 transition-colors"
                          title="Edit">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCampaign(c)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ── */}
      <CampaignFormModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setCreateForm(emptyForm); }}
        title="Create Campaign"
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreate}
        saving={saving}
        submitLabel="Create Campaign"
      />

      {/* ── Edit Modal ── */}
      <CampaignFormModal
        isOpen={!!editCampaign}
        onClose={() => setEditCampaign(null)}
        title="Edit Campaign"
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEdit}
        saving={editSaving}
        submitLabel="Save Changes"
      />

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteCampaign} onClose={() => setDeleteCampaign(null)} title="Delete Campaign">
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete{' '}
            <span className="text-white font-semibold">{deleteCampaign?.title}</span>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteCampaign(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CREATOR — Campaign Marketplace
═══════════════════════════════════════════════════════════════ */
const CreatorCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)             params.set('search', search);
      if (category !== 'all') params.set('category', category);
      const { data } = await api.get(`/campaigns?${params}`);
      setCampaigns(data.campaigns);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, [search, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HiBriefcase className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Campaign Marketplace</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…" className="input py-2" style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-2 w-auto capitalize">
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize bg-dark-900">{c}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? <Loader /> : campaigns.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No campaigns found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link key={c._id} to={`/campaigns/${c._id}`} className="card-hover p-5 block group">
              {c.coverImage && (
                <img src={c.coverImage} alt={c.title} className="w-full h-32 object-cover rounded-xl mb-3" />
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">{c.title}</h3>
                <span className={`badge flex-shrink-0 ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {c.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-brand-300 font-semibold">
                  <HiCurrencyRupee className="w-4 h-4" /> {c.budget?.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <HiClock className="w-4 h-4" />
                  {new Date(c.deadline).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <img
                  src={c.brand?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.brand?.name || 'B')}&background=7c6fef&color=fff`}
                  className="w-6 h-6 rounded-full" alt={c.brand?.name} />
                <span className="text-xs text-gray-400">{c.brand?.name}</span>
                <span className="ml-auto text-xs text-gray-500">{c.applicantsCount} applicants</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Shared Campaign Form Modal
═══════════════════════════════════════════════════════════════ */
const CampaignFormModal = ({ isOpen, onClose, title, form, setForm, onSubmit, saving, submitLabel }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-24 resize-none" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Budget (₹)</label>
          <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="label">Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" required />
        </div>
      </div>
      <div>
        <label className="label">Requirements</label>
        <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="input h-20 resize-none" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input capitalize">
            {categories.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c} className="bg-dark-900 capitalize">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Min. Followers</label>
          <input type="number" value={form.minFollowers} onChange={(e) => setForm({ ...form, minFollowers: e.target.value })} className="input" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  </Modal>
);

/* ═══════════════════════════════════════════════════════════════
   Root — routes by role
═══════════════════════════════════════════════════════════════ */
const Campaigns = () => {
  const { user } = useAuth();
  return user?.role === 'brand' ? <BrandCampaigns /> : <CreatorCampaigns />;
};

export default Campaigns;