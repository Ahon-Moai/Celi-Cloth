import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  Facebook,
  Instagram,
  Twitter,
  ExternalLink,
  Package,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Truck,
  ArrowRight,
  Zap,
  Loader2,
  Sparkles,
  MessageCircle,
  Layers,
  Copy,
  ShieldCheck,
  Trash2,
  Gift,
  Heart,
  Star,
} from "lucide-react";

import { Product, CartItem, Order } from "./types";
import { supabase } from "./lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.VITE_GEMINI_API_KEY ||
    "AIzaSyAf9pkTSkxro6cLdOvngIKPRzu8RAgTB-U",
});

// ─────────────────────────────────────────────
// Gift Add-On Definitions (shared reference)
// ─────────────────────────────────────────────
const GIFT_ADDONS = [
  {
    id: "premium_packaging",
    label: "Premium Gift Packaging",
    sublabel: "Luxury matte-black box, gold-foil seal, satin ribbon",
    price: 100,
    emoji: "🎁",
    color: "from-amber-950 to-yellow-900",
    accent: "#d4a017",
    tag: "BESTSELLER",
  },
  {
    id: "rose_bouquet",
    label: "Rose Bouquet + Wish Letter",
    sublabel: "Hand-tied fresh roses & a personally printed note",
    price: 80,
    emoji: "🌹",
    color: "from-rose-950 to-pink-900",
    accent: "#f43f5e",
    tag: "ROMANTIC",
  },
];

// ─────────────────────────────────────────────
// ProductView
// ─────────────────────────────────────────────
const ProductView = ({
  product,
  productsList,
  onAddToCart,
  onBack,
  onProductClick,
  hasCoupon,
}) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "S");
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0] : "",
  );
  const [activeTab, setActiveTab] = useState("Recommended");
  const [activeAccordion, setActiveAccordion] = useState("details");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    if (Math.abs(touchStartX.current - touchEndX.current) > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveImageIndex((prev) =>
          prev === gallery.length - 1 ? 0 : prev + 1,
        );
      } else {
        setActiveImageIndex((prev) =>
          prev === 0 ? gallery.length - 1 : prev - 1,
        );
      }
    }
    isDragging.current = false;
  };

  const sizes = product.sizes || ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const gallery =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  // ── FIX 1: Added "BOXY FIT T-SHIRTS" key so the correct chart shows per category ──
  const sizeChartImages = {
    Hoodies:
      "https://www.image2url.com/r2/default/images/1777270928450-aa406a06-2c71-4548-ab42-a148066f4b25.jpeg",
    Shirts:
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg",
    "BOXY FIT T-SHIRTS":
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg",
    default:
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg",
  };

  const currentSizeChart =
    sizeChartImages[product.category] || sizeChartImages["default"];

  const relatedProducts = React.useMemo(() => {
    let filtered = productsList.filter((p) => p.id !== product.id);
    if (activeTab === "Best Sellers") return filtered.slice(4, 12);
    else if (activeTab === "New Arrivals")
      return filtered.filter((p) => p.isNewArrival).slice(0, 8);
    return filtered.slice(0, 8);
  }, [activeTab, productsList, product.id]);

  return (
    <div className="bg-white min-h-screen pt-0">
      <AnimatePresence>
        {isSizeChartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-12"
          >
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsSizeChartOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white p-2 md:p-4 rounded-sm shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div
                className="overflow-y-auto flex items-start justify-center bg-white p-4 md:p-8"
                style={{ maxHeight: "calc(90vh - 120px)" }}
              >
                {currentSizeChart ? (
                  <img
                    src={currentSizeChart}
                    alt={`${product.category} Size Chart`}
                    className="max-w-full h-auto object-contain"
                  />
                ) : (
                  <div className="text-[10px] uppercase font-black text-gray-300">
                    Spec Sheet Unavailable
                  </div>
                )}
              </div>
              <div className="p-6 bg-black text-white text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                  {product.category} Guide Specification
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row">
        <div
          className="w-full lg:w-[60%] bg-[#f9f9f9] relative aspect-[4/5] lg:aspect-auto lg:h-screen top-0 lg:sticky overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-100 select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4 pt-26 md:p-12 md:pt-20 transition-all duration-700">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full"
              >
                {gallery[activeImageIndex] ? (
                  <img
                    src={gallery[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[10px] uppercase font-black text-gray-200">
                    No Visual Available
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full transition-all z-20 shadow-xl border border-white/10"
          >
            <ChevronLeft className="w-6 h-6 text-white drop-shadow-md" />
          </button>

          {gallery.length > 1 && (
            <>
              <div className="absolute bottom-12 left-12 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                {activeImageIndex + 1} / {gallery.length}
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 left-8 group z-20">
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === 0 ? gallery.length - 1 : prev - 1,
                    )
                  }
                  className="p-2 hover:bg-black hover:text-white transition-all rounded-full group"
                >
                  <ChevronLeft className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-8 group z-20">
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev === gallery.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="p-2 hover:bg-black hover:text-white transition-all rounded-full group"
                >
                  <ChevronRight className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
                </button>
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeImageIndex === i ? "w-8 bg-black" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 lg:hidden pointer-events-none">
                <motion.p
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm"
                >
                  Swipe to browse
                </motion.p>
              </div>
            </>
          )}
        </div>

        <div className="w-full lg:w-[40%] p-6 md:p-12 space-y-8 md:space-y-12">
          <Reveal>
            <div className="flex justify-between items-start gap-4 md:gap-8">
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight max-w-md">
                {product.name}
              </h1>
              <p className="text-lg md:text-2xl font-black shrink-0">
                ৳{product.price.toLocaleString()}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                  Select Color
                </span>
                {product.colors &&
                  product.colors.length > 0 &&
                  !selectedColor && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 animate-pulse">
                      ← Required
                    </span>
                  )}
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4 p-4 md:p-6 bg-gray-50 rounded-sm">
                {product.colors.map((color, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedColor(color);
                      if (gallery.length > i) setActiveImageIndex(i);
                    }}
                    className={`w-12 h-14 md:w-14 md:h-16 border cursor-pointer hover:ring-2 hover:ring-black transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-black"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                  Select Size
                </span>
                <button
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-[9px] font-black underline uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all"
                >
                  Size Chart
                </button>
              </div>
              <div className="grid grid-cols-7 border border-gray-100">
                {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size) => {
                  const isAvailable = sizes.includes(size);
                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`h-20 flex items-center justify-center text-[11px] font-black transition-all relative border-r last:border-r-0 border-gray-50
                        ${selectedSize === size ? "bg-black text-white" : "hover:bg-gray-50"}
                        ${!isAvailable ? "text-gray-200 cursor-not-allowed italic" : ""}
                      `}
                    >
                      {size}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-white/30 flex items-center justify-center overflow-hidden">
                          <div className="w-[120%] h-[1px] bg-gray-200 rotate-[35deg]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-loose">
                <span className="text-black">Male</span> model is 6' & 70kg,
                wearing size M. <span className="text-black">Female</span> model
                is 5'9" & 48kg, wearing size S.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <button
              onClick={() => {
                if (
                  product.colors &&
                  product.colors.length > 0 &&
                  !selectedColor
                ) {
                  alert("Please select a color before adding to cart.");
                  return;
                }
                onAddToCart(product, selectedSize, selectedColor);
              }}
              className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Add To Cart
            </button>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="border-t border-gray-100">
              <button
                onClick={() =>
                  setActiveAccordion(
                    activeAccordion === "details" ? null : "details",
                  )
                }
                className="w-full flex items-center justify-between py-8 group text-gray-600 hover:text-black transition-colors"
              >
                <div className="flex items-center gap-6">
                  <Package className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Product Details
                  </span>
                </div>
                <Plus
                  className={`w-4 h-4 text-gray-300 transition-all ${
                    activeAccordion === "details"
                      ? "rotate-45"
                      : "group-hover:rotate-90"
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeAccordion === "details" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-8 text-[11px] leading-relaxed text-gray-500 uppercase font-medium whitespace-pre-wrap">
                      {product.description ||
                        "No detailed specifications available."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-gray-100">
              <button
                onClick={() =>
                  setActiveAccordion(
                    activeAccordion === "shipping" ? null : "shipping",
                  )
                }
                className="w-full flex items-center justify-between py-8 group text-gray-600 hover:text-black transition-colors"
              >
                <div className="flex items-center gap-6">
                  <Truck className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Shipping Details
                  </span>
                </div>
                <Plus
                  className={`w-4 h-4 text-gray-300 transition-all ${
                    activeAccordion === "shipping"
                      ? "rotate-45"
                      : "group-hover:rotate-90"
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeAccordion === "shipping" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 space-y-4">
                      <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                        Standard Shipping: 2-4 business days within Dhaka Metro.
                      </p>
                      <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                        Outside Dhaka: 3-7 business days via courier.
                      </p>
                      <p className="text-[11px] leading-relaxed text-gray-500 uppercase font-medium">
                        Cash on Delivery available for all regions.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="bg-white py-40 border-t border-gray-100">
        <div className="text-center mb-24 space-y-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-300">
            Complementary Pieces
          </h2>
          <div className="flex justify-center gap-16">
            {["Recommended", "Best Sellers", "New Arrivals"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 transition-all ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-300 hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 px-0">
          {relatedProducts.map((p) => (
            <div
              key={p.id}
              className="border border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <ProductCard
                product={p}
                onAddToCart={onAddToCart}
                onClick={onProductClick}
                hasCoupon={hasCoupon}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Reveal animation wrapper
// ─────────────────────────────────────────────
const Reveal = ({ children, delay = 0, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────
// Ticker
// ─────────────────────────────────────────────
const Ticker = () => (
  <div className="bg-black text-white text-[10px] md:text-xs py-2 overflow-hidden whitespace-nowrap border-b border-white/10 z-[50] relative">
    <motion.div
      animate={{ x: [0, -2000] }}
      transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      className="inline-block"
    >
      {[...Array(20)].map((_, i) => (
        <span key={i} className="mx-12 uppercase tracking-widest font-medium">
          Felicite™ · SPRING '26 · LIVE NOW · FELICITE CLOTHING · LIMITED
          EDITION · ৳ 1,399 FAST SHIPPING
        </span>
      ))}
    </motion.div>
  </div>
);

// ─────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────
const Navbar = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isAdmin,
  setCurrentPage,
  currentPage,
  categories,
  onCategorySelect,
  selectedCategory,
  searchQuery,
  setSearchQuery,
  onOpenStylist,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] =
    useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isShop = currentPage === "shop" || currentPage === "product";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-[100]">
      <Ticker />
      <div
        className={`w-full transition-all duration-700 ${
          isScrolled || isShop
            ? "bg-white/95 backdrop-blur-md text-black py-3 md:py-4 shadow-sm"
            : "bg-transparent text-white py-5 md:py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between relative">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 bg-white z-[150] flex items-center px-6 gap-6"
              >
                <div className="flex-1 flex items-center gap-4 border-b-2 border-black py-2">
                  <Search className="w-5 h-5 text-black" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="SEARCH PRODUCTS..."
                    className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (currentPage !== "shop") setCurrentPage("shop");
                      onCategorySelect("All");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsSearchOpen(false);
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:opacity-50 transition-opacity"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="md:hidden flex items-center -ml-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 hover:opacity-50 transition-opacity ${
                isScrolled || isShop ? "text-black" : "text-white"
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden md:flex gap-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <button
              onClick={() => {
                setCurrentPage("shop");
                onCategorySelect("All");
                setSearchQuery("");
              }}
              className={`transition-opacity uppercase cursor-pointer ${
                currentPage === "shop" &&
                selectedCategory === "All" &&
                !searchQuery
                  ? `border-b-2 ${
                      isScrolled || isShop ? "border-black" : "border-white"
                    } pb-1`
                  : "hover:opacity-50"
              }`}
            >
              Shop
            </button>
            <div
              className="relative group"
              onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
              onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
            >
              <button
                className={`hover:opacity-50 transition-opacity uppercase cursor-pointer ${
                  currentPage === "shop" && selectedCategory !== "All"
                    ? `border-b-2 ${
                        isScrolled || isShop ? "border-black" : "border-white"
                      } pb-1`
                    : ""
                }`}
              >
                Categories
              </button>
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
                            setCurrentPage("shop");
                            setSearchQuery("");
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
            <button
              onClick={onOpenStylist}
              className={`transition-all uppercase cursor-pointer hover:text-blue-600 flex items-center gap-2 group ${
                isScrolled || isShop ? "text-black" : "text-white"
              }`}
            >
              <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
              AI Stylist
            </button>
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
            onClick={() => {
              setCurrentPage("home");
              setSearchQuery("");
              onCategorySelect("All");
            }}
          >
            <motion.h1
              initial={{ letterSpacing: "0.2em", opacity: 0 }}
              animate={{ letterSpacing: "-0.05em", opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`text-xl md:text-3xl font-black uppercase whitespace-nowrap ${
                isScrolled || isShop ? "text-black" : "text-white"
              }`}
            >
              Felicite
              <span className="text-[10px] align-top font-bold">™</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={onOpenStylist}
              className="flex items-center gap-2 group hover:opacity-100 transition-opacity"
            >
              <Sparkles
                className={`w-5 h-5 group-hover:animate-pulse ${
                  isScrolled || isShop ? "text-black" : "text-white"
                }`}
              />
              <span
                className={`hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] ${
                  isScrolled || isShop ? "text-black/80" : "text-white/80"
                }`}
              >
                AI_STYLIST [V.1]
              </span>
            </button>
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-2 group hover:opacity-100 transition-opacity p-2 rounded-full ${
                isAdmin
                  ? "text-green-500"
                  : isScrolled || isShop
                    ? "text-black hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span
                className={`hidden xl:block text-[10px] font-black uppercase tracking-[0.2em] ${
                  isScrolled || isShop ? "text-black/80" : "text-white/80"
                }`}
              >
                {isAdmin ? "Admin" : "Account"}
              </span>
            </button>
            <div className="relative cursor-pointer group" onClick={onOpenCart}>
              <ShoppingBag
                className={`w-6 h-6 md:w-5 h-5 group-hover:opacity-50 transition-opacity ${
                  isScrolled || isShop ? "text-black" : "text-white"
                }`}
              />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 -right-1 text-[8px] w-4 h-4 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-sm font-black ${
                    isScrolled || isShop
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  <span className="text-xl font-black uppercase tracking-tighter">
                    FELICITE<span className="text-[10px] align-top">™</span>
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 -mr-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex flex-col gap-10">
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setCurrentPage("shop");
                      setIsMobileMenuOpen(false);
                      onCategorySelect("All");
                      setSearchQuery("");
                    }}
                    className="text-4xl font-black uppercase tracking-tighter text-left hover:text-gray-400 transition-colors"
                  >
                    Shop
                  </motion.button>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                      Categories
                    </p>
                    <div className="flex flex-col gap-4">
                      {categories.map((cat, i) => (
                        <motion.button
                          key={cat}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          onClick={() => {
                            onCategorySelect(cat);
                            setCurrentPage("shop");
                            setIsMobileMenuOpen(false);
                            setSearchQuery("");
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
                    transition={{ delay: 0.6 }}
                    onClick={() => {
                      setIsSearchOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-4xl font-black uppercase tracking-tighter text-left hover:text-gray-400 transition-colors flex items-center gap-3"
                  >
                    <Search className="w-8 h-8" />
                    Search
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => {
                      onOpenStylist();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-4xl font-black uppercase tracking-tighter text-left text-blue-600 hover:text-blue-400 transition-colors flex items-center gap-3"
                  >
                    <Sparkles className="w-8 h-8" />
                    AI Stylist
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => {
                      onOpenAdmin();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-4xl font-black uppercase tracking-tighter text-left transition-colors flex items-center gap-3 ${
                      isAdmin ? "text-green-600" : "hover:text-gray-400"
                    }`}
                  >
                    {isAdmin && <ShieldCheck className="w-8 h-8" />}
                    {isAdmin ? "Admin Console" : "Account"}
                  </motion.button>
                </nav>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  © 2026 Felicite™
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const validatePhone = (num) => /^\d{11}$/.test(num.replace(/\D/g, ""));

// ─────────────────────────────────────────────
// AdminDashboard
// ─────────────────────────────────────────────
const AdminDashboard = ({
  orders,
  productsList,
  categories,
  adminEmail,
  onUpdateStatus,
  onDeleteOrder,
  onAddProduct,
  onDeleteProduct,
  onUpdateCategories,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [jsonInput, setJsonInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [newCatName, setNewCatName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    category: categories[0] || "T-shirts",
    image: "",
    gallery: [],
    colors: [],
    sizes: ["S", "M", "L"],
    description: "",
    isNewArrival: true,
    soldOut: false,
  });

  const [newColor, setNewColor] = useState("#000000");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  const uploadImage = async (file, folder) => {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handlePrimaryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress("Uploading primary image...");
    const url = await uploadImage(file, "primary");
    if (url) setProductForm((prev) => ({ ...prev, image: url }));
    setIsUploading(false);
    setUploadProgress("");
  };

  const handleGalleryImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} image(s)...`);
    const urls = await Promise.all(files.map((f) => uploadImage(f, "gallery")));
    const validUrls = urls.filter(Boolean);
    setProductForm((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...validUrls],
    }));
    setIsUploading(false);
    setUploadProgress("");
  };

  const handleAddGalleryUrl = () => {
    if (newGalleryUrl.trim()) {
      setProductForm((prev) => ({
        ...prev,
        gallery: [...prev.gallery, newGalleryUrl.trim()],
      }));
      setNewGalleryUrl("");
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: 0,
      category: "T-shirts",
      image: "",
      gallery: [],
      colors: [],
      sizes: ["S", "M", "L"],
      description: "",
      isNewArrival: true,
      soldOut: false,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.image,
      gallery: p.gallery || [],
      colors: p.colors || [],
      sizes: p.sizes || ["S", "M", "L"],
      description: p.description || "",
      isNewArrival: p.isNewArrival || false,
      soldOut: p.soldOut || false,
    });
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    onAddProduct({ ...productForm, id: editingProduct?.id });
    setIsProductModalOpen(false);
  };

  const handleBulkImport = async () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) {
        alert("JSON must be an array.");
        return;
      }
      const rows = data.map((p) => ({
        name: p.name,
        price: p.price,
        currency: p.currency || "BDT",
        category: p.category,
        image: p.image || null,
        gallery: p.gallery || [],
        colors: p.colors || [],
        sizes: p.sizes || ["S", "M", "L"],
        description: p.description || null,
        is_new_arrival: p.isNewArrival || p.is_new_arrival || false,
        sold_out: p.soldOut || p.sold_out || false,
        stock: p.stock ?? null,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("products").insert(rows);
      if (error) {
        alert("Import failed: " + error.message);
      } else {
        alert(`${rows.length} products imported successfully.`);
        setJsonInput("");
      }
    } catch (e) {
      alert("Invalid JSON structure.");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status === orderFilter;
  });

  const availableSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  const toggleSize = (size) => {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const removeGalleryItem = (index) => {
    setProductForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const addColor = () => {
    setProductForm((prev) => ({ ...prev, colors: [...prev.colors, newColor] }));
  };

  const removeColor = (index) => {
    setProductForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative bg-white w-full max-w-2xl p-6 md:p-10 shadow-2xl overflow-y-auto h-full md:h-auto md:max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-widest">
                  {editingProduct ? "Edit Article" : "New Article"}
                </h3>
                <X
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => setIsProductModalOpen(false)}
                />
              </div>
              <form onSubmit={handleSubmitProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Article Title
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Value (৳)
                        </label>
                        <input
                          required
                          type="number"
                          className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold"
                          value={productForm.price || ""}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Class
                        </label>
                        <select
                          className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold uppercase"
                          value={productForm.category}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              category: e.target.value,
                            })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Primary Image
                      </label>
                      <label
                        className={`flex items-center justify-center gap-3 border-2 border-dashed py-6 cursor-pointer transition-colors ${
                          isUploading
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-black"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePrimaryImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && uploadProgress.includes("primary") ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
                            {uploadProgress}
                          </span>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Upload from device
                            </span>
                          </>
                        )}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                          or paste URL
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <input
                        type="text"
                        placeholder="https://..."
                        className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-mono"
                        value={productForm.image}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            image: e.target.value,
                          })
                        }
                      />
                      {productForm.image && (
                        <div className="aspect-[4/5] bg-gray-50 border border-gray-100 overflow-hidden relative">
                          <img
                            src={productForm.image}
                            className="w-full h-full object-cover"
                            alt="Preview"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setProductForm((prev) => ({ ...prev, image: "" }))
                            }
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Sizes Available
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`px-4 py-2 text-[10px] font-black border transition-all ${
                              productForm.sizes.includes(size)
                                ? "bg-black text-white border-black"
                                : "border-gray-100 text-gray-300 hover:border-black hover:text-black"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Gallery Images
                      </label>
                      <label
                        className={`flex items-center justify-center gap-3 border-2 border-dashed py-5 cursor-pointer transition-colors ${
                          isUploading && uploadProgress.includes("image(s)")
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-black"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleGalleryImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && uploadProgress.includes("image(s)") ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
                            {uploadProgress}
                          </span>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Upload multiple images
                            </span>
                          </>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="OR PASTE GALLERY URL"
                          className="flex-1 border-b border-gray-100 py-2 text-xs outline-none focus:border-black font-mono uppercase"
                          value={newGalleryUrl}
                          onChange={(e) => setNewGalleryUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleAddGalleryUrl}
                          className="px-4 py-2 border border-black text-[9px] font-black uppercase"
                        >
                          Add
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {productForm.gallery.map((url, i) => (
                          <div
                            key={i}
                            className="aspect-square relative group bg-gray-50 border border-gray-100"
                          >
                            {url ? (
                              <img
                                src={url}
                                className="w-full h-full object-cover"
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-200 uppercase">
                                Void
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeGalleryItem(i)}
                              className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Color Palette
                      </label>
                      <div className="flex gap-4 items-center mb-4">
                        <input
                          type="color"
                          className="w-10 h-10 border-none outline-none cursor-pointer"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addColor}
                          className="px-4 py-2 border border-black text-[10px] font-black uppercase"
                        >
                          Assign Color
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {productForm.colors.map((color, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-gray-50 px-2 py-1 border border-gray-100"
                          >
                            <div
                              className="w-4 h-4 border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-500"
                              onClick={() => removeColor(i)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Design Specifications
                      </label>
                      <textarea
                        rows={4}
                        className="w-full border border-gray-100 p-4 text-xs outline-none focus:border-black resize-none"
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 pt-4 border-t border-gray-50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={productForm.isNewArrival}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          isNewArrival: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-black"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                      New Arrival Badge ✦
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={productForm.soldOut}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          soldOut: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-red-500"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-500 transition-colors">
                      Depleted
                    </span>
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isUploading
                      ? uploadProgress || "Uploading..."
                      : editingProduct
                        ? "Commit Changes"
                        : "Initialize Article"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-12 py-6 border border-gray-100 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gray-50"
                  >
                    Abort
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[450] w-72 bg-black text-white p-8 flex flex-col justify-between transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-widest uppercase">
              Console
            </h2>
            <X
              className="w-6 h-6 cursor-pointer md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
          <div className="space-y-6">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-black">
              Management
            </div>
            <nav className="space-y-4">
              {[
                {
                  id: "orders",
                  label: "ORDERS",
                  icon: <Package className="w-4 h-4" />,
                },
                {
                  id: "inventory",
                  label: "INVENTORY",
                  icon: <ShoppingBag className="w-4 h-4" />,
                },
                {
                  id: "json",
                  label: "JSON PORTAL",
                  icon: <ExternalLink className="w-4 h-4" />,
                },
                {
                  id: "categories",
                  label: "CATEGORIES",
                  icon: <Layers className="w-4 h-4" />,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === item.id ? "border-r-4 border-white pr-4 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-black text-xs">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase truncate">
                {adminEmail}
              </p>
              <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full py-4 border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-[10] bg-gray-50/95 backdrop-blur-md p-6 md:px-12 md:py-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              {activeTab === "orders"
                ? "Live Orders"
                : activeTab === "inventory"
                  ? "Inventory"
                  : activeTab === "categories"
                    ? "Distinction Classes"
                    : "JSON Portal"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "inventory" && (
              <button
                onClick={handleOpenAddModal}
                className="bg-black text-white p-3 md:px-6 md:py-3 rounded-full md:rounded-none flex items-center gap-2"
              >
                <Plus className="w-5 h-5 md:w-3 md:h-3" />
                <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">
                  Insert Article
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 md:px-6 md:py-3 bg-white border border-gray-200 rounded-full md:rounded-none flex items-center gap-2 hover:bg-gray-50"
            >
              <ExternalLink className="w-5 h-5 md:w-3 md:h-3" />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em]">
                Exit
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-12 pb-32">
          {activeTab === "orders" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12">
                {[
                  {
                    label: "Cycle Volume",
                    value: orders.length,
                    icon: (
                      <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-50" />
                    ),
                    color: "",
                  },
                  {
                    label: "Action Required",
                    value: orders.filter((o) => o.status === "pending").length,
                    icon: (
                      <Clock className="w-8 h-8 md:w-10 md:h-10 text-gray-50" />
                    ),
                    color: "text-orange-500",
                  },
                  {
                    label: "Net Liquidity",
                    value: `৳ ${orders.reduce((acc, o) => (o.status !== "cancelled" ? acc + (o.grand_total || o.total_amount || 0) : acc), 0).toLocaleString()}`,
                    icon: (
                      <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-50" />
                    ),
                    color: "text-green-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                  >
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        {stat.label}
                      </p>
                      <p
                        className={`text-2xl md:text-3xl font-black ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    {stat.icon}
                  </div>
                ))}
              </div>

              {/* Orders table (desktop) */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-4">
                    {["all", "pending", "confirmed", "shipped"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setOrderFilter(f)}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${orderFilter === f ? "bg-black text-white border-black" : "text-gray-400 border-gray-100 hover:border-black hover:text-black"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">
                      <tr>
                        <th className="px-8 py-6">ID & Date</th>
                        <th className="px-8 py-6">Customer</th>
                        <th className="px-8 py-6">Items</th>
                        <th className="px-8 py-6">Total</th>
                        <th className="px-8 py-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="group hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-8 py-6">
                            <p className="font-black text-xs uppercase">
                              {order.customer_info?.firstName}{" "}
                              {order.customer_info?.lastName}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">
                              📱 {order.customer_info?.phone}
                            </p>
                            {order.customer_info?.altPhone && (
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                📱 Alt: {order.customer_info.altPhone}
                              </p>
                            )}
                            <div className="mt-2 text-[9px] text-gray-400 font-medium max-w-[200px]">
                              {order.customer_info?.address},{" "}
                              {order.customer_info?.city}
                            </div>
                            {order.customer_info?.designDetails && (
                              <div className="mt-2 px-2 py-1 bg-yellow-50 border border-yellow-100 text-[9px] font-bold text-yellow-700 max-w-[200px]">
                                ✏ {order.customer_info.designDetails}
                              </div>
                            )}
                            {order.customer_info?.paymentInfo && (
                              <div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-100 text-[9px] font-black text-blue-700 font-mono uppercase">
                                TXN: {order.customer_info.paymentInfo}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-gray-700">
                                    {item.name} [{item.selectedSize}] x
                                    {item.quantity}
                                  </p>
                                  {item.selectedColor && (
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="inline-block w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                                        style={{
                                          backgroundColor: item.selectedColor,
                                        }}
                                      />
                                      <span className="text-[9px] font-mono text-gray-500">
                                        {item.selectedColor}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* ── Gift Add-Ons display in admin ── */}
                            {order.add_ons && order.add_ons.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-1">
                                  🎁 Gift Add-Ons
                                </p>
                                {order.add_ons.map((addon, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-100 rounded"
                                  >
                                    <span className="text-sm">
                                      {addon.emoji}
                                    </span>
                                    <div>
                                      <p className="text-[9px] font-black text-purple-700 uppercase">
                                        {addon.label}
                                      </p>
                                      <p className="text-[8px] text-purple-500 font-bold">
                                        +৳{addon.price}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-sm">
                              ৳
                              {order.grand_total?.toLocaleString() ||
                                order.total_amount?.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                              Delivery: ৳{order.delivery_charge || 0}
                            </p>
                            {order.add_ons_total > 0 && (
                              <p className="text-[9px] text-purple-500 font-bold uppercase mt-0.5">
                                Gift Extras: +৳{order.add_ons_total}
                              </p>
                            )}
                            {order.discount_amount > 0 && (
                              <p className="text-[9px] text-green-500 font-bold uppercase mt-0.5">
                                Discount: -৳
                                {order.discount_amount?.toLocaleString()}
                              </p>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  onUpdateStatus(order.id, e.target.value)
                                }
                                className={`bg-transparent border-b-2 text-[10px] uppercase font-black p-1 outline-none cursor-pointer ${
                                  order.status === "pending"
                                    ? "border-orange-500 text-orange-600"
                                    : order.status === "confirmed"
                                      ? "border-blue-500 text-blue-600"
                                      : order.status === "shipped"
                                        ? "border-purple-500 text-purple-600"
                                        : order.status === "delivered"
                                          ? "border-green-500 text-green-600"
                                          : "border-gray-300 text-gray-400"
                                }`}
                              >
                                <option value="pending">Authorize</option>
                                <option value="confirmed">Confirm</option>
                                <option value="shipped">Dispatch</option>
                                <option value="delivered">Liquidate</option>
                                <option value="cancelled">Abort</option>
                              </select>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `DELETE ORDER #${order.id?.slice(0, 8).toUpperCase()}?`,
                                    )
                                  )
                                    onDeleteOrder(order.id);
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="p-24 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">
                    System Idle — No Data
                  </div>
                )}
              </div>

              {/* Orders cards (mobile) */}
              <div className="md:hidden space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-4">
                  {["all", "pending", "confirmed", "shipped"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border whitespace-nowrap transition-all ${orderFilter === f ? "bg-black text-white border-black" : "text-gray-400 border-gray-100 bg-white"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-mono text-blue-600 font-black text-sm">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </p>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          onUpdateStatus(order.id, e.target.value)
                        }
                        className="bg-gray-50 border border-gray-100 text-[10px] uppercase font-black px-3 py-2 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase">
                        {order.customer_info?.firstName}{" "}
                        {order.customer_info?.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        📱 {order.customer_info?.phone}
                      </p>
                      {order.customer_info?.altPhone && (
                        <p className="text-[10px] text-gray-400">
                          📱 Alt: {order.customer_info.altPhone}
                        </p>
                      )}
                      <div className="mt-2 text-[9px] text-gray-400 font-medium">
                        {order.customer_info?.address},{" "}
                        {order.customer_info?.city}
                      </div>
                      {order.customer_info?.paymentInfo && (
                        <p className="text-[10px] font-black font-mono text-blue-600 mt-1">
                          TXN: {order.customer_info.paymentInfo}
                        </p>
                      )}
                      {order.customer_info?.designDetails && (
                        <p className="text-[10px] text-yellow-700 bg-yellow-50 px-2 py-0.5 mt-1">
                          ✏ {order.customer_info.designDetails}
                        </p>
                      )}
                    </div>
                    {/* Gift add-ons on mobile */}
                    {order.add_ons && order.add_ons.length > 0 && (
                      <div className="space-y-1">
                        {order.add_ons.map((addon, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-100 rounded text-[9px] font-black text-purple-700"
                          >
                            <span>{addon.emoji}</span>
                            {addon.label}{" "}
                            <span className="text-purple-400">
                              +৳{addon.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <p className="font-black text-lg">
                        ৳
                        {order.grand_total?.toLocaleString() ||
                          order.total_amount?.toLocaleString()}
                      </p>
                      {order.add_ons_total > 0 && (
                        <p className="text-[9px] text-purple-500 font-bold">
                          incl. ৳{order.add_ons_total} gifts
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "inventory" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-1 md:gap-2">
              {productsList.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-100 p-4 md:p-6 flex flex-col group hover:shadow-2xl transition-all duration-700"
                >
                  <div className="aspect-[4/5] bg-gray-50 mb-6 overflow-hidden relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        className={`w-full h-full object-cover transition-all duration-700 ${product.soldOut ? "grayscale scale-105 opacity-50" : "group-hover:scale-110"}`}
                        alt={product.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-200 uppercase">
                        No Image
                      </div>
                    )}
                    {product.soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] -rotate-12">
                          VOID
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="text-[11px] font-black uppercase leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-[10px] font-black">
                          ৳{product.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                        {product.category}
                      </p>
                      {product.isNewArrival && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                          <Star className="w-2 h-2" />
                          New Arrival
                        </div>
                      )}
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                      <span
                        className={`text-[9px] font-black uppercase ${product.soldOut ? "text-red-500" : "text-green-500"}`}
                      >
                        {product.soldOut ? "Depleted" : "Active"}
                      </span>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="text-[9px] font-black uppercase border-b border-black pb-1 hover:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="text-[9px] font-black uppercase border-b border-red-500 text-red-500 pb-1 hover:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-12 max-w-2xl">
              <div className="bg-white p-8 border border-gray-100 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                  Initialize New Class
                </h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Class Name (e.g. OUTERWEAR)"
                    className="flex-1 border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold "
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (newCatName.trim()) {
                        onUpdateCategories([...categories, newCatName.trim()]);
                        setNewCatName("");
                      }
                    }}
                    className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest"
                  >
                    Append
                  </button>
                </div>
              </div>
              <div className="bg-white border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Distinction Registry
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {categories.map((cat, i) => (
                    <div
                      key={i}
                      className="p-6 flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className="text-xs font-black tracking-widest">
                        {cat}
                      </span>
                      <div className="flex gap-6">
                        <button
                          onClick={() => {
                            const n = prompt("New name", cat);
                            if (n && n !== cat) {
                              const nc = [...categories];
                              nc[i] = n;
                              onUpdateCategories(nc);
                            }
                          }}
                          className="text-[9px] font-black uppercase text-blue-600 hover:opacity-50"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Erase this class?"))
                              onUpdateCategories(
                                categories.filter((_, idx) => idx !== i),
                              );
                          }}
                          className="text-[9px] font-black uppercase text-red-500 hover:opacity-50"
                        >
                          Erase
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "json" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Current JSON
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(productsList, null, 2),
                      );
                      alert("Copied to clipboard");
                    }}
                    className="text-[9px] font-black uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
                  >
                    Copy JSON
                  </button>
                </div>
                <div className="bg-black text-green-500 p-6 md:p-8 rounded-sm font-mono text-[10px] h-[300px] md:h-[500px] overflow-auto">
                  <pre>{JSON.stringify(productsList, null, 2)}</pre>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-loose">
                  Copy → overwrite <code>src/data/products.json</code> →
                  redeploy.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                  Bulk Import
                </h3>
                <textarea
                  placeholder="PASTE JSON HERE"
                  className="w-full bg-white border border-gray-100 p-6 md:p-8 font-mono text-[10px] h-[300px] md:h-[500px] outline-none focus:border-black resize-none"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <button
                  onClick={handleBulkImport}
                  className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em]"
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

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────
const Hero = ({ setCurrentPage }) => {
  const slides = [
    {
      src: "https://res.cloudinary.com/deyatjand/image/upload/f_auto,q_auto:good,w_1400/v1778565273/banner_2_lhf4wl.webp",
      bg: "#111110",
    },
    {
      src: "https://res.cloudinary.com/deyatjand/image/upload/f_auto,q_auto:good,w_1400/v1778565271/banner_1_lajlng.webp",
      bg: "#131210",
    },
    {
      src: "https://res.cloudinary.com/deyatjand/image/upload/f_auto,q_auto:good,w_1400/v1778565261/banner_3_oaayvx.webp",
      bg: "#101113",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [fullyLoaded, setFullyLoaded] = useState([false, false, false]);

  // Preload ALL 3 images in parallel the moment component mounts
  useEffect(() => {
    slides.forEach((slide, i) => {
      const img = new window.Image();
      img.src = slide.src;
      img.onload = () =>
        setFullyLoaded((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % slides.length),
      4500,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 1.2, ease: "easeInOut" },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 1.0, ease: "easeInOut" },
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Brand color — renders in 0ms, no network needed */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: slides[activeIndex].bg }}
          />

          {/* Full image fades in once loaded */}
          <img
            src={slides[activeIndex].src}
            alt={`Felicite Collection ${activeIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
            fetchPriority={activeIndex === 0 ? "high" : "low"}
            decoding="async"
            loading="eager"
            style={{
              opacity: fullyLoaded[activeIndex] ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          />

          <div className="absolute inset-0 bg-black/25" />
        </motion.div>
      </AnimatePresence>

      {/* Progress bars */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 hidden md:flex gap-2 z-20">
        {slides.map((_, i) => (
          <div
            key={i}
            className="relative h-[2px] bg-white/30 overflow-hidden"
            style={{
              width: i === activeIndex ? "48px" : "24px",
              transition: "width 0.6s ease",
            }}
          >
            {i === activeIndex && (
              <motion.div
                className="absolute inset-y-0 left-0 bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.5, ease: "linear" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Hero copy */}
      <div className="absolute bottom-12 left-6 md:bottom-16 md:left-24 text-white space-y-4 md:space-y-6 z-20">
        <p className="text-sm md:text-lg font-bold uppercase tracking-tight">
          SPRING'26
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight uppercase leading-[0.9]">
          COLLECTION IS LIVE
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 text-[14px] md:text-xl font-bold tracking-tight uppercase mt-4">
          <button
            onClick={() => setCurrentPage("shop")}
            className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all cursor-pointer"
          >
            Surf Spring'26
          </button>
          <button
            onClick={() => setCurrentPage("shop")}
            className="underline underline-offset-8 decoration-2 hover:opacity-70 transition-all cursor-pointer"
          >
            Shop Now
          </button>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────
const Categories = ({ onCategorySelect, setCurrentPage }) => (
  <section className="grid grid-cols-1 md:grid-cols-3 w-full h-[90vh] md:h-[100vh]">
    {[
      {
        cat: "BOXY FIT T-SHIRTS",
        src: "https://res.cloudinary.com/deyatjand/image/upload/v1778566368/image_copstz.webp",
        label: "BOXY FIT T-SHIRTS",
      },
      {
        cat: "Hoodies",
        src: "https://res.cloudinary.com/deyatjand/image/upload/v1778566411/image-1_vso3n4.webp",
        label: "Hoodies",
      },
      {
        cat: "Shirts",
        src: "https://res.cloudinary.com/deyatjand/image/upload/v1778566416/image-2_jvladm.webp",
        label: "Shirts",
      },
    ].map((item, i) => (
      <motion.div
        key={item.cat}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="relative group overflow-hidden cursor-pointer"
        onClick={() => {
          onCategorySelect(item.cat);
          setCurrentPage("shop");
        }}
      >
        <img
          src={item.src}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          alt={item.label}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white">
          <h3 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
            {item.label}
          </h3>
        </div>
      </motion.div>
    ))}
  </section>
);

// ─────────────────────────────────────────────
// ProductCard — with gallery hover effect
// ─────────────────────────────────────────────
const ProductCard = ({ product, onAddToCart, onClick, hasCoupon }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasSecondImage = product.gallery && product.gallery.length > 1;

  return (
    <Reveal y={40}>
      <div
        className="group relative cursor-pointer w-full"
        onClick={() => onClick?.(product)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full aspect-[2/3] md:aspect-[3/4] lg:aspect-auto md:h-[470px] overflow-hidden bg-[#f9f9f9] mb-4 border border-gray-200">
          {product.image ? (
            <>
              {/* Primary image */}
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-contain absolute inset-0 transition-all duration-700 ${
                  isHovered && hasSecondImage
                    ? "opacity-0 scale-105"
                    : "opacity-100 scale-100 group-hover:scale-105"
                }`}
                referrerPolicy="no-referrer"
              />
              {/* Secondary hover image */}
              {hasSecondImage && (
                <img
                  src={product.gallery[1]}
                  alt={`${product.name} alt view`}
                  className={`w-full h-full object-contain absolute inset-0 transition-all duration-700 ${
                    isHovered
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.03]"
                  }`}
                  referrerPolicy="no-referrer"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-200">
                No Visual
              </span>
            </div>
          )}

          <div className="absolute top-0 left-0 flex flex-col gap-1 items-start z-10">
            {product.soldOut && (
              <div className="bg-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight text-red-500">
                Sold Out
              </div>
            )}
            {product.isNewArrival && (
              <div className="bg-black text-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight whitespace-nowrap flex items-center gap-1">
                <Star className="w-2.5 h-2.5" />
                New Arrival
              </div>
            )}
            {hasCoupon && (
              <div className="bg-[#024941] text-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight whitespace-nowrap flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                10% OFF
              </div>
            )}
          </div>

          {/* Gallery indicator dots */}
          {hasSecondImage && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${isHovered ? "w-3 bg-gray-400" : "w-5 bg-black"}`}
              />
              <div
                className={`h-1 rounded-full transition-all duration-500 ${isHovered ? "w-5 bg-black" : "w-3 bg-gray-300"}`}
              />
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!product.soldOut)
                onAddToCart(product, product.sizes?.[0], product.colors?.[0]);
            }}
            disabled={product.soldOut}
            className={`absolute bottom-4 left-4 right-4 py-4 bg-black text-white text-[9px] uppercase font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 ${product.soldOut ? "hidden" : ""} shadow-2xl`}
          >
            Add to Bag
          </button>
        </div>
        <div className="space-y-1.5 px-3 md:px-4 pb-4">
          <div className="flex justify-between items-baseline gap-1 md:gap-2">
            <h4 className="text-[10px] md:text-[11px] font-black tracking-tight leading-tight uppercase truncate flex-1">
              {product.name}
            </h4>
            <p className="text-[10px] md:text-[12px] font-black tracking-tighter shrink-0">
              ৳{product.price.toLocaleString()}
            </p>
          </div>
          {product.colors && (
            <p className="text-[8px] text-gray-400 font-bold tracking-[0.2em] uppercase">
              {product.colors.length} In Colors
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
};

// ─────────────────────────────────────────────
// ShopPage
// ─────────────────────────────────────────────
const ShopPage = ({
  productsList,
  onAddToCart,
  onProductClick,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  categoriesList,
  hasCoupon,
}) => {
  const categories = ["All", "New Arrivals", ...categoriesList];
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 15;

  const filteredProducts = productsList.filter((product) => {
    const prodCat = (product.category || "").trim().toLowerCase();
    const activeCat = activeCategory.trim().toLowerCase();
    const matchesCategory =
      activeCategory === "All" ||
      (activeCategory === "New Arrivals"
        ? product.isNewArrival
        : prodCat === activeCat);
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      product.name.toLowerCase().includes(searchLower) ||
      (product.description &&
        product.description.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    setCurrentPageNum(1);
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="pt-32 md:pt-48 bg-white min-h-screen">
      <div className="w-full px-4 md:px-8 mb-20">
        <Reveal>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              {searchQuery ? `Searching: ${searchQuery}` : "Archives"}
            </h2>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                [ Clear Search ]
              </button>
            )}
            <span className="text-xs text-gray-400 font-black mb-1">
              [{filteredProducts.length} ARTICLES]
            </span>
          </div>
        </Reveal>
        {!searchQuery && (
          <Reveal delay={0.2}>
            <div className="flex gap-x-6 md:gap-x-8 overflow-x-auto pb-4 sticky top-[72px] md:top-24 bg-white/80 backdrop-blur-md z-40 px-1 -mx-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all cursor-pointer whitespace-nowrap pb-2 ${activeCategory === cat ? "text-black border-b-2 border-black" : "text-gray-300 hover:text-black"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <div className="w-full px-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="border border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onClick={onProductClick}
                hasCoupon={hasCoupon}
              />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Reveal>
            <div className="py-40 text-center space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">
                No matches found
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="text-xs font-black uppercase underline underline-offset-8 decoration-2"
              >
                Return to Baseline
              </button>
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
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`text-[11px] font-black pb-1 transition-all ${currentPageNum === i + 1 ? "border-b-2 border-black" : "text-gray-300 hover:text-black"}`}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CartDrawer
// ─────────────────────────────────────────────
const CartDrawer = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onUpdateQty,
  onCheckout,
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
        >
          <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">
              Your Bag ({items.length})
            </h3>
            <X
              className="w-6 h-6 cursor-pointer hover:rotate-90 transition-transform"
              onClick={onClose}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <ShoppingBag className="w-16 h-16 text-gray-100" />
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                  Your bag is empty
                </p>
                <button
                  onClick={onClose}
                  className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              items.map((item) => {
                const uid = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
                return (
                  <div key={uid} className="flex gap-6">
                    <div className="w-24 h-32 bg-gray-50 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                          alt={item.name}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-[12px] font-black uppercase tracking-tight leading-tight">
                            {item.name}
                          </h4>
                          <button onClick={() => onRemove(uid)}>
                            <X className="w-4 h-4 text-gray-300 hover:text-black" />
                          </button>
                        </div>
                        {item.selectedSize && (
                          <span className="text-[8px] font-black text-gray-400 uppercase border border-gray-100 px-2 py-0.5">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        <p className="text-[11px] font-bold text-gray-500">
                          ৳{item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-100 rounded-sm">
                          <button
                            onClick={() => onUpdateQty(uid, -1)}
                            className="px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 text-[11px] font-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQty(uid, 1)}
                            className="px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[12px] font-black">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {items.length > 0 && (
            <div className="p-6 md:p-8 border-t border-gray-50 space-y-6 bg-gray-50/50">
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                <span>Bag Total</span>
                <span>
                  ৳
                  {items
                    .reduce((acc, i) => acc + i.price * i.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em]"
              >
                Proceed to Checkout
              </button>
              <p className="text-[9px] text-center text-gray-400 uppercase tracking-widest font-bold">
                Free delivery on orders over ৳5,000
              </p>
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────
// CheckoutModal — with Gift Add-Ons section
// ─────────────────────────────────────────────
const CheckoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  totalItems,
  totalAmount,
  onUpdateItem,
  hasCoupon,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    paymentInfo: "",
    designDetails: "",
    deliveryZone: "inside",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [altPhoneError, setAltPhoneError] = useState("");
  const [copiedStatus, setCopiedStatus] = useState(null);

  useEffect(() => {
    if (hasCoupon && appliedDiscount === 0) {
      setAppliedDiscount(0.1);
      setCouponCode("new10");
    }
  }, [hasCoupon, appliedDiscount]);

  useEffect(() => {
    const cityLower = (formData.city || "").toLowerCase();
    if (cityLower.length > 2) {
      setFormData((prev) => ({
        ...prev,
        deliveryZone: cityLower.includes("dhaka") ? "inside" : "outside",
      }));
    }
  }, [formData.city]);

  const deliveryCharge = formData.deliveryZone === "inside" ? 80 : 150;
  const discountAmount = totalAmount * appliedDiscount;
  const addOnTotal = GIFT_ADDONS.filter((a) =>
    selectedAddOns.includes(a.id),
  ).reduce((acc, a) => acc + a.price, 0);
  const grandTotal = totalAmount + deliveryCharge - discountAmount + addOnTotal;

  const toggleAddOn = (id) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "new10") {
      setAppliedDiscount(0.1);
      alert('Coupon "new10" applied! 10% off.');
    } else {
      alert("Invalid coupon code.");
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(type);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleSubmit = async (method = "COD") => {
    let hasError = false;
    if (!validatePhone(formData.phone)) {
      setPhoneError("Must be 11 digits");
      hasError = true;
    }
    if (!formData.altPhone || !validatePhone(formData.altPhone)) {
      setAltPhoneError("Must be 11 digits");
      hasError = true;
    }
    if (hasError) return;
    setLoading(true);
    try {
      const selectedAddOnDetails = GIFT_ADDONS.filter((a) =>
        selectedAddOns.includes(a.id),
      );
      const orderData = {
        customer_info: formData,
        items: totalItems,
        total_amount: totalAmount,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        add_ons: selectedAddOnDetails,
        add_ons_total: addOnTotal,
        grand_total: grandTotal,
        coupon_used: appliedDiscount > 0 ? couponCode : null,
        status: "pending",
        payment_method: method,
        created_at: new Date().toISOString(),
      };
      const { error: insertError } = await supabase
        .from("orders")
        .insert([orderData]);
      if (insertError) throw insertError;
      if (method === "WhatsApp") {
        const productSummary = totalItems
          .map(
            (i) =>
              `• ${i.name} (${i.selectedColor || "Default"}) [Size: ${i.selectedSize}] x${i.quantity}`,
          )
          .join("%0A");
        const addOnSummary =
          selectedAddOnDetails.length > 0
            ? `%0A*Gift Add-Ons:*%0A${selectedAddOnDetails.map((a) => `• ${a.label} +৳${a.price}`).join("%0A")}`
            : "";
        const message =
          `*NEW ORDER ALERT*%0A%0A` +
          `*Customer:* ${formData.firstName} ${formData.lastName}%0A` +
          `*Phone:* ${formData.phone}%0A` +
          `*Alt:* ${formData.altPhone}%0A` +
          `*Address:* ${formData.address}, ${formData.city}%0A%0A` +
          `*Items:*%0A${productSummary}${addOnSummary}%0A%0A` +
          `*Custom:* ${formData.designDetails || "None"}%0A` +
          `*Payment Ref:* ${formData.paymentInfo}%0A` +
          `*Total:* ৳${grandTotal.toLocaleString()}`;
        window.open(`https://wa.me/8801974004221?text=${message}`, "_blank");
      }
      onSuccess(orderData);
    } catch (err) {
      console.error(err);
      alert("Error placing order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] bg-white overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 md:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest">
                Checkout
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                — {totalItems.length} item{totalItems.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Form */}
              <div className="space-y-10">
                {/* Shipping */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest">
                      Shipping Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        First Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="First Name"
                        className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Last Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Last Name"
                        className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Street Address
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="House No, Road, Area"
                        className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        City
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="City / District"
                        className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Phone
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className={`w-full border-b-2 py-2 text-sm font-bold outline-none bg-transparent ${phoneError ? "border-red-400 text-red-600" : "border-gray-100 focus:border-black"}`}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          setPhoneError("");
                        }}
                      />
                      {phoneError && (
                        <p className="text-[9px] text-red-500 font-bold">
                          {phoneError}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Alternative Number (Mandatory)
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className={`w-full border-b-2 py-2 text-sm font-bold outline-none bg-transparent ${altPhoneError ? "border-red-400 text-red-600" : "border-gray-100 focus:border-black"}`}
                        value={formData.altPhone}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            altPhone: e.target.value,
                          });
                          setAltPhoneError("");
                        }}
                      />
                      {altPhoneError && (
                        <p className="text-[9px] text-red-500 font-bold">
                          {altPhoneError}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Customisation Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Any custom details..."
                        className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent"
                        value={formData.designDetails}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            designDetails: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Zone */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest">
                      Delivery Zone
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "inside", title: "Inside Dhaka", price: "৳80" },
                      { id: "outside", title: "Outside Dhaka", price: "৳150" },
                    ].map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, deliveryZone: zone.id })
                        }
                        className={`p-4 rounded-xl border-2 text-left transition-all ${formData.deliveryZone === zone.id ? "border-black bg-black text-white" : "border-gray-100 hover:border-gray-300"}`}
                      >
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest mb-1 ${formData.deliveryZone === zone.id ? "text-white/60" : "text-gray-400"}`}
                        >
                          {zone.id}
                        </p>
                        <p className="text-xs font-black uppercase">
                          {zone.title}
                        </p>
                        <p
                          className={`text-[11px] font-bold mt-1 ${formData.deliveryZone === zone.id ? "text-white/80" : "text-gray-500"}`}
                        >
                          {zone.price}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Gift & Premium Add-Ons ── */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                      3
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest">
                        Gift & Premium Extras
                      </h3>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                        Make someone feel extraordinary
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {GIFT_ADDONS.map((addon) => {
                      const isSelected = selectedAddOns.includes(addon.id);
                      return (
                        <motion.button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddOn(addon.id)}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left ${
                            isSelected
                              ? "border-transparent shadow-xl shadow-black/10"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          {/* Dark gradient background when selected */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${addon.color} transition-opacity duration-300 ${isSelected ? "opacity-100" : "opacity-0"}`}
                          />

                          <div className="relative flex items-center gap-4 p-4">
                            {/* Emoji in styled bubble */}
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 ${isSelected ? "bg-white/15 shadow-inner" : "bg-gray-50"}`}
                            >
                              {addon.emoji}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p
                                  className={`text-[11px] font-black uppercase tracking-tight transition-colors ${isSelected ? "text-white" : "text-gray-900"}`}
                                >
                                  {addon.label}
                                </p>
                                <span
                                  className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white/80" : "bg-gray-100 text-gray-400"}`}
                                >
                                  {addon.tag}
                                </span>
                              </div>
                              <p
                                className={`text-[10px] font-medium leading-relaxed transition-colors ${isSelected ? "text-white/70" : "text-gray-400"}`}
                              >
                                {addon.sublabel}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p
                                className={`text-sm font-black transition-colors ${isSelected ? "text-white" : "text-gray-800"}`}
                              >
                                +৳{addon.price}
                              </p>
                              {/* Custom checkbox */}
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-white border-white" : "border-gray-200 bg-white"}`}
                              >
                                <motion.div
                                  initial={false}
                                  animate={{
                                    scale: isSelected ? 1 : 0,
                                    opacity: isSelected ? 1 : 0,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: isSelected
                                      ? addon.accent
                                      : "transparent",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Animated shimmer on selected */}
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ x: "-100%" }}
                              animate={{ x: "200%" }}
                              transition={{ duration: 1.2, ease: "easeInOut" }}
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                              }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Live preview of selected add-ons */}
                  <AnimatePresence>
                    {selectedAddOns.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {selectedAddOns
                                .map(
                                  (id) =>
                                    GIFT_ADDONS.find((a) => a.id === id)?.emoji,
                                )
                                .join(" ")}
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-purple-700">
                                Gift package active
                              </p>
                              <p className="text-[9px] text-purple-400 font-bold">
                                {selectedAddOns.length} extra
                                {selectedAddOns.length > 1 ? "s" : ""} added to
                                your order
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-purple-700">
                            +৳{addOnTotal}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Payment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                      4
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest">
                      Payment
                    </h3>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                    <p className="text-[11px] font-black text-red-700 uppercase leading-tight">
                      ⚠ Advance delivery charge is mandatory to confirm order.
                    </p>
                    <p className="text-[10px] font-bold text-red-600 leading-relaxed">
                      Send <strong>৳80</strong> (Inside Dhaka) or{" "}
                      <strong>৳150</strong> (Outside Dhaka) to{" "}
                      <strong>01974004221</strong> via bKash / Nagad / Rocket.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Send to (bKash/Nagad/Rocket)
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-black">
                        01974004221
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy("01974004221", "pay")}
                        className="p-2 bg-white rounded-lg border border-gray-200 hover:border-black"
                      >
                        <Copy
                          className={`w-4 h-4 ${copiedStatus === "pay" ? "text-green-500" : "text-gray-400"}`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Transaction ID / Last 4 digits
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 8821 or TXN123456"
                      className="w-full border-b-2 border-gray-100 py-2 text-sm font-bold outline-none focus:border-black bg-transparent font-mono uppercase"
                      value={formData.paymentInfo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentInfo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pb-8">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmit("COD")}
                    className="w-full py-5 bg-black text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                    Confirm Order
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmit("WhatsApp")}
                    className="w-full py-4 bg-white border-2 border-black text-black font-black text-[11px] uppercase tracking-[0.4em] rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Order via WhatsApp
                  </button>
                </div>
              </div>

              {/* ── FIX 2: Order summary — removed "hidden" so it shows on all screen sizes ── */}
              <div className="block">
                <div className="sticky top-24 bg-gray-50 rounded-2xl p-8 space-y-6">
                  <h3 className="text-xl font-serif italic text-gray-900">
                    Inventory
                  </h3>
                  <div className="space-y-5">
                    {totalItems.map((item) => (
                      <div
                        key={`${item.id}-${item.selectedSize}`}
                        className="flex gap-4 items-center"
                      >
                        <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 relative">
                          {item.image && (
                            <img
                              src={item.image}
                              className="w-full h-full object-cover"
                              alt={item.name}
                            />
                          )}
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-[9px] font-black flex items-center justify-center rounded-full">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            Size: {item.selectedSize}
                          </p>
                          {item.selectedColor && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="inline-block w-3 h-3 rounded-sm border border-gray-200 flex-shrink-0"
                                style={{ backgroundColor: item.selectedColor }}
                              />
                              <span className="text-[10px] text-gray-400 font-bold">
                                Color: {item.selectedColor}
                              </span>
                            </div>
                          )}
                          <p className="text-[12px] font-black mt-1">
                            ৳{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gift add-ons summary in order panel */}
                  {selectedAddOns.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        Gift Extras
                      </p>
                      {GIFT_ADDONS.filter((a) =>
                        selectedAddOns.includes(a.id),
                      ).map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-3"
                        >
                          <span className="text-xl">{addon.emoji}</span>
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase">
                              {addon.label}
                            </p>
                            <p className="text-[9px] text-gray-400 font-medium">
                              {addon.sublabel}
                            </p>
                          </div>
                          <p className="text-[11px] font-black text-gray-700">
                            +৳{addon.price}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-5 space-y-3">
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                      <span>Subtotal</span>
                      <span>৳{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
                      <span>Delivery</span>
                      <span>৳{deliveryCharge}</span>
                    </div>
                    {addOnTotal > 0 && (
                      <div className="flex justify-between text-[11px] font-bold text-purple-600 uppercase">
                        <span>Gift Extras</span>
                        <span>+৳{addOnTotal}</span>
                      </div>
                    )}
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-[11px] font-bold text-green-600 uppercase">
                        <span>Discount (10%)</span>
                        <span>-৳{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                      <span className="text-lg font-serif italic">Total</span>
                      <span className="text-2xl font-black font-mono">
                        ৳{grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Voucher code"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-black"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-black text-white text-[10px] font-black rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// StylistModule
// ─────────────────────────────────────────────
const StylistModule = ({ isOpen, onClose, products, onProductClick }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          type: "ai",
          text: "WELCOME TO FELICITE™ INTELLIGENCE. I AM YOUR PERSONAL STYLIST. DESCRIBE THE VIBE YOU WANT TO ARCHIVE TODAY.",
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;
    const userText = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: userText }]);
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are the "FELICITE™ AI Stylist". You are sophisticated, minimalist, and knowledgeable about streetwear. Your goal is to provide fashion styling advice based on the user's prompt and our current inventory. Our Inventory: ${JSON.stringify(products.map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price })))} Rules: 1. Be professional, chic, and encouraging. 2. Recommend 2-4 products from the provided inventory. 3. Return ONLY a valid JSON object. 4. JSON Structure: { "analysis": "short vibe analysis", "recommended_ids": ["string array of product IDs"], "chat_output": "the message to the user" } User Request: ${userText}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommended_ids: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              chat_output: { type: Type.STRING },
            },
            required: ["analysis", "recommended_ids", "chat_output"],
          },
        },
      });
      if (!response.text) throw new Error("AI_RESPONSE_EMPTY");
      const data = JSON.parse(response.text);
      const matchedProducts = products.filter((p) =>
        data.recommended_ids?.includes(p.id),
      );
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: data.chat_output, products: matchedProducts },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "SYSTEM INTERRUPTION. PLEASE RESTATE YOUR QUERY." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-8"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-2xl h-[80vh] flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest leading-none">
                    AI Stylist
                  </h3>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                    Active Intelligence V1.0
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-50 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[85%] space-y-4">
                    <div
                      className={`p-5 rounded-2xl text-[11px] font-medium tracking-wide leading-relaxed ${m.type === "user" ? "bg-black text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"}`}
                    >
                      {m.text}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {m.products.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden group cursor-pointer hover:border-black transition-all"
                            onClick={() => {
                              onProductClick(p);
                              onClose();
                            }}
                          >
                            <div className="aspect-[4/5] bg-gray-50 overflow-hidden">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100" />
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-[9px] font-black uppercase truncate">
                                {p.name}
                              </p>
                              <p className="text-[8px] text-gray-400 font-bold">
                                ৳{p.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-2">
                <input
                  type="text"
                  placeholder="Ask for style recommendations..."
                  className="flex-1 bg-transparent border-none outline-none py-3 text-[11px] font-medium placeholder:text-gray-400"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:opacity-80 disabled:opacity-20"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
const Footer = ({ setCurrentPage }) => (
  <footer className="bg-black text-white pt-20 md:pt-32 pb-12 px-6 mt-20 md:mt-32">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="flex gap-8 md:gap-10 mb-12 md:mb-16">
        <Facebook className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Instagram className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Twitter className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-24 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">
        {["support", "privacy", "terms", "return", "contact"].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className="hover:text-white transition-colors capitalize"
          >
            {page === "return" ? "Return & Exchange" : page}
          </button>
        ))}
      </div>
      <div className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium">
        © 2026 - FELICITE
      </div>
    </div>
  </footer>
);

const InfoPage = ({ title, content, onBack }) => (
  <div className="bg-white min-h-screen pt-32 pb-40 px-8">
    <div className="max-w-3xl mx-auto space-y-16">
      <Reveal>
        <button
          onClick={onBack}
          className="flex items-center gap-2 group text-gray-400 hover:text-black transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Back
          </span>
        </button>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="text-[14px] leading-[2] font-medium text-gray-500 uppercase whitespace-pre-wrap tracking-wide space-y-8">
          {content}
        </div>
      </Reveal>
    </div>
  </div>
);

const LoadingScreen = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-8"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="w-full max-w-[280px] md:max-w-md lg:max-w-xl"
    >
      <img
        src="https://www.image2url.com/r2/default/images/1777312670418-ca29d9ff-c1e8-4aa9-9e85-31d771c862bd.png"
        alt="FELICITE"
        className="w-full h-auto object-contain"
      />
    </motion.div>
    <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-6">
      <div className="w-48 h-[1px] bg-gray-100 relative overflow-hidden">
        <motion.div
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 bottom-0 w-1/2 bg-black"
        />
      </div>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1.5 h-1.5 bg-black rounded-full"
        />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black">
          Initializing Archive
        </p>
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [hasUnlockedCoupon, setHasUnlockedCoupon] = useState(false);
  const [isCouponPopupOpen, setIsCouponPopupOpen] = useState(false);
  const [couponPhone, setCouponPhone] = useState("");
  const [hasShownCoupon, setHasShownCoupon] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [productsList, setProductsList] = useState([]);
  const pageHistoryRef = useRef(["home"]);

  useEffect(() => {
    window.history.pushState({ felicite: true }, "");
    const handlePopState = () => {
      window.history.pushState({ felicite: true }, "");
      const history = pageHistoryRef.current;
      if (history.length > 1) {
        const newHistory = history.slice(0, -1);
        pageHistoryRef.current = newHistory;
        const prevPage = newHistory[newHistory.length - 1];
        if (prevPage === "home") {
          setCurrentPage("home");
          setSelectedProduct(null);
        } else if (prevPage === "shop") {
          setCurrentPage("shop");
          setSelectedProduct(null);
        } else {
          setCurrentPage(prevPage);
          setSelectedProduct(null);
        }
      } else {
        pageHistoryRef.current = ["home"];
        setCurrentPage("home");
        setSelectedProduct(null);
      }
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page) => {
    pageHistoryRef.current = [...pageHistoryRef.current, page];
    setCurrentPage(page);
  };

  useEffect(() => {
    supabase
      .from("categories")
      .select("name")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCategories(data.map((c) => c.name));
      });
    const channel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          supabase
            .from("categories")
            .select("name")
            .order("sort_order", { ascending: true })
            .then(({ data }) => {
              if (data) setCategories(data.map((c) => c.name));
            });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setProductsList(
            data.map((p) => ({
              ...p,
              isNewArrival: p.is_new_arrival,
              soldOut: p.sold_out,
            })),
          );
        }
      });
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) {
                setProductsList(
                  data.map((p) => ({
                    ...p,
                    isNewArrival: p.is_new_arrival,
                    soldOut: p.sold_out,
                  })),
                );
              }
            });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!hasShownCoupon) {
      const timer = setTimeout(() => {
        setIsCouponPopupOpen(true);
        setHasShownCoupon(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [hasShownCoupon]);

  useEffect(() => {
    const authorizedEmails = [
      "mimpy124ahon124@gmail.com",
      "feliciteclothing@gmail.com",
    ];
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const isAuthorized = user && authorizedEmails.includes(user.email || "");
      setIsAdmin(!!isAuthorized);
      setAdminEmail(user?.email || "");
      if (!isAuthorized) setIsAdminMode(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const isAuthorized = user && authorizedEmails.includes(user.email || "");
      setIsAdmin(!!isAuthorized);
      setAdminEmail(user?.email || "");
      if (!isAuthorized) setIsAdminMode(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let ordersChannel = null;
    if (isAdmin) {
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (!error) setOrders(data || []);
        });
      ordersChannel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            supabase
              .from("orders")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100)
              .then(({ data }) => setOrders(data || []));
          },
        )
        .subscribe();
    }
    setIsLoading(false);
    return () => {
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, [isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentPage, selectedProduct]);

  const toggleAdmin = async () => {
    if (!isAdmin) {
      const email = prompt("Admin email:");
      const password = prompt("Password:");
      if (email && password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) alert("Login failed: " + error.message);
        else setIsAdminMode(true);
      }
    } else {
      setIsAdminMode(true);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
  };

  const deleteOrder = async (orderId) => {
    await supabase.from("orders").delete().eq("id", orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const addOrUpdateProduct = async (p) => {
    const dbRow = {
      name: p.name,
      price: p.price,
      currency: p.currency || "BDT",
      category: p.category,
      image: p.image || null,
      gallery: p.gallery || [],
      colors: p.colors || [],
      sizes: p.sizes || ["S", "M", "L"],
      description: p.description || null,
      is_new_arrival: p.isNewArrival || false,
      sold_out: p.soldOut || false,
      stock: p.stock ?? null,
      updated_at: new Date().toISOString(),
    };
    try {
      if (p.id) {
        await supabase.from("products").update(dbRow).eq("id", p.id);
      } else {
        await supabase.from("products").insert([dbRow]);
      }
    } catch (err) {
      console.error("Product save error:", err);
      alert("Failed to save product.");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProductsList((prev) => prev.filter((p) => p.id !== id));
  };

  const addToCart = (product, selectedSize, selectedColor) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === product.id &&
          i.selectedSize === selectedSize &&
          i.selectedColor === selectedColor,
      );
      if (existing)
        return prev.map((i) =>
          i.id === product.id &&
          i.selectedSize === selectedSize &&
          i.selectedColor === selectedColor
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      return [
        ...prev,
        { ...product, quantity: 1, selectedSize, selectedColor },
      ];
    });
    setIsCartOpen(true);
  };

  const handleProductClick = (p) => {
    setSelectedProduct(p);
    navigateTo("product");
  };

  const handleUpdateCategories = async (newCats) => {
    await supabase.from("categories").delete().neq("id", 0);
    const rows = newCats.map((name, i) => ({ name, sort_order: i }));
    const { error } = await supabase.from("categories").insert(rows);
    if (error) alert("Failed to save categories.");
  };

  const handleLeadCapture = (phone) => {
    if (phone.length >= 10) {
      setHasUnlockedCoupon(true);
      alert("Coupon code unlocked! 10% discount is now active.\nCode: new10");
      setIsCouponPopupOpen(false);
    } else {
      alert("Invalid number.");
    }
  };

  if (isAdminMode && isAdmin) {
    return (
      <AdminDashboard
        orders={orders}
        productsList={productsList}
        categories={categories}
        adminEmail={adminEmail}
        onUpdateStatus={updateOrderStatus}
        onDeleteOrder={deleteOrder}
        onAddProduct={addOrUpdateProduct}
        onDeleteProduct={deleteProduct}
        onUpdateCategories={handleUpdateCategories}
        onClose={() => setIsAdminMode(false)}
      />
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-8 md:space-y-10 max-w-lg w-full"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              Order Registered
            </h2>
            <p className="text-gray-500 text-[12px] leading-relaxed font-medium max-w-sm mx-auto">
              {orderSuccess.payment_method === "WhatsApp"
                ? "Your order is saved. Complete the final step in WhatsApp to finalize dispatch."
                : "Our logistics team will call you for vocal verification shortly."}
            </p>
          </div>
          <div className="bg-gray-50/50 p-5 md:p-8 text-left border border-gray-100 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                Order Manifest
              </p>
              <div className="space-y-1">
                {orderSuccess.items.map((item, idx) => (
                  <p key={idx} className="text-[11px] font-bold">
                    {item.name} ({item.selectedSize}) x{item.quantity}
                  </p>
                ))}
              </div>
              {orderSuccess.add_ons && orderSuccess.add_ons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">
                    🎁 Gift Extras
                  </p>
                  {orderSuccess.add_ons.map((addon, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] font-bold text-purple-700"
                    >
                      {addon.emoji} {addon.label} (+৳{addon.price})
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-[9px] font-black uppercase text-gray-400 mb-1">
                  Shipping To
                </p>
                <p className="font-black text-sm uppercase">
                  {orderSuccess.customer_info.firstName}{" "}
                  {orderSuccess.customer_info.lastName}
                </p>
                <p className="text-[10px] text-gray-500">
                  {orderSuccess.customer_info.address}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-1">
                  Total
                </p>
                <p className="text-[18px] font-black">
                  ৳{orderSuccess.grand_total?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOrderSuccess(null);
              setCart([]);
            }}
            className="w-full py-4 md:py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em]"
          >
            Back to Collections
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-950 selection:bg-black selection:text-white overflow-x-hidden">
      <AnimatePresence>
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <AnimatePresence>
        {isCouponPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-white p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#024941]" />
              <button
                onClick={() => setIsCouponPopupOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-[#f0f7f6] rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-[#024941]" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                  Exclusive Gift For You
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Enter your phone number to unlock a{" "}
                  <span className="font-bold text-[#024941]">10% OFF</span>{" "}
                  coupon.
                </p>
                <div className="space-y-4">
                  <input
                    type="tel"
                    placeholder="01XXX-XXXXXX"
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:border-[#024941] focus:bg-white transition-all text-center font-bold text-lg"
                    value={couponPhone}
                    onChange={(e) => setCouponPhone(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (validatePhone(couponPhone)) {
                        handleLeadCapture(couponPhone);
                      } else {
                        alert("Please enter a valid 11-digit phone number.");
                      }
                    }}
                    className="w-full py-4 bg-[#024941] text-white rounded-xl font-bold hover:bg-[#013832] transition-all"
                  >
                    Get My Coupon
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                  Limited Time Offer • felicite™
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={toggleAdmin}
        isAdmin={isAdmin}
        setCurrentPage={navigateTo}
        currentPage={currentPage}
        categories={categories}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenStylist={() => setTerminalOpen(true)}
      />

      <StylistModule
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        products={productsList}
        onProductClick={handleProductClick}
      />

      <main>
        {currentPage === "home" ? (
          <>
            <Hero setCurrentPage={navigateTo} />
            <Categories
              onCategorySelect={setSelectedCategory}
              setCurrentPage={navigateTo}
            />
            <section className="py-24 md:py-32 bg-white px-0">
              <div className="w-full">
                <div className="text-center mb-24 space-y-4 px-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                    Curated pieces
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
                    New Arrivals
                  </h2>
                  <div className="w-16 h-1 bg-black mx-auto" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
                  {productsList
                    .filter((p) => p.isNewArrival)
                    .slice(0, 20)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={addToCart}
                          onClick={handleProductClick}
                          hasCoupon={hasUnlockedCoupon}
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-32 flex justify-center px-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateTo("shop")}
                  className="px-16 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em]"
                >
                  View All Products
                </motion.button>
              </div>
            </section>
          </>
        ) : currentPage === "shop" ? (
          <ShopPage
            productsList={productsList}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
            activeCategory={selectedCategory}
            setActiveCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoriesList={categories}
            hasCoupon={hasUnlockedCoupon}
          />
        ) : currentPage === "product" ? (
          selectedProduct && (
            <ProductView
              product={selectedProduct}
              productsList={productsList}
              onAddToCart={addToCart}
              onBack={() => {
                const history = pageHistoryRef.current;
                if (history.length > 1) {
                  const newHistory = history.slice(0, -1);
                  pageHistoryRef.current = newHistory;
                  const prev = newHistory[newHistory.length - 1];
                  setCurrentPage(prev);
                  if (prev !== "product") setSelectedProduct(null);
                } else {
                  navigateTo("shop");
                  setSelectedProduct(null);
                }
              }}
              onProductClick={handleProductClick}
              hasCoupon={hasUnlockedCoupon}
            />
          )
        ) : currentPage === "support" ? (
          <InfoPage
            title="Support"
            onBack={() => navigateTo("home")}
            content={`Our support collective is available to assist with your order requirements.\n\nDispatch Status:\nOrders are processed within 24-48 hours.\n\nSizing Consultation:\nReview the Size Chart on each product page.\n\nPayment:\nWe support Cash on Delivery for all regions in Bangladesh.`}
          />
        ) : currentPage === "privacy" ? (
          <InfoPage
            title="Privacy Protocol"
            onBack={() => navigateTo("home")}
            content={`FELICITE™ prioritizes individual data sovereignty.\n\nData Collection:\nWe collect identity information solely for shipment fulfillment.\n\nStorage:\nInformation is stored on secure, encrypted servers. We do not sell user data.\n\nTransparency:\nYou may request deletion of your profile at any time.`}
          />
        ) : currentPage === "terms" ? (
          <InfoPage
            title="Terms of Service"
            onBack={() => navigateTo("home")}
            content={`Agreement of Use:\nBy accessing FELICITE™, you agree to our collection protocols.\n\nOrders:\nWe reserve the right to cancel fraudulent orders.\n\nIntellectual Property:\nAll designs and trademarks are property of FELICITE™.\n\nGoverning Law:\nUsage is governed by the laws of Bangladesh.`}
          />
        ) : currentPage === "return" ? (
          <InfoPage
            title="Returns & Exchanges"
            onBack={() => navigateTo("home")}
            content={`Articles must be in original unused condition with tags intact.\n\nEligibility:\nRequests within 7 days of delivery. Sale articles are final sale.\n\nContact us via the contact form to initiate a return.`}
          />
        ) : currentPage === "contact" ? (
          <InfoPage
            title="Contact"
            onBack={() => navigateTo("home")}
            content={`Reach us at: feliciteclothing@gmail.com\n\nWhatsApp: 01974004221\n\nWe respond within 24-48 hours.`}
          />
        ) : null}
      </main>

      <Footer setCurrentPage={navigateTo} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemove={(uid) =>
          setCart((prev) =>
            prev.filter(
              (i) => `${i.id}-${i.selectedSize}-${i.selectedColor}` !== uid,
            ),
          )
        }
        onUpdateQty={(uid, delta) =>
          setCart((prev) =>
            prev.map((i) =>
              `${i.id}-${i.selectedSize}-${i.selectedColor}` === uid
                ? { ...i, quantity: Math.max(1, i.quantity + delta) }
                : i,
            ),
          )
        }
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(data) => {
          setIsCheckoutOpen(false);
          setOrderSuccess(data);
        }}
        totalItems={cart}
        totalAmount={cart.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        )}
        onUpdateItem={(uid, updates) =>
          setCart((prev) =>
            prev.map((i) =>
              `${i.id}-${i.selectedSize}-${i.selectedColor}` === uid
                ? { ...i, ...updates }
                : i,
            ),
          )
        }
        hasCoupon={hasUnlockedCoupon}
      />
    </div>
  );
}
