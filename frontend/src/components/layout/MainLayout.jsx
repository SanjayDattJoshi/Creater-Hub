import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  HiHome, HiGlobe, HiSpeakerphone, HiShoppingBag,
  HiMail, HiClipboardList, HiCog, HiLogout, HiUserCircle, HiBell,
} from 'react-icons/hi';
import { MdAdminPanelSettings } from 'react-icons/md';

const getNav = (role) => [
  { to: '/',          icon: HiHome,          label: 'Feed' },
  { to: '/explore',   icon: HiGlobe,         label: 'Explore' },
  { to: '/campaigns', icon: HiSpeakerphone,  label: role === 'brand' ? 'My Campaigns' : 'Campaigns' },
  { to: '/shop',      icon: HiShoppingBag,   label: role === 'brand' ? 'My Listings' : 'Shop' },
  { to: '/messages',  icon: HiMail,          label: 'Messages' },
  // Brands see "Orders" (received orders from customers); creators see "My Purchases"
  { to: '/orders', icon: HiClipboardList, label: role === 'brand' ? 'Orders' : 'My Purchases' },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count || 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    // Reset badge instantly when the Notifications page marks all as read
    const handleRead = () => setUnreadCount(0);
    window.addEventListener('notifications-read', handleRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handleRead);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <h1 className="text-xl font-bold gradient-text">CreatorHub</h1>
          <p className="text-xs text-gray-500 mt-0.5">Creator Marketplace</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {getNav(user?.role).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Notifications link */}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <div className="relative">
              <HiBell className="w-5 h-5 flex-shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <div className="border-t border-dark-700 my-3" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`
                }
              >
                <MdAdminPanelSettings className="w-5 h-5 flex-shrink-0" />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <HiUserCircle className="w-9 h-9 text-gray-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NavLink
              to={`/profile/${user?._id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <HiCog className="w-4 h-4" />
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-red-400 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <HiLogout className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;