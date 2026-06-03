import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import { HiUserCircle, HiCurrencyDollar, HiCalendar } from 'react-icons/hi';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/admin/campaigns')
      .then(({ data }) => setCampaigns(data.campaigns))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading campaigns…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-gray-500 text-sm mt-1">{campaigns.length} total campaigns</p>
      </div>

      <div className="grid gap-4">
        {campaigns.map((c) => (
          <div key={c._id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{c.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{c.description}</p>
              </div>

              {c.image && (
                <img src={c.image} alt={c.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                {c.brand?.avatar ? (
                  <img src={c.brand.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <HiUserCircle className="w-5 h-5" />
                )}
                <span>{c.brand?.name}</span>
              </div>
              {c.budget && (
                <div className="flex items-center gap-1">
                  <HiCurrencyDollar className="w-4 h-4" />
                  <span>${c.budget.toLocaleString()}</span>
                </div>
              )}
              {c.deadline && (
                <div className="flex items-center gap-1">
                  <HiCalendar className="w-4 h-4" />
                  <span>{new Date(c.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <span className="ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">No campaigns found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;