import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useRazorpay } from '../hooks/useRazorpay';
import Loader from '../components/common/Loader';
import Modal  from '../components/common/Modal';
import toast  from 'react-hot-toast';
import {
  HiClock, HiCurrencyRupee, HiUsers, HiArrowLeft,
  HiCheckCircle, HiLockClosed, HiBadgeCheck,
} from 'react-icons/hi';

const CampaignDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const pay = useRazorpay();

  const [campaign, setCampaign]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [applications, setApplications] = useState([]);
  const [showApply, setShowApply]       = useState(false);
  const [applyForm, setApplyForm]       = useState({ message: '', proposedRate: '' });
  const [applying, setApplying]         = useState(false);
  const [hasApplied, setHasApplied]     = useState(false);
  const [payingId, setPayingId]         = useState(null); // appId being paid

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/campaigns/${id}`);
        setCampaign(data.campaign);

        if (user?.role === 'brand' && data.campaign.brand._id === user._id) {
          const appRes = await api.get(`/applications/campaign/${id}`);
          setApplications(appRes.data.applications);
        }
        if (user?.role === 'creator') {
          const myRes = await api.get('/applications/my');
          setHasApplied(myRes.data.applications.some(a => a.campaign?._id === id));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [id, user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await api.post(`/applications/${id}`, applyForm);
      setHasApplied(true);
      setShowApply(false);
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
    finally { setApplying(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      toast.success(`Application ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  /* ── Pay creator via Razorpay ── */
  const handlePayCreator = async (app) => {
    setPayingId(app._id);
    try {
      const amount = app.proposedRate || campaign.budget;
      await pay({
        createEndpoint: '/payments/campaign/create-order',
        verifyEndpoint: '/payments/campaign/verify',
        createBody:     { applicationId: app._id },
        verifyExtra:    { applicationId: app._id },
        description:    `Payout to ${app.creator?.name} — ${campaign.title}`,
      });

      // Mark as paid locally
      setApplications(prev =>
        prev.map(a => a._id === app._id ? { ...a, paymentStatus: 'paid' } : a)
      );
      toast.success(`₹${(amount || 0).toLocaleString()} sent to ${app.creator?.name}!`);
    } catch (err) {
      if (err.message !== 'Payment cancelled') toast.error(err.message || 'Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <Loader text="Loading campaign…" />;
  if (!campaign) return <div className="card p-8 text-center text-gray-400">Campaign not found</div>;

  const isBrandOwner = user?.role === 'brand' && campaign.brand?._id === user?._id;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/campaigns" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm">
        <HiArrowLeft className="w-4 h-4" /> Back to Campaigns
      </Link>

      {/* Header card */}
      <div className="card overflow-hidden">
        {campaign.coverImage && (
          <img src={campaign.coverImage} alt={campaign.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{campaign.title}</h1>
              <span className={`badge ${campaign.status === 'active' ? 'badge-green' : 'badge-gray'} capitalize`}>
                {campaign.status}
              </span>
            </div>
            {user?.role === 'creator' && campaign.status === 'active' && (
              hasApplied ? (
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <HiCheckCircle className="w-5 h-5" /> Applied
                </div>
              ) : (
                <button onClick={() => setShowApply(true)} className="btn-primary">Apply Now</button>
              )
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-brand-300 font-bold text-xl">
                <HiCurrencyRupee className="w-5 h-5" />{campaign.budget?.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Budget</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-200 font-bold text-xl">
                <HiClock className="w-5 h-5 text-accent-400" />
                {new Date(campaign.deadline).toLocaleDateString()}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Deadline</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-200 font-bold text-xl">
                <HiUsers className="w-5 h-5 text-green-400" />{campaign.applicantsCount}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Applicants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-3">About this Campaign</h2>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{campaign.description}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-white mb-3">Requirements</h2>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{campaign.requirements}</p>
      </div>

      {/* Brand Info */}
      <div className="card p-5 flex items-center gap-4">
        <img
          src={campaign.brand?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.brand?.name || 'B')}&background=7c6fef&color=fff`}
          className="w-12 h-12 avatar" alt={campaign.brand?.name} />
        <div>
          <p className="font-semibold text-white">{campaign.brand?.name}</p>
          <p className="text-xs text-gray-400">{campaign.brand?.bio}</p>
        </div>
        <Link to={`/profile/${campaign.brand?._id}`} className="ml-auto btn-secondary py-1.5 px-4 text-sm">
          View Profile
        </Link>
      </div>

      {/* Applications (Brand owner only) */}
      {isBrandOwner && applications.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Applications ({applications.length})</h2>
          <div className="space-y-4">
            {applications.map((app) => {
              const amount     = app.proposedRate || campaign.budget;
              const isPaid     = app.paymentStatus === 'paid';
              const isAccepted = app.status === 'accepted';
              const isPaying   = payingId === app._id;

              return (
                <div key={app._id} className="bg-white/5 rounded-xl p-4 space-y-3">
                  {/* Creator row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Link to={`/profile/${app.creator?._id}`} className="flex items-center gap-3">
                      <img
                        src={app.creator?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.name || 'C')}&background=7c6fef&color=fff`}
                        className="w-10 h-10 rounded-full" alt={app.creator?.name} />
                      <div>
                        <p className="font-semibold text-white text-sm">{app.creator?.name}</p>
                        <p className="text-xs text-gray-400">
                          {app.creator?.followersCount?.toLocaleString()} followers · {app.creator?.category}
                        </p>
                      </div>
                    </Link>
                    <span className={`badge capitalize ${
                      app.status === 'accepted' ? 'badge-green' :
                      app.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-300">{app.message}</p>

                  {/* Proposed rate */}
                  {app.proposedRate > 0 && (
                    <p className="text-xs text-gray-400">
                      Proposed rate:{' '}
                      <span className="text-brand-300 font-semibold">₹{app.proposedRate.toLocaleString()}</span>
                    </p>
                  )}

                  {/* Action row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                    {/* Accept / Reject (pending) */}
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(app._id, 'accepted')} className="btn-primary py-1 px-4 text-sm">
                          Accept
                        </button>
                        <button onClick={() => updateStatus(app._id, 'rejected')} className="btn-ghost py-1 px-4 text-sm text-red-400">
                          Reject
                        </button>
                      </>
                    )}

                    {/* Pay creator (accepted + unpaid) */}
                    {isAccepted && !isPaid && (
                      <button
                        onClick={() => handlePayCreator(app)}
                        disabled={isPaying}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-60 ml-auto">
                        {isPaying ? (
                          <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                        ) : (
                          <><HiLockClosed className="w-3.5 h-3.5" /> Pay ₹{(amount || 0).toLocaleString()}</>
                        )}
                      </button>
                    )}

                    {/* Already paid badge */}
                    {isPaid && (
                      <div className="flex items-center gap-1.5 ml-auto text-green-400 text-sm font-medium">
                        <HiBadgeCheck className="w-4 h-4" /> Paid
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secured note */}
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-500">
            <HiLockClosed className="w-3 h-3 text-green-500" />
            Payments processed securely via Razorpay — UPI, Cards, Net Banking
          </div>
        </div>
      )}

      {/* Apply Modal */}
      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply to Campaign">
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="label">Your Pitch / Message</label>
            <textarea value={applyForm.message}
              onChange={e => setApplyForm({ ...applyForm, message: e.target.value })}
              className="input h-32 resize-none"
              placeholder="Tell the brand why you're a great fit…" required />
          </div>
          <div>
            <label className="label">Proposed Rate (₹, optional)</label>
            <input type="number" value={applyForm.proposedRate}
              onChange={e => setApplyForm({ ...applyForm, proposedRate: e.target.value })}
              className="input" placeholder="0" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowApply(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={applying} className="btn-primary">
              {applying ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampaignDetail;