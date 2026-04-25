import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, ShoppingBag, Menu, X, Facebook, Instagram, Twitter, ExternalLink, Package, CheckCircle, Clock } from 'lucide-react';
import { products } from './products';
import { Product, CartItem, Order } from './types';
import { db, auth } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

// --- UI Components ---

const Ticker = () => (
  <div className="bg-black text-white text-[10px] md:text-xs py-2 overflow-hidden whitespace-nowrap border-b border-white/10 z-[50] relative">
    <motion.div
      animate={{ x: [0, -2000] }}
      transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      className="inline-block"
    >
      {[...Array(20)].map((_, i) => (
        <span key={i} className="mx-12 uppercase tracking-widest font-medium">
          Wrongs & Rebels™ · SPRING '26 · LIVE NOW · WRONGS & REBELS CLOTHING · LIMITED EDITION · ৳ 1,399 FAST SHIPPING
        </span>
      ))}
    </motion.div>
  </div>
);

const Navbar = ({ cartCount, onOpenCart, onOpenAdmin, isAdmin }: { cartCount: number, onOpenCart: () => void, onOpenAdmin: () => void, isAdmin: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <Ticker />
      <div className={`w-full transition-all duration-700 ${isScrolled ? 'bg-black/80 backdrop-blur-md text-white py-4 shadow-2xl' : 'bg-transparent text-white py-6 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="hidden md:flex gap-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <a href="#" className="hover:opacity-50 transition-opacity">Shop</a>
            <a href="#" className="hover:opacity-50 transition-opacity">Collections</a>
          </div>

          <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
            <h1 className="text-xl md:text-3xl font-black tracking-[-0.05em] uppercase pointer-events-none">Wrongs & Rebels<span className="text-[10px] align-top">™</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <Search className="w-5 h-5 cursor-pointer hover:opacity-50 transition-opacity" />
            <div className="relative cursor-pointer group" onClick={onOpenCart}>
              <ShoppingBag className="w-5 h-5 group-hover:opacity-50 transition-opacity" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-sm font-black">
                  {cartCount}
                </span>
              )}
            </div>
            <User className={`w-5 h-5 cursor-pointer hover:opacity-50 transition-opacity ${isAdmin ? 'text-green-500' : ''}`} onClick={onOpenAdmin} />
          </div>
        </div>
      </div>
    </nav>
  );
};

const AdminDashboard = ({ orders, onUpdateStatus, onClose }: { orders: any[], onUpdateStatus: (id: string, s: string) => void, onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] bg-gray-50 flex flex-col md:flex-row overflow-hidden">
    <div className="w-full md:w-64 bg-black text-white p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-widest uppercase">Admin</h2>
        <X className="w-5 h-5 cursor-pointer md:hidden" onClick={onClose} />
      </div>
      <div className="space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Dashboard</div>
        <nav className="space-y-2">
          <a href="#" className="block py-2 text-sm font-bold border-l-2 border-white pl-4">Orders</a>
          <a href="#" className="block py-2 text-sm font-medium text-gray-400 pl-4 hover:text-white">Inventory</a>
        </nav>
      </div>
      <button onClick={() => signOut(auth)} className="w-full py-3 border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Sign Out</button>
    </div>
    
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-2xl font-black uppercase tracking-tight">Orders Management</h1>
        <button onClick={onClose} className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white px-4 py-2 border border-gray-100 shadow-sm">
          Return to Shop <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-2xl font-black">{orders.length}</p>
          </div>
          <Package className="w-8 h-8 text-gray-100" />
        </div>
        <div className="bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Orders</p>
            <p className="text-2xl font-black text-orange-500">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <Clock className="w-8 h-8 text-gray-100" />
        </div>
        <div className="bg-white p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue (Confirmed)</p>
            <p className="text-2xl font-black text-green-500">৳ {orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.totalAmount : acc, 0).toLocaleString()}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-gray-100" />
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-500">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="text-[12px] hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">#{order.id?.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <p className="font-bold">{order.customerInfo.fullName}</p>
                  <p className="text-[10px] text-gray-500">{order.customerInfo.phone}</p>
                </td>
                <td className="px-6 py-4">
                  {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                </td>
                <td className="px-6 py-4 font-bold">৳ {order.totalAmount?.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-600' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={order.status} 
                    onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                    className="border border-gray-200 text-[10px] uppercase font-bold p-1 outline-none focus:border-black"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirm</option>
                    <option value="shipped">Ship</option>
                    <option value="delivered">Deliver</option>
                    <option value="cancelled">Cancel</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="p-12 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">No orders found</div>}
      </div>
    </div>
  </div>
);

// --- Shop Sections ---

const Hero = () => (
  <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img 
        src="https://www.image2url.com/r2/default/images/1777093846446-9c04cdcc-61e4-45ca-a34b-28c37a84bdeb.png" 
        alt="Wrongs & Rebels Hero" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/10" />
    </div>
    
    <div className="absolute bottom-16 left-10 md:left-24 text-white space-y-6">
      <motion.p 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="text-lg font-bold uppercase tracking-tight"
      >
        SPRING'26
      </motion.p>
      <motion.h2 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-[0.9]"
      >
        COLLECTION IS LIVE
      </motion.h2>
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="flex gap-10 text-[18px] md:text-xl font-bold tracking-tight uppercase"
      >
        <a href="#" className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all">Surf Spring'26</a>
        <a href="#" className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all">Shop Now</a>
      </motion.div>
    </div>
  </section>
);

const Categories = () => (
  <section className="grid grid-cols-1 md:grid-cols-3 w-full h-[90vh] md:h-[100vh]">
    <div className="relative group overflow-hidden cursor-pointer">
      <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="T-shirts" />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">T-shirts</h3>
      </div>
    </div>
    <div className="relative group overflow-hidden cursor-pointer border-x border-white/5 bg-[#14261d]">
      <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000" className="w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105" alt="Hoodies" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">Hoodies</h3>
      </div>
    </div>
    <div className="relative group overflow-hidden cursor-pointer">
      <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Shirts" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors duration-500" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">Shirts</h3>
      </div>
    </div>
  </section>
);

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => (
  <div className="group relative cursor-pointer">
    <div className="relative aspect-[4/5] overflow-hidden bg-[#f2f2f2] mb-4">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-contain p-4 md:p-8 mix-blend-multiply transition-transform duration-1000 group-hover:scale-110"
      />
      {product.soldOut && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight shadow-sm z-10">
          Sold Out
        </div>
      )}
      <button 
        onClick={(e) => { e.stopPropagation(); if(!product.soldOut) onAddToCart(product); }}
        disabled={product.soldOut}
        className={`absolute bottom-4 left-4 right-4 py-3 bg-black text-white text-[9px] uppercase font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 ${product.soldOut ? 'hidden' : ''}`}
      >
        Add to Bag
      </button>
    </div>
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <h4 className="text-[12px] md:text-[13px] font-black tracking-tight leading-tight uppercase">{product.name}</h4>
        <p className="text-[13px] font-black tracking-tighter shrink-0 ml-4">৳{product.price.toLocaleString()}</p>
      </div>
      {product.colors && <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{product.colors.length} In Colors</p>}
    </div>
  </div>
);

const Footer = () => (
  <footer className="bg-black text-white pt-32 pb-12 px-6 mt-32">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="flex gap-10 mb-16">
        <Facebook className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Instagram className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Twitter className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-24 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">
        <a href="#" className="hover:text-white transition-colors">Support</a>
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of service</a>
        <a href="#" className="hover:text-white transition-colors">Return & Exchange Portal</a>
        <a href="#" className="hover:text-white transition-colors">Contact Form</a>
      </div>
      
      <div className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium">
        © 2026 - WRONGS & REBELS APPAREL
      </div>
    </div>
  </footer>
);

// --- Drawers & Modals ---

const CartDrawer = ({ isOpen, onClose, items, onRemove, onUpdateQty, onCheckout }: { isOpen: boolean, onClose: () => void, items: CartItem[], onRemove: (id: string) => void, onUpdateQty: (id: string, delta: number) => void, onCheckout: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm" />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col" >
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Your Bag ({items.length})</h3>
            <X className="w-6 h-6 cursor-pointer hover:rotate-90 transition-transform" onClick={onClose} />
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <ShoppingBag className="w-16 h-16 text-gray-100" />
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">Your bag is empty</p>
                <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8">Explore Collections</button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-6">
                  <div className="w-24 h-32 bg-gray-50 flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-[12px] font-black uppercase tracking-tight leading-tight">{item.name}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-black">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-500">৳{item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-100 rounded-sm">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="px-3 py-1.5 text-xs hover:bg-gray-50">-</button>
                        <span className="px-4 py-1.5 text-[11px] font-black">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="px-3 py-1.5 text-xs hover:bg-gray-50">+</button>
                      </div>
                      <p className="text-[12px] font-black">৳{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className="p-8 border-t border-gray-50 space-y-6 bg-gray-50/50">
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                <span>Bag Total</span>
                <span>৳{items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
              </div>
              <button onClick={onCheckout} className="w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-gray-900 transition-all shadow-xl shadow-black/10" >
                Proceed to Checkout
              </button>
              <p className="text-[9px] text-center text-gray-400 uppercase tracking-widest font-bold">Free delivery on orders over ৳5,000</p>
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const CheckoutModal = ({ isOpen, onClose, onSuccess, totalItems, totalAmount }: { isOpen: boolean, onClose: () => void, onSuccess: (data: any) => void, totalItems: CartItem[], totalAmount: number }) => {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', address: '', city: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = { customerInfo: formData, items: totalItems.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })), totalAmount, status: 'pending', paymentMethod: 'COD', createdAt: new Date().toISOString() };
      await addDoc(collection(db, 'orders'), { ...orderData, createdAt: serverTimestamp() });
      onSuccess(orderData);
    } catch (err) {
      console.error(err);
      alert('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto px-4 md:px-0">
          <div className="min-h-screen flex items-center justify-center pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="inline-block w-full max-w-2xl p-10 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl relative" >
              <button onClick={onClose} className="absolute right-8 top-8 text-gray-300 hover:text-black transition-colors" >
                <X className="w-8 h-8" />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-12">COD Checkout</h2>
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient Name</label>
                    <input required type="text" placeholder="John Doe" className="w-full border-b border-gray-100 py-3 text-[14px] outline-none focus:border-black transition-colors font-bold placeholder:font-normal placeholder:text-gray-300" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Number</label>
                    <input required type="tel" placeholder="+880" className="w-full border-b border-gray-100 py-3 text-[14px] outline-none focus:border-black transition-colors font-bold placeholder:font-normal placeholder:text-gray-300" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Email</label>
                  <input required type="email" placeholder="hello@celifoto.com" className="w-full border-b border-gray-100 py-3 text-[14px] outline-none focus:border-black transition-colors font-bold placeholder:font-normal placeholder:text-gray-300" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Shipping Address</label>
                  <textarea required rows={3} placeholder="Apartment, Street, Area..." className="w-full border border-gray-100 p-4 text-[14px] outline-none focus:border-black transition-colors resize-none font-medium placeholder:font-normal placeholder:text-gray-300" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery City</label>
                    <input required type="text" placeholder="Dhaka" className="w-full border-b border-gray-100 py-3 text-[14px] outline-none focus:border-black transition-colors font-bold placeholder:font-normal placeholder:text-gray-300" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Option</label>
                    <div className="py-3 text-[13px] font-black text-gray-900 border-b border-gray-50 flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Cash on Delivery
                    </div>
                  </div>
                </div>
                <div className="pt-10 border-t border-gray-100 mt-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-1">Total Payable</p>
                    <p className="text-3xl font-black tracking-tight">৳{totalAmount.toLocaleString()}</p>
                  </div>
                  <button disabled={loading} type="submit" className="bg-black text-white px-12 py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-gray-900 disabled:opacity-50 transition-all shadow-2xl shadow-black/20" >
                    {loading ? 'Confirming...' : 'Place Order Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- App Component ---

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      // For this app, any authenticated user can view admin dashboard for demo purposes
      // In production, we'd check against an 'admins' collection
      setIsAdmin(!!user);
      if (!user) setIsAdminMode(false);
    });
  }, []);

  // Listen to Orders
  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [isAdmin]);

  const toggleAdmin = async () => {
    if (!isAdmin) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsAdminMode(true);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  if (isAdminMode && isAdmin) {
    return <AdminDashboard orders={orders} onUpdateStatus={updateOrderStatus} onClose={() => setIsAdminMode(false)} />;
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-10 max-w-lg" >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tight">Order Confirmed</h2>
            <p className="text-gray-500 text-[14px] leading-loose font-medium max-w-sm mx-auto">
              Your request has been received. Our team will contact you shortly to verify your delivery address.
            </p>
          </div>
          <div className="bg-gray-50/50 p-8 text-left border border-gray-100 rounded-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Order Summary</p>
            <p className="text-[14px] font-black">{orderSuccess.items.length} Items · ৳{orderSuccess.totalAmount.toLocaleString()}</p>
            <p className="text-[12px] text-gray-500 mt-4 leading-relaxed">
              Shipping to: <span className="font-bold text-black">{orderSuccess.customerInfo.fullName}</span><br />
              {orderSuccess.customerInfo.address}, {orderSuccess.customerInfo.city}
            </p>
          </div>
          <button onClick={() => { setOrderSuccess(null); setCart([]); }} className="w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20" > Back to Shop </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-950 selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenAdmin={toggleAdmin}
        isAdmin={isAdmin}
      />
      
      <main>
        <Hero />
        <Categories />
        <section className="max-w-7xl mx-auto px-6 py-32 md:py-48">
          <div className="text-center mb-24 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Curated pieces</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">New Arrivals</h2>
            <div className="w-16 h-1 bg-black mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-4 gap-y-16 md:gap-y-24">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
          <div className="mt-32 flex justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-16 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20" > View All Products </motion.button>
          </div>
        </section>
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} onUpdateQty={(id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))} onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} onSuccess={(data) => { setIsCheckoutOpen(false); setOrderSuccess(data); }} totalItems={cart} totalAmount={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)} />
    </div>
  );
}
