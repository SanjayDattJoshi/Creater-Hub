import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiShoppingBag, HiPlus, HiSearch, HiPencil, HiTrash,
  HiTag, HiCube, HiCurrencyRupee, HiClipboardList, HiLockClosed,
} from 'react-icons/hi';
import { useRazorpay } from '../hooks/useRazorpay';

const categories = ['all','fashion','tech','food','travel','fitness','beauty','gaming','education','lifestyle','other'];
const emptyForm  = { name:'', description:'', price:'', stock:'', category:'other' };

/* ── Shared product form ── */
const ProductForm = ({ form, setForm, onSubmit, onCancel, saving, submitLabel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Product Name</label>
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
    </div>
    <div>
      <label className="label">Description</label>
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" required />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label">Price (₹)</label>
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" required />
      </div>
      <div>
        <label className="label">Stock</label>
        <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input" required />
      </div>
    </div>
    <div>
      <label className="label">Category</label>
      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input capitalize">
        {categories.filter(c => c !== 'all').map(c => (
          <option key={c} value={c} className="bg-dark-900 capitalize">{c}</option>
        ))}
      </select>
    </div>
    <div className="flex justify-end gap-3 pt-1">
      <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : submitLabel}</button>
    </div>
  </form>
);

/* ──────────────────────────────────────────────────────────
   BRAND VIEW — My Listings management dashboard
────────────────────────────────────────────────────────── */
const BrandShop = () => {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showCreate, setShowCreate]       = useState(false);
  const [createForm, setCreateForm]       = useState(emptyForm);
  const [saving, setSaving]               = useState(false);
  const [editProduct, setEditProduct]     = useState(null);
  const [editForm, setEditForm]           = useState(emptyForm);
  const [editSaving, setEditSaving]       = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    api.get('/products/my')
      .then(({ data }) => setProducts(data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.post('/products', createForm);
      setProducts(p => [data.product, ...p]);
      setShowCreate(false); setCreateForm(emptyForm);
      toast.success('Product listed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({ name: p.name||'', description: p.description||'', price: p.price||'', stock: p.stock||'', category: p.category||'other' });
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setEditSaving(true);
    try {
      const { data } = await api.put(`/products/${editProduct._id}`, editForm);
      setProducts(prev => prev.map(p => p._id === editProduct._id ? data.product : p));
      setEditProduct(null);
      toast.success('Product updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteProduct._id}`);
      setProducts(prev => prev.filter(p => p._id !== deleteProduct._id));
      setDeleteProduct(null);
      toast.success('Product removed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
  const totalValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HiClipboardList className="w-6 h-6 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">My Listings</h1>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs font-medium">{products.length}</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" /> List New Product
        </button>
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: HiCube,          label: 'Total Stock',     value: totalStock.toLocaleString(),        color: 'text-blue-400' },
            { icon: HiCurrencyRupee, label: 'Inventory Value', value: `₹${totalValue.toLocaleString()}`, color: 'text-brand-300' },
            { icon: HiTag,           label: 'Out of Stock',    value: outOfStock,                         color: outOfStock > 0 ? 'text-red-400' : 'text-green-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search your listings…" className="input py-2"
          style={{ paddingLeft: '2.25rem' }} />
      </div>

      {/* Table */}
      {loading ? <Loader /> : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <HiShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 mb-4">
            {products.length === 0 ? "You haven't listed any products yet." : 'No listings match your search.'}
          </p>
          {products.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto flex items-center gap-2">
              <HiPlus className="w-4 h-4" /> List Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-right px-5 py-3">Stock</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black/30 flex-shrink-0 overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate max-w-[180px]">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="capitalize text-gray-400 text-xs bg-white/5 px-2 py-1 rounded-lg">{p.category}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-brand-300">₹{p.price?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-medium text-xs ${p.stock === 0 ? 'text-red-400' : p.stock < 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-400/40 text-brand-300 hover:bg-brand-400/10 transition-colors text-xs font-medium">
                        <HiPencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleteProduct(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium">
                        <HiTrash className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="List New Product">
        <ProductForm form={createForm} setForm={setCreateForm} onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)} saving={saving} submitLabel="List Product" />
      </Modal>
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product">
        <ProductForm form={editForm} setForm={setEditForm} onSubmit={handleEdit}
          onCancel={() => setEditProduct(null)} saving={editSaving} submitLabel="Save Changes" />
      </Modal>
      <Modal isOpen={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Remove Product">
        <div className="space-y-4">
          <p className="text-gray-300">Remove <span className="text-white font-semibold">{deleteProduct?.name}</span>? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteProduct(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50">
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   CREATOR VIEW — Browse & buy shop grid
────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────
   CREATOR VIEW — Browse & buy with Razorpay checkout
────────────────────────────────────────────────────────── */
const EMPTY_ADDR = {
  quantity: 1, fullName: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'India', phone: '',
};

const CreatorShop = () => {
  const pay = useRazorpay();
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('all');
  const [orderModal, setOrderModal] = useState(null); // product being purchased
  const [addrForm, setAddrForm]     = useState(EMPTY_ADDR);
  const [addrDone, setAddrDone]     = useState(false); // step tracker
  const [paying, setPaying]         = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'all') params.set('category', category);
    api.get(`/products?${params}`)
      .then(({ data }) => setProducts(data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  const openBuy = (p) => {
    setOrderModal(p);
    setAddrForm(EMPTY_ADDR);
    setAddrDone(false);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setAddrDone(true);
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const { quantity, ...addr } = addrForm;
      const total = orderModal.price * Number(quantity);

      await pay({
        createEndpoint: '/payments/create-order',
        verifyEndpoint: '/payments/verify',
        createBody:     { amount: total },
        verifyExtra:    {
          productId:       orderModal._id,
          quantity:        Number(quantity),
          shippingAddress: {
            fullName:     addr.fullName,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            city:         addr.city,
            state:        addr.state,
            postalCode:   addr.postalCode,
            country:      addr.country,
            phone:        addr.phone,
          },
        },
        description: `Purchase: ${orderModal.name}`,
      });

      setOrderModal(null);
      // Refresh stock
      setProducts(prev =>
        prev.map(p =>
          p._id === orderModal._id
            ? { ...p, stock: Math.max(0, p.stock - Number(quantity)) }
            : p
        )
      );
      toast.success('Payment successful! Order placed.');
    } catch (err) {
      if (err.message !== 'Payment cancelled') toast.error(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const total = (orderModal?.price || 0) * Number(addrForm.quantity || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HiShoppingBag className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Shop</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="input py-2" style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input py-2 w-auto capitalize">
          {categories.map(c => <option key={c} value={c} className="capitalize bg-dark-900">{c}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : products.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No products found</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p._id} className="card-hover overflow-hidden group">
              <div className="aspect-square bg-black/30 overflow-hidden">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
                }
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm line-clamp-1">{p.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-brand-300 font-bold">₹{p.price?.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">{p.stock} left</span>
                </div>
                <button onClick={() => openBuy(p)} disabled={p.stock === 0}
                  className="btn-primary w-full mt-3 py-2 text-sm disabled:opacity-50">
                  {p.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Checkout Modal — Step 1: Address / Step 2: Pay ── */}
      <Modal isOpen={!!orderModal} onClose={() => setOrderModal(null)}
        title={addrDone ? 'Confirm & Pay' : `Checkout: ${orderModal?.name}`}>

        {!addrDone ? (
          /* Step 1 — Shipping address */
          <form onSubmit={handleAddressSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Quantity</label>
                <input type="number" min={1} max={orderModal?.stock} value={addrForm.quantity}
                  onChange={e => setAddrForm({ ...addrForm, quantity: e.target.value })} className="input" />
              </div>
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} className="input" required />
              </div>
              <div className="col-span-2">
                <label className="label">Address Line 1</label>
                <input value={addrForm.addressLine1} onChange={e => setAddrForm({ ...addrForm, addressLine1: e.target.value })} className="input" required />
              </div>
              <div className="col-span-2">
                <label className="label">Address Line 2 <span className="text-gray-500">(optional)</span></label>
                <input value={addrForm.addressLine2} onChange={e => setAddrForm({ ...addrForm, addressLine2: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">City</label>
                <input value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">State</label>
                <input value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input value={addrForm.postalCode} onChange={e => setAddrForm({ ...addrForm, postalCode: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} className="input" required />
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-300">
                Total: <span className="text-brand-300 font-bold text-lg">₹{total.toLocaleString()}</span>
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOrderModal(null)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Continue to Pay →</button>
              </div>
            </div>
          </form>
        ) : (
          /* Step 2 — Order summary + pay button */
          <div className="space-y-4">
            <div className="card p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Product</span>
                <span className="text-white font-medium">{orderModal?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity</span>
                <span className="text-white">{addrForm.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ship to</span>
                <span className="text-white text-right max-w-[200px]">
                  {addrForm.fullName}, {addrForm.addressLine1}, {addrForm.city}, {addrForm.state} {addrForm.postalCode}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-brand-300 font-bold text-lg">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <HiLockClosed className="w-3.5 h-3.5 text-green-500" />
              Secured by Razorpay — UPI, Cards, Net Banking accepted
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setAddrDone(false)} className="btn-ghost">← Edit Address</button>
              <button onClick={handlePay} disabled={paying}
                className="btn-primary flex items-center gap-2">
                {paying
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                  : <><HiLockClosed className="w-4 h-4" /> Pay ₹{total.toLocaleString()}</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ── Root — pick view by role ── */
const Shop = () => {
  const { user } = useAuth();
  return user?.role === 'brand' ? <BrandShop /> : <CreatorShop />;
};

export default Shop;