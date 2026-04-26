import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Search, User, ShoppingBag, Menu, X, Facebook, Instagram, Twitter, ExternalLink, Package, CheckCircle, Clock, ChevronLeft, ChevronRight, Plus, Truck, ArrowRight } from 'lucide-react';
import { products } from './products';
import { Product, CartItem, Order } from './types';
import { db, auth } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

const ProductView = ({ product, productsList, onAddToCart, onBack, onProductClick }: { product: Product, productsList: Product[], onAddToCart: (p: Product) => void, onBack: () => void, onProductClick: (p: Product) => void }) => {
  const [selectedSize, setSelectedSize] = useState('S');
  const [activeTab, setActiveTab] = useState('Recommended');
  const [activeAccordion, setActiveAccordion] = useState<string | null>('details');
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
  const unavailableSizes = ['XS', 'XL'];

  const relatedProducts = productsList.filter(p => p.id !== product.id).slice(0, 8);

  return (
    <div className="bg-white min-h-screen pt-20 md:pt-32">
      <div className="flex flex-col lg:flex-row">
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-1/2 bg-[#efefef] relative aspect-square lg:aspect-auto lg:h-[calc(100vh-80px)] top-0 lg:sticky">
          <div className="absolute inset-0 flex items-center justify-center p-8 md:p-24">
            <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <button onClick={onBack} className="absolute top-8 left-8 p-2 hover:bg-black/5 rounded-full transition-colors z-20">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="absolute bottom-12 left-12 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            1 / 15
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 left-8 group">
            <ChevronLeft className="w-8 h-8 text-gray-300 cursor-pointer group-hover:text-black transition-colors" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-8 group">
            <ChevronRight className="w-8 h-8 text-gray-300 cursor-pointer group-hover:text-black transition-colors" />
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-1/2 p-8 md:p-24 md:px-32 space-y-16">
          <Reveal>
            <div className="flex justify-between items-start gap-8">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight max-w-md">{product.name}</h1>
              <p className="text-xl md:text-2xl font-black">৳{product.price.toLocaleString()}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Select Color</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-100">|</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Plum</span>
              </div>
              <div className="flex gap-4 p-6 bg-gray-50 rounded-sm">
                <div className="w-14 h-16 bg-[#a35e6a] ring-2 ring-black ring-offset-4 ring-offset-white cursor-pointer" />
                <div className="w-14 h-16 bg-[#4c3e53] opacity-30 cursor-pointer hover:opacity-100 transition-opacity" />
                <div className="w-14 h-16 bg-[#3a4454] opacity-30 cursor-pointer hover:opacity-100 transition-opacity" />
                <div className="w-14 h-16 bg-[#8a2b4a] opacity-30 cursor-pointer hover:opacity-100 transition-opacity" />
                <div className="w-14 h-16 bg-[#5c4a3e] opacity-30 cursor-pointer hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Select Size</span>
                <button className="text-[9px] font-black underline uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all">Find Your Size</button>
              </div>
              <div className="grid grid-cols-6 border border-gray-100">
                {sizes.map((size) => (
                  <button
                    key={size}
                    disabled={unavailableSizes.includes(size)}
                    onClick={() => setSelectedSize(size)}
                    className={`h-20 flex items-center justify-center text-[11px] font-black transition-all relative border-r last:border-r-0 border-gray-50
                      ${selectedSize === size ? 'bg-black text-white' : 'hover:bg-gray-50'}
                      ${unavailableSizes.includes(size) ? 'text-gray-200 cursor-not-allowed italic' : ''}
                    `}
                  >
                    {size}
                    {unavailableSizes.includes(size) && (
                      <div className="absolute inset-0 bg-white/30 flex items-center justify-center overflow-hidden">
                        <div className="w-[120%] h-[1px] bg-gray-200 rotate-[35deg]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-loose">
                <span className="text-black">Male</span> model is 6' & 70kg, wearing the size M, <span className="text-black">Female</span> model is 5'9" & 48kg, wearing the size S
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <button 
              onClick={() => onAddToCart(product)}
              className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Add To Cart
            </button>
          </Reveal>

          <Reveal delay={0.4}>
              <div className="border-t border-gray-100">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === 'details' ? null : 'details')}
                  className="w-full flex items-center justify-between py-8 group text-gray-600 hover:text-black transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Product Details</span>
                  </div>
                  <Plus className={`w-4 h-4 text-gray-300 transition-all ${activeAccordion === 'details' ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                </button>
                <AnimatePresence>
                  {activeAccordion === 'details' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 text-[11px] leading-relaxed text-gray-500 uppercase font-medium whitespace-pre-wrap">
                        {product.description || 'No detailed specifications available for this article.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-gray-100">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full flex items-center justify-between py-8 group text-gray-600 hover:text-black transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <Truck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Shipping Details</span>
                  </div>
                  <Plus className={`w-4 h-4 text-gray-300 transition-all ${activeAccordion === 'shipping' ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                </button>
                <AnimatePresence>
                  {activeAccordion === 'shipping' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 space-y-4">
                        <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                          Standard Shipping: 2-4 business days within Dhaka Metro area.
                        </p>
                        <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                          Outside Dhaka: 3-7 business days via courier services.
                        </p>
                        <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                          Cash on Delivery is available for all regions.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </Reveal>
        </div>
      </div>

      {/* Recommended Section */}
      <div className="bg-white py-40 border-t border-gray-100">
        <div className="text-center mb-24 space-y-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-300">Complementary Pieces</h2>
          <div className="flex justify-center gap-16">
            {['Recommended', 'Best Sellers', 'New Arrivals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 transition-all ${activeTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-300 hover:text-black'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-20 px-4 md:px-0">
          {relatedProducts.map(p => (
            <div key={p.id} className="border-r border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
               <ProductCard product={p} onAddToCart={onAddToCart} onClick={onProductClick} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Reveal = ({ children, delay = 0, y = 20 }: { children: React.ReactNode, delay?: number, y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

const Ticker = () => (
  <div className="bg-black text-white text-[10px] md:text-xs py-2 overflow-hidden whitespace-nowrap border-b border-white/10 z-[50] relative">
    <motion.div
      animate={{ x: [0, -2000] }}
      transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      className="inline-block"
    >
      {[...Array(20)].map((_, i) => (
        <span key={i} className="mx-12 uppercase tracking-widest font-medium">
          Feliciteclo™ · SPRING '26 · LIVE NOW · FELICITECLO CLOTHING · LIMITED EDITION · ৳ 1,399 FAST SHIPPING
        </span>
      ))}
    </motion.div>
  </div>
);

const Navbar = ({ cartCount, onOpenCart, onOpenAdmin, isAdmin, setCurrentPage, currentPage, categories, onCategorySelect, selectedCategory }: { cartCount: number, onOpenCart: () => void, onOpenAdmin: () => void, isAdmin: boolean, setCurrentPage: (page: 'home' | 'shop' | 'product') => void, currentPage: 'home' | 'shop' | 'product', categories: string[], onCategorySelect: (cat: string) => void, selectedCategory: string }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const isShop = currentPage === 'shop' || currentPage === 'product';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Shop', page: 'shop' as const },
    { label: 'Collections', page: 'home' as const },
    { label: 'Search', action: () => {} },
    { label: 'Account', action: onOpenAdmin }
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-[100]">
      <Ticker />
      <div className={`w-full transition-all duration-700 ${isScrolled || isShop ? 'bg-white/95 backdrop-blur-md text-black py-4 shadow-sm' : 'bg-transparent text-white py-6 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 hover:opacity-50 transition-opacity"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <button onClick={() => {setCurrentPage('shop'); onCategorySelect('All');}} className={`transition-opacity uppercase cursor-pointer ${currentPage === 'shop' && selectedCategory === 'All' ? 'border-b-2 border-black pb-1' : 'hover:opacity-50'}`}>Shop</button>
            <div 
              className="relative group"
              onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
              onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
            >
              <button className={`hover:opacity-50 transition-opacity uppercase cursor-pointer ${currentPage === 'shop' && selectedCategory !== 'All' ? 'border-b-2 border-black pb-1' : ''}`}>Categories</button>
              
              <AnimatePresence>
                {isCategoriesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-48 bg-white text-black shadow-2xl border border-gray-100 py-6 z-[200]"
                  >
                    <div className="flex flex-col">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            onCategorySelect(cat);
                            setCurrentPage('shop');
                            setIsCategoriesDropdownOpen(false);
                          }}
                          className="px-8 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <motion.h1 
              initial={{ letterSpacing: "0.2em", opacity: 0 }}
              animate={{ letterSpacing: "-0.05em", opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-lg md:text-3xl font-black uppercase whitespace-nowrap"
            >
              Feliciteclo<span className="text-[10px] align-top font-bold">™</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Search className="hidden md:block w-5 h-5 cursor-pointer hover:opacity-50 transition-opacity" />
            <Search className="md:hidden w-6 h-6 cursor-pointer hover:opacity-50 transition-opacity" />
            <div className="relative cursor-pointer group" onClick={onOpenCart}>
              <ShoppingBag className="w-6 h-6 md:w-5 h-5 group-hover:opacity-50 transition-opacity" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 -right-1 text-[8px] w-4 h-4 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-sm font-black ${isScrolled || isShop ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
            <User className={`hidden md:block w-5 h-5 cursor-pointer hover:opacity-50 transition-opacity ${isAdmin ? 'text-green-500' : ''}`} onClick={onOpenAdmin} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[120] p-10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-20">
                  <span className="text-xl font-black uppercase tracking-tighter">FEL<span className="text-[10px] align-top">™</span></span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <nav className="flex flex-col gap-10">
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setCurrentPage('shop');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-4xl font-black uppercase tracking-tighter text-left hover:text-gray-400 transition-colors"
                  >
                    Shop
                  </motion.button>
                  
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Categories</p>
                    <div className="flex flex-col gap-4">
                      {categories.map((cat, i) => (
                        <motion.button
                          key={cat}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          onClick={() => {
                            onCategorySelect(cat);
                            setCurrentPage('shop');
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-xl font-black uppercase tracking-tighter text-left hover:text-gray-400 transition-colors"
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => {
                      onOpenAdmin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-4xl font-black uppercase tracking-tighter text-left hover:text-gray-400 transition-colors"
                  >
                    Account
                  </motion.button>
                </nav>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">© 2026 Feliciteclo™</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const AdminDashboard = ({ orders, productsList, onUpdateStatus, onAddProduct, onDeleteProduct, onClose }: { orders: any[], productsList: Product[], onUpdateStatus: (id: string, s: string) => void, onAddProduct: (p: any) => void, onDeleteProduct: (id: string) => void, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'json'>('orders');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    category: 'T-shirts',
    image: '',
    description: '',
    isNewArrival: true,
    soldOut: false
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: 0, category: 'T-shirts', image: '', description: '', isNewArrival: true, soldOut: false });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ 
      name: p.name, 
      price: p.price, 
      category: p.category, 
      image: p.image, 
      description: p.description || '', 
      isNewArrival: p.isNewArrival || false, 
      soldOut: p.soldOut || false 
    });
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({ ...productForm, id: editingProduct?.id });
    setIsProductModalOpen(false);
  };

  const handleBulkImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (Array.isArray(data)) {
        data.forEach(p => onAddProduct(p));
        alert('Bulk synchronization initialized.');
        setJsonInput('');
      }
    } catch (e) {
      alert('Invalid JSON structure.');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-0 md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-xl p-6 md:p-10 shadow-2xl overflow-y-auto h-full md:h-auto md:max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-widest">{editingProduct ? 'Edit Article' : 'New Article'}</h3>
                <X className="w-6 h-6 cursor-pointer md:hidden" onClick={() => setIsProductModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmitProduct} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Article Title</label>
                  <input required type="text" className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Value (৳)</label>
                    <input required type="number" className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Class</label>
                    <select className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold uppercase" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                      {["T-shirts", "Shirts", "Hoodies", "Pants", "Denims", "Sweaters", "Jackets", "Shackets", "Beanies"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visual URL</label>
                  <input required type="url" className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Design Specifications</label>
                  <textarea rows={3} className="w-full border border-gray-100 p-4 text-sm outline-none focus:border-black resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
                <div className="flex flex-wrap gap-6 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={productForm.isNewArrival} onChange={e => setProductForm({...productForm, isNewArrival: e.target.checked})} className="w-4 h-4 accent-black" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">Manifesto Peak</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={productForm.soldOut} onChange={e => setProductForm({...productForm, soldOut: e.target.checked})} className="w-4 h-4 accent-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-500 transition-colors">Depleted</span>
                  </label>
                </div>
                <div className="flex flex-col md:flex-row gap-4 pt-10">
                  <button type="submit" className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-widest">{editingProduct ? 'Commit Changes' : 'Initialize Article'}</button>
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="w-full py-6 border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50">Abort</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`fixed inset-y-0 left-0 z-[450] w-72 bg-black text-white p-8 flex flex-col justify-between transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-widest uppercase">Console</h2>
            <X className="w-6 h-6 cursor-pointer md:hidden" onClick={() => setIsSidebarOpen(false)} />
          </div>
          <div className="space-y-6">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black">Management</div>
            <nav className="space-y-4">
              <button 
                onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === 'orders' ? 'border-r-4 border-white pr-4 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <Package className="w-4 h-4" /> 
                ORDERS
              </button>
              <button 
                onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === 'inventory' ? 'border-r-4 border-white pr-4 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" /> 
                INVENTORY
              </button>
              <button 
                onClick={() => { setActiveTab('json'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === 'json' ? 'border-r-4 border-white pr-4 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <ExternalLink className="w-4 h-4" /> 
                JSON PORTAL
              </button>
            </nav>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-black text-xs">A</div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase truncate">{auth.currentUser?.email}</p>
              <p className="text-[8px] text-gray-400 uppercase tracking-widest">Administrator</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-4 border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">TERMINATE SESSION</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-[10] bg-gray-50/95 backdrop-blur-md p-6 md:px-12 md:py-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 md:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                {activeTab === 'orders' ? 'Live Orders' : activeTab === 'inventory' ? 'Inventory' : 'JSON Portal'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'inventory' && (
              <button 
                onClick={handleOpenAddModal}
                className="bg-black text-white p-3 md:px-6 md:py-3 rounded-full md:rounded-none flex items-center gap-2"
              >
                <Plus className="w-5 h-5 md:w-3 md:h-3" />
                <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">Insert Article</span>
              </button>
            )}
            <button onClick={onClose} className="p-3 md:px-6 md:py-3 bg-white border border-gray-200 rounded-full md:rounded-none flex items-center gap-2 hover:bg-gray-50">
              <ExternalLink className="w-5 h-5 md:w-3 md:h-3" />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">Exit</span>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-12 pb-32">
          {activeTab === 'orders' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cycle Volume</p>
                    <p className="text-2xl md:text-3xl font-black">{orders.length}</p>
                  </div>
                  <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-blue-50" />
                </div>
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Action Required</p>
                    <p className="text-2xl md:text-3xl font-black text-orange-500">{orders.filter(o => o.status === 'pending').length}</p>
                  </div>
                  <Clock className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-orange-50" />
                </div>
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 sm:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Net Liquidity</p>
                    <p className="text-2xl md:text-3xl font-black text-green-500">৳ {orders.reduce((acc, o) => o.status !== 'cancelled' ? acc + o.totalAmount : acc, 0).toLocaleString()}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-green-50" />
                </div>
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-4">
                    {['all', 'pending', 'confirmed', 'shipped'].map(filter => (
                      <button key={filter} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${filter === 'all' ? 'bg-black text-white' : 'text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}>
                        {filter}
                      </button>
                    ))}
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-50 transition-opacity">
                    Export CSV <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">
                      <tr>
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Entity</th>
                        <th className="px-8 py-6">Value</th>
                        <th className="px-8 py-6">Protocol</th>
                        <th className="px-8 py-6">Operation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(order => (
                        <tr key={order.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-mono text-blue-600 font-black mb-1">#{order.id?.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[11px] font-bold text-gray-300">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-xs uppercase">{order.customerInfo.fullName}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{order.customerInfo.phone}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-sm">৳{order.totalAmount?.toLocaleString()}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{order.items.length} Units</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                              order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              order.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <select 
                              value={order.status} 
                              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                              className="bg-transparent border-b-2 border-gray-100 text-[10px] uppercase font-black p-1 outline-none focus:border-black cursor-pointer transition-colors"
                            >
                              <option value="pending">Authorize</option>
                              <option value="confirmed">Confirm</option>
                              <option value="shipped">Dispatch</option>
                              <option value="delivered">Liquidate</option>
                              <option value="cancelled">Abort</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orders.length === 0 && <div className="p-24 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">System Idle - No Data</div>}
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white border border-gray-100 p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-blue-600 font-black text-sm">#{order.id?.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                        order.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        order.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Customer</p>
                        <p className="font-black text-sm uppercase">{order.customerInfo.fullName}</p>
                        <p className="text-[11px] text-gray-500 font-bold">{order.customerInfo.phone}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Value</p>
                          <p className="font-black text-lg">৳{order.totalAmount?.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{order.items.length} Units</p>
                        </div>
                        <div className="w-1/2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Action</p>
                          <select 
                            value={order.status} 
                            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 text-[10px] uppercase font-black px-3 py-3 outline-none focus:border-black"
                          >
                            <option value="pending">Authorize</option>
                            <option value="confirmed">Confirm</option>
                            <option value="shipped">Dispatch</option>
                            <option value="delivered">Liquidate</option>
                            <option value="cancelled">Abort</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">No data records</div>}
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {productsList.map(product => (
                <div key={product.id} className="bg-white border border-gray-100 p-4 md:p-6 flex flex-col group hover:shadow-2xl transition-all duration-700">
                  <div className="aspect-[4/5] bg-gray-50 mb-6 overflow-hidden relative">
                    <img src={product.image} className={`w-full h-full object-cover transition-all duration-700 ${product.soldOut ? 'grayscale scale-105 opacity-50' : 'group-hover:scale-110'}`} alt={product.name} />
                    {product.soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] -rotate-12 shadow-xl">VOID</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="text-[11px] font-black uppercase leading-tight tracking-tight">{product.name}</h4>
                        <p className="text-[10px] font-black">৳{product.price.toLocaleString()}</p>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{product.category}</p>
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${product.soldOut ? 'text-red-500' : 'text-green-500'}`}>
                        {product.soldOut ? 'Depleted' : 'Active'}
                      </span>
                      <div className="flex gap-4">
                        <button onClick={() => handleOpenEditModal(product)} className="text-[9px] font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-opacity">Edit</button>
                        <button onClick={() => onDeleteProduct(product.id)} className="text-[9px] font-black uppercase tracking-widest border-b border-red-500 text-red-500 pb-1 hover:opacity-50 transition-opacity">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'json' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Actual Representation</h3>
                  <button 
                    onClick={() => {navigator.clipboard.writeText(JSON.stringify(productsList, null, 2)); alert('Copied to clipboard');}}
                    className="w-full sm:w-auto text-[9px] font-black uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
                  >
                    Download Current JSON
                  </button>
                </div>
                <div className="bg-black text-green-500 p-6 md:p-8 rounded-sm font-mono text-[10px] h-[300px] md:h-[500px] overflow-auto border border-white/10 shadow-2xl">
                  <pre>{JSON.stringify(productsList, null, 2)}</pre>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-loose">
                  Copy this content and overwrite your <code>src/data/products.json</code> file to finalize your site updates for visitors.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Sync Channel</h3>
                <textarea 
                  placeholder="PASTE JSON HERE FOR BULK SYNCHRONIZATION"
                  className="w-full bg-white border border-gray-100 p-6 md:p-8 font-mono text-[10px] h-[300px] md:h-[500px] outline-none focus:border-black shadow-inner resize-none"
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                />
                <button 
                  onClick={handleBulkImport}
                  className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gray-900 transition-all shadow-xl shadow-black/10"
                >
                  Execute Bulk Sync
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Shop Sections ---

const Hero = ({ setCurrentPage }: { setCurrentPage: (page: 'home' | 'shop' | 'product') => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black"
      style={{ perspective: "1500px" }}
    >
      <motion.div 
        style={{ 
          rotateX, 
          rotateY,
          scale: 1.1,
          transformStyle: "preserve-3d"
        }}
        className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
      >
        <img 
          src="https://www.image2url.com/r2/default/images/1777093846446-9c04cdcc-61e4-45ca-a34b-28c37a84bdeb.png" 
          alt="Feliciteclo Hero" 
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>
      
      <div 
        className="absolute bottom-16 left-10 md:left-24 text-white space-y-6 pointer-events-none"
        style={{ transform: "translateZ(80px)" }}
      >
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
          className="flex gap-10 text-[18px] md:text-xl font-bold tracking-tight uppercase pointer-events-auto"
        >
          <button onClick={() => setCurrentPage('shop')} className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all cursor-pointer">Surf Spring'26</button>
          <button onClick={() => setCurrentPage('shop')} className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all cursor-pointer">Shop Now</button>
        </motion.div>
      </div>
    </section>
  );
};

const Categories = ({ onCategorySelect, setCurrentPage }: { onCategorySelect: (cat: string) => void, setCurrentPage: (page: 'home' | 'shop' | 'product') => void }) => (
  <section className="grid grid-cols-1 md:grid-cols-3 w-full h-[90vh] md:h-[100vh]">
    <motion.div 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }} 
      className="relative group overflow-hidden cursor-pointer"
      onClick={() => { onCategorySelect('T-shirts'); setCurrentPage('shop'); }}
    >
      <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="T-shirts" />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">T-shirts</h3>
      </div>
    </motion.div>
    <motion.div 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }} 
      transition={{ delay: 0.1 }} 
      className="relative group overflow-hidden cursor-pointer border-x border-white/5 bg-[#14261d]"
      onClick={() => { onCategorySelect('Hoodies'); setCurrentPage('shop'); }}
    >
      <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000" className="w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105" alt="Hoodies" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">Hoodies</h3>
      </div>
    </motion.div>
    <motion.div 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }} 
      transition={{ delay: 0.2 }} 
      className="relative group overflow-hidden cursor-pointer"
      onClick={() => { onCategorySelect('Shirts'); setCurrentPage('shop'); }}
    >
      <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Shirts" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors duration-500" />
      <div className="absolute bottom-12 left-12 text-white">
        <h3 className="text-3xl font-black tracking-widest uppercase">Shirts</h3>
      </div>
    </motion.div>
  </section>
);

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard = ({ product, onAddToCart, onClick }: { product: Product, onAddToCart: (p: Product) => void, onClick?: (p: Product) => void }) => (
  <Reveal y={40}>
    <div className="group relative cursor-pointer w-full" onClick={() => onClick?.(product)}>
      <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-[470px] overflow-hidden bg-gray-100 mb-4 border border-gray-50">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-0 left-0 flex flex-col gap-1 items-start">
          {product.soldOut && (
            <div className="bg-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight shadow-sm z-10 text-red-500">
              Sold Out
            </div>
          )}
          {product.isNewArrival && (
            <div className="bg-black text-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight shadow-sm z-10 whitespace-nowrap">
              Manifesto Peak
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if(!product.soldOut) onAddToCart(product); }}
          disabled={product.soldOut}
          className={`absolute bottom-4 left-4 right-4 py-4 bg-black text-white text-[9px] uppercase font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 ${product.soldOut ? 'hidden' : ''} shadow-2xl`}
        >
          Add to Bag
        </button>
      </div>
      <div className="space-y-1.5 px-2 md:px-4 pb-4">
        <div className="flex justify-between items-baseline gap-2">
          <h4 className="text-[10px] md:text-[11px] font-black tracking-tight leading-tight uppercase truncate">{product.name}</h4>
          <p className="text-[11px] md:text-[12px] font-black tracking-tighter shrink-0">৳{product.price.toLocaleString()}</p>
        </div>
        {product.description && (
          <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest line-clamp-1 italic">
            {product.description}
          </p>
        )}
        {product.colors && <p className="text-[8px] text-gray-400 font-bold tracking-[0.2em] uppercase">{product.colors.length} In Colors</p>}
      </div>
    </div>
  </Reveal>
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
        <button onClick={(e) => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}} className="hover:text-white transition-colors cursor-pointer">Support</button>
        <button onClick={(e) => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
        <button onClick={(e) => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}} className="hover:text-white transition-colors cursor-pointer">Terms of service</button>
        <button onClick={(e) => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}} className="hover:text-white transition-colors cursor-pointer">Return & Exchange Portal</button>
        <button onClick={(e) => {e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});}} className="hover:text-white transition-colors cursor-pointer">Contact Form</button>
      </div>
      
      <div className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium">
        © 2026 - FELICITECLO APPAREL
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

const ShopPage = ({ productsList, onAddToCart, onProductClick, activeCategory, setActiveCategory }: { productsList: Product[], onAddToCart: (p: Product) => void, onProductClick: (p: Product) => void, activeCategory: string, setActiveCategory: (cat: string) => void }) => {
  const categories = ["All", "New Arrivals", "Tops", "T-shirts", "Shirts", "Hoodies", "Pants", "Denims", "Jackets", "Shackets", "Sweaters", "Beanies"];
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 15;

  const filteredProducts = productsList.filter(product => {
    if (activeCategory === "All") return true;
    if (activeCategory === "New Arrivals") return product.isNewArrival;
    return product.category === activeCategory;
  });

  // Reset page when category changes
  useEffect(() => {
    setCurrentPageNum(1);
  }, [activeCategory]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="pt-32 md:pt-48 bg-white min-h-screen">
      <div className="w-full px-4 md:px-8 mb-20">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-4">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Archives</h2>
            <span className="text-xs text-gray-400 font-black mb-1">[{filteredProducts.length} ARTICLES]</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12 max-w-xl leading-loose">
            Precision engineering filtered through aesthetic rebellion. Every piece in the collection is meticulously inspected and verified for quality.
          </p>
        </Reveal>
        
        <Reveal delay={0.2}>
          <div className="flex flex-wrap gap-x-8 gap-y-4 scrollbar-hide overflow-x-auto pb-4 sticky top-24 bg-white/50 backdrop-blur-md z-40">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap pb-2 ${activeCategory === cat ? 'text-black border-b-2 border-black' : 'text-gray-300 hover:text-black'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="w-full px-0">
        <div className="flex flex-wrap justify-between gap-y-16">
          {paginatedProducts.map((product, idx) => (
            <div key={product.id} className="w-[49%] md:w-[32%] lg:w-[24%] xl:w-[19.5%] border-r border-gray-50 last:border-0">
              <ProductCard product={product} onAddToCart={onAddToCart} onClick={onProductClick} />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Reveal>
            <div className="py-40 text-center space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">End of Transmission</p>
              <button onClick={() => setActiveCategory('All')} className="text-xs font-black uppercase underline underline-offset-8 decoration-2">Return to Baseline</button>
            </div>
          </Reveal>
        )}

        {totalPages > 1 && (
          <Reveal delay={0.4}>
            <div className="py-32 flex justify-center items-center gap-12 border-t border-gray-50 mt-24">
              <div className="flex gap-8">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setCurrentPageNum(i + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`text-[11px] font-black pb-1 transition-all ${currentPageNum === i + 1 ? 'border-b-2 border-black' : 'text-gray-300 hover:text-black'}`}
                  >
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
              {currentPageNum < totalPages && (
                <button 
                  onClick={() => {
                    setCurrentPageNum(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-gray-400 hover:text-black transition-colors font-black text-sm"
                >
                  &rarr;
                </button>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
};

// --- App Component ---

export default function App() {
  const categories = ["T-shirts", "Shirts", "Hoodies", "Pants", "Denims", "Sweaters", "Jackets", "Shackets", "Beanies"];
  const [currentPage, setCurrentPage] = useState<'home' | 'shop' | 'product'>('home');
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>(products);

  // Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // For this app, any authenticated user can view admin dashboard for demo purposes
      // In production, we'd check against an 'admins' collection
      setIsAdmin(!!user);
      if (!user) setIsAdminMode(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Orders and Products
  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeProducts = () => {};

    if (isAdmin) {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const qProducts = query(collection(db, 'products'));
      unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
        if (!snapshot.empty) {
          const fbProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
          setProductsList(fbProducts);
        } else {
          setProductsList(products);
        }
      });
    }

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [isAdmin]);

  // Scroll to top on page or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentPage, selectedProduct]);

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

  const addOrUpdateProduct = async (p: any) => {
    try {
      if (p.id) {
        const { id, ...rest } = p;
        const cleanData = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'products', id), cleanData);
      } else {
        const { id, ...rest } = p;
        const cleanData = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => v !== undefined)
        );
        await addDoc(collection(db, 'products'), { ...cleanData, createdAt: serverTimestamp() });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('Terminate this article from inventory?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error(err);
      }
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

  const handleProductClick = (p: Product) => {
    setSelectedProduct(p);
    setCurrentPage('product');
  };

  if (isAdminMode && isAdmin) {
    return <AdminDashboard orders={orders} productsList={productsList} onUpdateStatus={updateOrderStatus} onAddProduct={addOrUpdateProduct} onDeleteProduct={deleteProduct} onClose={() => setIsAdminMode(false)} />;
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
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        categories={categories}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />
      
      <main>
        {currentPage === 'home' ? (
          <>
            <Hero setCurrentPage={setCurrentPage} />
            <Categories onCategorySelect={setSelectedCategory} setCurrentPage={setCurrentPage} />
            <section id="new-arrivals" className="py-24 md:py-32 bg-white px-0">
              <div className="w-full">
                <div className="text-center mb-24 space-y-4 px-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Curated pieces</p>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">New Arrivals</h2>
                  <div className="w-16 h-1 bg-black mx-auto" />
                </div>
                <div className="w-full px-0">
                  <div className="flex flex-wrap justify-between gap-y-12">
                    {productsList.slice(0, 5).map(product => (
                      <div key={product.id} className="w-[49%] md:w-[32%] lg:w-[24%] xl:w-[19.5%]">
                        <ProductCard product={product} onAddToCart={addToCart} onClick={handleProductClick} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-32 flex justify-center px-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => setCurrentPage('shop')}
                  className="px-16 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20" 
                > 
                  View All Products 
                </motion.button>
              </div>
            </section>
          </>
        ) : currentPage === 'shop' ? (
          <ShopPage 
            productsList={productsList} 
            onAddToCart={addToCart} 
            onProductClick={handleProductClick} 
            activeCategory={selectedCategory}
            setActiveCategory={setSelectedCategory}
          />
        ) : (
          selectedProduct && (
            <ProductView 
              product={selectedProduct} 
              productsList={productsList}
              onAddToCart={addToCart} 
              onBack={() => setCurrentPage('shop')} 
              onProductClick={handleProductClick}
            />
          )
        )}
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} onUpdateQty={(id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))} onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} onSuccess={(data) => { setIsCheckoutOpen(false); setOrderSuccess(data); }} totalItems={cart} totalAmount={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)} />
    </div>
  );
}
