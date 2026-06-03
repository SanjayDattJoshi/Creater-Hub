import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { HiClipboardList, HiTruck, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi';

const statusConfig = {
  pending:   { icon: HiClock,        color: 'badge-yellow', label: 'Pending' },
  confirmed: { icon: HiCheckCircle,  color: 'badge-brand',  label: 'Confirmed' },
  shipped:   { icon: HiTruck,        color: 'badge-brand',  label: 'Shipped' },
  delivered: { icon: HiCheckCircle,  color: 'badge-green',  label: 'Delivered' },
  cancelled: { icon: HiXCircle,      color: 'badge-red',    label: 'Cancelled' },
};

const Orders = () => {
  const { user } = useAuth();
  // Brands → only Received Orders (/orders/brand)
  // Creators & others → only My Purchases (/orders/my)
  const isBrand = user?.role === 'brand';
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const endpoint = isBrand ? '/orders/brand' : '/orders/my';
        const { data } = await api.get(endpoint);
        setOrders(data.orders);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [isBrand]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HiClipboardList className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">
          {isBrand ? 'Received Orders' : 'My Purchases'}
        </h1>
      </div>

      {loading ? <Loader /> : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400">
            {isBrand ? 'No orders received yet' : 'No purchases yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={order._id} className="card p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {order.product?.images?.[0] ? (
                      <img src={order.product.images[0]} alt={order.product?.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-3xl flex-shrink-0">🛍️</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{order.product?.name}</h3>
                      <p className="text-sm text-gray-400">Qty: {order.quantity} · ₹{order.totalPrice?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isBrand ? `Buyer: ${order.buyer?.name}` : `Sold by: ${order.product?.brand?.name}`}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${cfg.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                    {isBrand && order.status === 'pending' && (
                      <button onClick={() => updateStatus(order._id, 'confirmed')} className="btn-primary py-1 px-3 text-sm">Confirm</button>
                    )}
                    {isBrand && order.status === 'confirmed' && (
                      <button onClick={() => updateStatus(order._id, 'shipped')} className="btn-primary py-1 px-3 text-sm">Mark Shipped</button>
                    )}
                    {isBrand && order.status === 'shipped' && (
                      <button onClick={() => updateStatus(order._id, 'delivered')} className="btn-primary py-1 px-3 text-sm">Mark Delivered</button>
                    )}
                  </div>
                </div>
                {order.shippingAddress && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
                    📍 {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;