import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import {
  HiUsers, HiPhotograph, HiSpeakerphone, HiShoppingBag,
  HiTrendingUp, HiUserCircle,
} from 'react-icons/hi';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value?.toLocaleString() ?? '–'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard…" />;

  const { stats, usersByRole, recentUsers, recentOrders } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={HiUsers}        label="Total Users"      value={stats?.totalUsers}     color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={HiPhotograph}   label="Active Posts"     value={stats?.totalPosts}     color="bg-brand-500/20 text-brand-400" />
        <StatCard icon={HiSpeakerphone} label="Campaigns"        value={stats?.totalCampaigns} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={HiShoppingBag}  label="Total Orders"     value={stats?.totalOrders}    color="bg-green-500/20 text-green-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Users by role */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Users by Role</h2>
            <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {usersByRole?.map(({ _id, count }) => (
              <div key={_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 capitalize">{_id}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${(count / stats?.totalUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-dark-700">
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <HiTrendingUp className="w-4 h-4 text-green-400" />
                New this week
              </span>
              <span className="text-sm font-semibold text-green-400">+{stats?.newUsersThisWeek}</span>
            </div>
          </div>
        </div>

        {/* Recent users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentUsers?.map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                {u.avatar ? (
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <HiUserCircle className="w-8 h-8 text-gray-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-gray-600 capitalize bg-dark-700 px-2 py-0.5 rounded-full">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/admin/users',     label: 'Manage Users',     icon: HiUsers },
          { to: '/admin/posts',     label: 'Moderate Posts',   icon: HiPhotograph },
          { to: '/admin/campaigns', label: 'View Campaigns',   icon: HiSpeakerphone },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-3 hover:border-brand-500/50 border border-transparent transition-colors"
          >
            <Icon className="w-5 h-5 text-brand-400" />
            <span className="text-sm text-gray-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;