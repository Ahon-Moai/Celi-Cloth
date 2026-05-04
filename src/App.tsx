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
  Terminal as TerminalIcon,
  Zap,
  Loader2,
  Sparkles,
  MessageSquare,
  MessageCircle,
  Layers,
  Phone,
  Copy,
  ShieldCheck,
  Trash2,
  Image as ImageIcon,
  Upload,
  Users,
} from "lucide-react";
import { products } from "./products";
import { Product, CartItem, Order } from "./types";
import { supabase } from "./lib/supabase";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
});

const ProductView = ({
  product,
  productsList,
  onAddToCart,
  onBack,
  onProductClick,
  hasCoupon,
}: {
  product: Product;
  productsList: Product[];
  onAddToCart: (p: Product, size?: string, color?: string) => void;
  onBack: () => void;
  onProductClick: (p: Product) => void;
  hasCoupon?: boolean;
}) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "S");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [activeTab, setActiveTab] = useState("Recommended");
  const [activeAccordion, setActiveAccordion] = useState<string | null>(
    "details",
  );
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const sizes = product.sizes || ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const gallery =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  const sizeChartImages: Record<string, string> = {
    Hoodies:
      "https://www.image2url.com/r2/default/images/1777270928450-aa406a06-2c71-4548-ab42-a148066f4b25.jpeg",
    Shirts:
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg",
    "T-shirts":
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg", // Using shirt as default if none provided
    default:
      "https://www.image2url.com/r2/default/images/1777270967900-d086f42c-bea4-404a-9968-59e7cfad7a63.jpeg",
  };

  const currentSizeChart =
    sizeChartImages[product.category] || sizeChartImages["default"];

  const relatedProducts = React.useMemo(() => {
    let filtered = productsList.filter((p) => p.id !== product.id);
    if (activeTab === "Best Sellers") {
      // Best sellers logic (e.g. products that are not new arrivals or have some flag,
      // but here we just shuffle or take specific slices for demo)
      return filtered.slice(4, 12);
    } else if (activeTab === "New Arrivals") {
      return filtered.filter((p) => p.isNewArrival).slice(0, 8);
    }
    // Recommended
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
              <div className="aspect-auto max-h-[80vh] overflow-auto flex items-center justify-center bg-white p-4 md:p-8">
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
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-[60%] bg-[#f9f9f9] relative aspect-[4/5] lg:aspect-auto lg:h-screen top-0 lg:sticky overflow-hidden border-b lg:border-b-0 lg:border-r border-gray-100">
          <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 transition-all duration-700">
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
                    className="w-full h-full object-contain"
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
                    className={`w-2 h-2 rounded-full transition-all ${activeImageIndex === i ? "w-8 bg-black" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Product Info */}
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
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4 p-4 md:p-6 bg-gray-50 rounded-sm">
                {product.colors.map((color, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedColor(color);
                      if (gallery.length > i) setActiveImageIndex(i);
                    }}
                    className={`w-12 h-14 md:w-14 md:h-16 border cursor-pointer hover:ring-2 hover:ring-black transition-all ${selectedColor === color ? "ring-2 ring-black" : "border-gray-200"}`}
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
                wearing the size M, <span className="text-black">Female</span>{" "}
                model is 5'9" & 48kg, wearing the size S
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <button
              onClick={() => onAddToCart(product, selectedSize, selectedColor)}
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
                  className={`w-4 h-4 text-gray-300 transition-all ${activeAccordion === "details" ? "rotate-45" : "group-hover:rotate-90"}`}
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
                        "No detailed specifications available for this article."}
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
                  className={`w-4 h-4 text-gray-300 transition-all ${activeAccordion === "shipping" ? "rotate-45" : "group-hover:rotate-90"}`}
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
                        Standard Shipping: 2-4 business days within Dhaka Metro
                        area.
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
          <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-300">
            Complementary Pieces
          </h2>
          <div className="flex justify-center gap-16">
            {["Recommended", "Best Sellers", "New Arrivals"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 transition-all ${activeTab === tab ? "text-black border-b-2 border-black" : "text-gray-300 hover:text-black"}`}
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

const Reveal = ({
  children,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) => (
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
          Felicite™ · SPRING '26 · LIVE NOW · FELICITE CLOTHING · LIMITED
          EDITION · ৳ 1,399 FAST SHIPPING
        </span>
      ))}
    </motion.div>
  </div>
);

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
}: {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  setCurrentPage: (page: "home" | "shop" | "product") => void;
  currentPage: "home" | "shop" | "product";
  categories: string[];
  onCategorySelect: (cat: string) => void;
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenStylist: () => void;
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

  const navLinks = [
    { label: "Shop", page: "shop" as const },
    { label: "Collections", page: "home" as const },
    { label: "Search", action: () => setIsSearchOpen(true) },
    { label: "Account", action: onOpenAdmin },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-[100]">
      <Ticker />
      <div
        className={`w-full transition-all duration-700 ${isScrolled || isShop ? "bg-white/95 backdrop-blur-md text-black py-3 md:py-4 shadow-sm" : "bg-transparent text-white py-5 md:py-8"}`}
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

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center -ml-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 hover:opacity-50 transition-opacity ${isScrolled || isShop ? "text-black" : "text-white"}`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <button
              onClick={() => {
                setCurrentPage("shop");
                onCategorySelect("All");
                setSearchQuery("");
              }}
              className={`transition-opacity uppercase cursor-pointer ${currentPage === "shop" && selectedCategory === "All" && !searchQuery ? `border-b-2 ${isScrolled || isShop ? "border-black" : "border-white"} pb-1` : "hover:opacity-50"}`}
            >
              Shop
            </button>
            <div
              className="relative group"
              onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
              onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
            >
              <button
                className={`hover:opacity-50 transition-opacity uppercase cursor-pointer ${currentPage === "shop" && selectedCategory !== "All" ? `border-b-2 ${isScrolled || isShop ? "border-black" : "border-white"} pb-1` : ""}`}
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
              className={`transition-all uppercase cursor-pointer hover:text-blue-600 flex items-center gap-2 group ${isScrolled || isShop ? "text-black" : "text-white"}`}
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
              className={`text-xl md:text-3xl font-black uppercase whitespace-nowrap ${isScrolled || isShop ? "text-black" : "text-white"}`}
            >
              Felicite<span className="text-[10px] align-top font-bold">™</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={onOpenStylist}
              className="flex items-center gap-2 group hover:opacity-100 transition-opacity"
            >
              <Sparkles
                className={`w-5 h-5 group-hover:animate-pulse ${isScrolled || isShop ? "text-black" : "text-white"}`}
              />
              <span
                className={`hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] ${isScrolled || isShop ? "text-black/80" : "text-white/80"}`}
              >
                AI_STYLIST [V.1]
              </span>
            </button>
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-2 group hover:opacity-100 transition-opacity p-2 rounded-full ${isAdmin ? "text-green-500" : isScrolled || isShop ? "text-black hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span
                className={`hidden xl:block text-[10px] font-black uppercase tracking-[0.2em] ${isScrolled || isShop ? "text-black/80" : "text-white/80"}`}
              >
                {isAdmin ? "Admin" : "Account"}
              </span>
            </button>
            <div className="relative cursor-pointer group" onClick={onOpenCart}>
              <ShoppingBag
                className={`w-6 h-6 md:w-5 h-5 group-hover:opacity-50 transition-opacity ${isScrolled || isShop ? "text-black" : "text-white"}`}
              />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 -right-1 text-[8px] w-4 h-4 md:w-3.5 md:h-3.5 flex items-center justify-center rounded-sm font-black ${isScrolled || isShop ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
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
                    className={`text-4xl font-black uppercase tracking-tighter text-left transition-colors flex items-center gap-3 ${isAdmin ? "text-green-600" : "hover:text-gray-400"}`}
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

const validatePhone = (num: string) => /^\d{11}$/.test(num.replace(/\D/g, ""));

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
}: {
  orders: any[];
  productsList: Product[];
  categories: string[];
  adminEmail: string;
  onUpdateStatus: (id: string, s: string) => void;
  onDeleteOrder: (id: string) => void;
  onAddProduct: (p: any) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateCategories: (cats: string[]) => void;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<
    "orders" | "inventory" | "json" | "categories"
  >("orders");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    "all" | "pending" | "confirmed" | "shipped"
  >("all");
  const [newCatName, setNewCatName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    category: categories[0] || "T-shirts",
    image: "",
    gallery: [] as string[],
    colors: [] as string[],
    sizes: ["S", "M", "L"] as string[],
    description: "",
    isNewArrival: true,
    soldOut: false,
  });

  const [newColor, setNewColor] = useState("#000000");
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Upload a single file to Supabase Storage and return its public URL
  const uploadImage = async (
    file: File,
    folder: "primary" | "gallery",
  ): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  const handlePrimaryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress("Uploading primary image...");
    const url = await uploadImage(file, "primary");
    if (url) setProductForm((prev) => ({ ...prev, image: url }));
    setIsUploading(false);
    setUploadProgress("");
  };

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} image(s)...`);
    const urls = await Promise.all(files.map((f) => uploadImage(f, "gallery")));
    const validUrls = urls.filter(Boolean) as string[];
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

  const handleOpenEditModal = (p: Product) => {
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

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({ ...productForm, id: editingProduct?.id });
    setIsProductModalOpen(false);
  };

  const handleBulkImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (Array.isArray(data)) {
        data.forEach((p) => onAddProduct(p));
        alert("Bulk synchronization initialized.");
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

  const toggleSize = (size: string) => {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const removeGalleryItem = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const addColor = () => {
    setProductForm((prev) => ({ ...prev, colors: [...prev.colors, newColor] }));
  };

  const removeColor = (index: number) => {
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

                      {/* File Upload */}
                      <label
                        className={`flex items-center justify-center gap-3 border-2 border-dashed py-6 cursor-pointer transition-colors ${isUploading ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-black"}`}
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

                      {/* URL Fallback */}
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
                            className={`px-4 py-2 text-[10px] font-black border transition-all ${productForm.sizes.includes(size) ? "bg-black text-white border-black" : "border-gray-100 text-gray-300 hover:border-black hover:text-black"}`}
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

                      {/* Multi-file upload */}
                      <label
                        className={`flex items-center justify-center gap-3 border-2 border-dashed py-5 cursor-pointer transition-colors ${isUploading && uploadProgress.includes("image(s)") ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-black"}`}
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

                      {/* URL fallback for gallery */}
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
                      Manifesto Peak
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
              <button
                onClick={() => {
                  setActiveTab("orders");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === "orders" ? "border-r-4 border-white pr-4 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <Package className="w-4 h-4" />
                ORDERS
              </button>
              <button
                onClick={() => {
                  setActiveTab("inventory");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === "inventory" ? "border-r-4 border-white pr-4 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <ShoppingBag className="w-4 h-4" />
                INVENTORY
              </button>
              <button
                onClick={() => {
                  setActiveTab("json");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === "json" ? "border-r-4 border-white pr-4 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <ExternalLink className="w-4 h-4" />
                JSON PORTAL
              </button>
              <button
                onClick={() => {
                  setActiveTab("categories");
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-4 w-full text-left py-2 text-sm font-bold transition-all ${activeTab === "categories" ? "border-r-4 border-white pr-4 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <Layers className="w-4 h-4" />
                CATEGORIES
              </button>
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

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-[10] bg-gray-50/95 backdrop-blur-md p-6 md:px-12 md:py-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Cycle Volume
                    </p>
                    <p className="text-2xl md:text-3xl font-black">
                      {orders.length}
                    </p>
                  </div>
                  <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-blue-50" />
                </div>
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Action Required
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-orange-500">
                      {orders.filter((o) => o.status === "pending").length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-orange-50" />
                </div>
                <div className="bg-white p-6 md:p-8 border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500 sm:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Net Liquidity
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-green-500">
                      ৳{" "}
                      {orders
                        .reduce(
                          (acc, o) =>
                            o.status !== "cancelled"
                              ? acc + (o.grand_total || o.total_amount || 0)
                              : acc,
                          0,
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-50 group-hover:text-green-50" />
                </div>
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-4">
                    {["all", "pending", "confirmed", "shipped"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter as any)}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${orderFilter === filter ? "bg-black text-white border-black" : "text-gray-400 border-gray-100 hover:border-black hover:text-black"}`}
                        >
                          {filter}
                        </button>
                      ),
                    )}
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-50 transition-opacity">
                    Export CSV <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">
                      <tr>
                        <th className="px-8 py-6">ID & Date</th>
                        <th className="px-8 py-6">Customer Detials</th>
                        <th className="px-8 py-6">Variants & Logistics</th>
                        <th className="px-8 py-6">Capital Flow</th>
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
                            <p className="font-mono text-blue-600 font-black mb-1">
                              #{order.id?.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-[10px] font-bold text-gray-300">
                              {order.created_at
                                ? (order.created_at?.toDate
                                    ? order.created_at.toDate()
                                    : new Date(order.created_at)
                                  ).toLocaleString()
                                : "N/A"}
                            </p>
                            {order.payment_method === "WhatsApp" && (
                              <span className="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase mt-2 inline-block">
                                WhatsApp Sync
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-xs uppercase">
                              {order.customer_info?.firstName}{" "}
                              {order.customer_info?.lastName}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">
                              📱 {order.customer_info?.phone}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold">
                              📱 Alt:{" "}
                              {order.customer_info?.altPhone || (
                                <span className="text-red-400">N/A</span>
                              )}
                            </p>
                            {order.coupon_used && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[8px] font-black uppercase text-pink-600">
                                  Voucher:
                                </span>
                                <span className="text-[8px] font-black uppercase text-pink-700 bg-pink-50 px-1 border border-pink-100">
                                  {order.coupon_used}
                                </span>
                              </div>
                            )}
                            <div className="mt-2 text-[9px] text-gray-400 font-medium leading-relaxed max-w-[200px]">
                              <p className="font-bold text-black uppercase text-[8px] mb-1">
                                Address:
                              </p>
                              {order.customer_info?.address},{" "}
                              {order.customer_info?.city}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              {order.items?.map((item: any, idx: number) => (
                                <p
                                  key={idx}
                                  className="text-[10px] font-bold text-gray-600"
                                >
                                  {item.name} [{item.selectedSize}/
                                  {item.selectedColor}] x{item.quantity}
                                </p>
                              ))}
                            </div>
                            {order.customer_info?.designDetails && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-sm">
                                <p className="text-[8px] font-black text-blue-600 uppercase mb-1">
                                  Customization
                                </p>
                                <p className="text-[9px] text-blue-800 leading-tight">
                                  {order.customer_info?.designDetails}
                                </p>
                              </div>
                            )}
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-2">
                              Zone:{" "}
                              {order.customer_info?.deliveryZone === "inside"
                                ? "Inside Dhaka"
                                : "Outside Dhaka"}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="font-black text-sm">
                                ৳
                                {order.grand_total?.toLocaleString() ||
                                  order.total_amount?.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                Delivery: ৳{order.delivery_charge || 0}
                              </p>
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">
                                  Settlement Auth
                                </p>
                                <p className="text-[10px] font-bold text-blue-600 break-all max-w-[120px]">
                                  {order.customer_info?.paymentInfo || "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 flex items-center gap-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                onUpdateStatus(order.id, e.target.value)
                              }
                              className={`bg-transparent border-b-2 text-[10px] uppercase font-black p-1 outline-none transition-colors cursor-pointer ${
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
                                    `PERMANENTLY DELETE ORDER #${order.id?.slice(0, 8).toUpperCase()}? This action is irreversible.`,
                                  )
                                ) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="p-24 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">
                    System Idle - No Data
                  </div>
                )}
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  {["all", "pending", "confirmed", "shipped"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter as any)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border whitespace-nowrap transition-all ${orderFilter === filter ? "bg-black text-white border-black" : "text-gray-400 border-gray-100 bg-white"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 p-6 space-y-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono text-blue-600 font-black text-sm">
                          #{order.id?.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                          {order.created_at
                            ? (order.created_at?.toDate
                                ? order.created_at.toDate()
                                : new Date(order.created_at)
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                          order.status === "pending"
                            ? "bg-orange-50 text-orange-600 border-orange-100"
                            : order.status === "confirmed"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : order.status === "shipped"
                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                : order.status === "delivered"
                                  ? "bg-green-50 text-green-600 border-green-100"
                                  : "bg-gray-50 text-gray-600 border-gray-100"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          Customer & Logistics
                        </p>
                        <p className="font-black text-sm uppercase">
                          {order.customer_info?.firstName}{" "}
                          {order.customer_info?.lastName}
                        </p>
                        <p className="text-[11px] text-gray-500 font-bold">
                          📱 {order.customer_info?.phone}
                        </p>
                        <p className="text-[11px] text-gray-500 font-bold">
                          📱 Alt: {order.customer_info?.altPhone || "N/A"}
                        </p>
                        {order.coupon_used && (
                          <p className="text-[9px] font-black text-pink-600 uppercase mt-1">
                            Voucher Detected: {order.coupon_used}
                          </p>
                        )}
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-100 text-[10px] leading-relaxed text-gray-600 font-medium whitespace-pre-wrap">
                          <span className="font-black text-black block mb-1">
                            STREET ADDRESS:
                          </span>
                          {order.customer_info?.address},{" "}
                          {order.customer_info?.city}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                          Items & Customization
                        </p>
                        <div className="space-y-1 mb-2">
                          {order.items?.map((item: any, idx: number) => (
                            <p
                              key={idx}
                              className="text-[10px] font-bold text-gray-600"
                            >
                              {item.name} [{item.selectedSize}/
                              {item.selectedColor}] x{item.quantity}
                            </p>
                          ))}
                        </div>
                        {order.customer_info?.designDetails && (
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-sm">
                            <p className="text-[8px] font-black text-blue-600 uppercase mb-1 underline">
                              Design Modification Notes
                            </p>
                            <p className="text-[10px] text-blue-800 leading-tight font-medium">
                              {order.customer_info?.designDetails}
                            </p>
                          </div>
                        )}
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-2">
                          Zone:{" "}
                          {order.customer_info?.deliveryZone === "inside"
                            ? "Inside Dhaka"
                            : "Outside Dhaka"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                            Capital Workflow
                          </p>
                          <p className="font-black text-lg">
                            ৳
                            {order.grand_total?.toLocaleString() ||
                              order.total_amount?.toLocaleString()}
                          </p>
                          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2 italic">
                            Ship: ৳{order.delivery_charge || 0}
                          </p>
                          <div className="p-2 bg-green-50/50 border border-green-100 rounded-sm">
                            <p className="text-[8px] font-black text-green-700 uppercase mb-1">
                              Settlement Auth
                            </p>
                            <p className="text-[9px] font-bold text-green-600 break-all">
                              {order.customer_info?.paymentInfo || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Protocol
                            </p>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `PERMANENTLY DELETE ORDER #${order.id?.slice(0, 8).toUpperCase()}?`,
                                  )
                                ) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="text-red-500 font-black text-[9px] uppercase tracking-widest px-2 py-1 bg-red-50 rounded-xs"
                            >
                              Delete
                            </button>
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateStatus(order.id, e.target.value)
                            }
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
                {filteredOrders.length === 0 && (
                  <div className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">
                    No data records
                  </div>
                )}
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
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-200 uppercase tracking-widest">
                        No Image
                      </div>
                    )}
                    {product.soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.4em] -rotate-12 shadow-xl">
                          VOID
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="text-[11px] font-black uppercase leading-tight tracking-tight">
                          {product.name}
                        </h4>
                        <p className="text-[10px] font-black">
                          ৳{product.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                        {product.category}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${product.soldOut ? "text-red-500" : "text-green-500"}`}
                      >
                        {product.soldOut ? "Depleted" : "Active"}
                      </span>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="text-[9px] font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-opacity"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="text-[9px] font-black uppercase tracking-widest border-b border-red-500 text-red-500 pb-1 hover:opacity-50 transition-opacity"
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
                    className="flex-1 border-b border-gray-100 py-3 text-sm outline-none focus:border-black font-bold uppercase"
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
                      className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-black uppercase tracking-widest">
                        {cat}
                      </span>
                      <div className="flex gap-6">
                        <button
                          onClick={() => {
                            const newName = prompt(
                              "Enter new category name",
                              cat,
                            );
                            if (newName && newName !== cat) {
                              const newCats = [...categories];
                              newCats[i] = newName;
                              onUpdateCategories(newCats);
                            }
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:opacity-50"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Erase this class from registry?")) {
                              onUpdateCategories(
                                categories.filter((_, idx) => idx !== i),
                              );
                            }
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:opacity-50"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                    Actual Representation
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(productsList, null, 2),
                      );
                      alert("Copied to clipboard");
                    }}
                    className="w-full sm:w-auto text-[9px] font-black uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-all"
                  >
                    Download Current JSON
                  </button>
                </div>
                <div className="bg-black text-green-500 p-6 md:p-8 rounded-sm font-mono text-[10px] h-[300px] md:h-[500px] overflow-auto border border-white/10 shadow-2xl">
                  <pre>{JSON.stringify(productsList, null, 2)}</pre>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-loose">
                  Copy this content and overwrite your{" "}
                  <code>src/data/products.json</code> file to finalize your site
                  updates for visitors.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                  Sync Channel
                </h3>
                <textarea
                  placeholder="PASTE JSON HERE FOR BULK SYNCHRONIZATION"
                  className="w-full bg-white border border-gray-100 p-6 md:p-8 font-mono text-[10px] h-[300px] md:h-[500px] outline-none focus:border-black shadow-inner resize-none"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
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

const Hero = ({
  setCurrentPage,
}: {
  setCurrentPage: (page: "home" | "shop" | "product") => void;
}) => {
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
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
      >
        <img
          src="https://www.image2url.com/r2/default/images/1777093846446-9c04cdcc-61e4-45ca-a34b-28c37a84bdeb.png"
          alt="Felicite Hero"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      <div
        className="absolute bottom-12 left-6 md:bottom-16 md:left-24 text-white space-y-4 md:space-y-6 pointer-events-none"
        style={{ transform: "translateZ(80px)" }}
      >
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-sm md:text-lg font-bold uppercase tracking-tight"
        >
          SPRING'26
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight uppercase leading-[0.9]"
        >
          COLLECTION IS LIVE
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 md:gap-10 text-[14px] md:text-xl font-bold tracking-tight uppercase pointer-events-auto mt-4"
        >
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
        </motion.div>
      </div>
    </section>
  );
};

const Categories = ({
  onCategorySelect,
  setCurrentPage,
}: {
  onCategorySelect: (cat: string) => void;
  setCurrentPage: (page: "home" | "shop" | "product") => void;
}) => (
  <section className="grid grid-cols-1 md:grid-cols-3 w-full h-[90vh] md:h-[100vh]">
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className="relative group overflow-hidden cursor-pointer"
      onClick={() => {
        onCategorySelect("T-shirts");
        setCurrentPage("shop");
      }}
    >
      <img
        src="https://i.ibb.co.com/5hTh1Cp5/image.png"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        alt="T-shirts"
      />
      <div className="absolute inset-0 bg-black/30 transition-colors duration-500" />
      <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white">
        <h3 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
          Boxt Fit T-shirts
        </h3>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="relative group overflow-hidden cursor-pointer"
      onClick={() => {
        onCategorySelect("Hoodies");
        setCurrentPage("shop");
      }}
    >
      <img
        src="https://i.ibb.co.com/5Wm1g5rJ/Whats-App-Image-2026-05-04-at-1-30-09-AM.jpg"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        alt="Hoodies"
      />
      <div className="absolute inset-0 bg-black/30 transition-colors duration-500" />
      <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white">
        <h3 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
          Hoodies
        </h3>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative group overflow-hidden cursor-pointer"
      onClick={() => {
        onCategorySelect("Shirts");
        setCurrentPage("shop");
      }}
    >
      <img
        src="https://i.ibb.co.com/GvFytRJR/image.png"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        alt="Shirts"
      />
      <div className="absolute inset-0 bg-black/30 transition-colors duration-500" />
      <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white">
        <h3 className="text-2xl md:text-3xl font-black tracking-widest uppercase">
          Shirts
        </h3>
      </div>
    </motion.div>
  </section>
);

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard = ({
  product,
  onAddToCart,
  onClick,
  hasCoupon,
}: {
  product: Product;
  onAddToCart: (p: Product, size?: string, color?: string) => void;
  onClick?: (p: Product) => void;
  hasCoupon?: boolean;
}) => (
  <Reveal y={40}>
    <div
      className="group relative cursor-pointer w-full"
      onClick={() => onClick?.(product)}
    >
      <div className="relative w-full aspect-[2/3] md:aspect-[3/4] lg:aspect-auto md:h-[470px] overflow-hidden bg-[#f9f9f9] mb-4 border border-gray-200">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-200">
              No Visual
            </span>
          </div>
        )}
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
          {hasCoupon && (
            <div className="bg-[#024941] text-white px-3 py-1 text-[8px] uppercase font-bold tracking-tight shadow-sm z-10 whitespace-nowrap flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              10% OFF
            </div>
          )}
        </div>
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
        {product.description && (
          <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest line-clamp-1 italic">
            {product.description}
          </p>
        )}
        {product.colors && (
          <p className="text-[8px] text-gray-400 font-bold tracking-[0.2em] uppercase">
            {product.colors.length} In Colors
          </p>
        )}
      </div>
    </div>
  </Reveal>
);

const Footer = ({
  setCurrentPage,
}: {
  setCurrentPage: (page: any) => void;
}) => (
  <footer className="bg-black text-white pt-20 md:pt-32 pb-12 px-6 mt-20 md:mt-32">
    <div className="max-w-7xl mx-auto flex flex-col items-center">
      <div className="flex gap-8 md:gap-10 mb-12 md:mb-16">
        <Facebook className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Instagram className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
        <Twitter className="w-5 h-5 cursor-pointer opacity-40 hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-24 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">
        <button
          onClick={() => setCurrentPage("support")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Support
        </button>
        <button
          onClick={() => setCurrentPage("privacy")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setCurrentPage("terms")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Terms of service
        </button>
        <button
          onClick={() => setCurrentPage("return")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Return & Exchange Portal
        </button>
        <button
          onClick={() => setCurrentPage("contact")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Contact Form
        </button>
      </div>

      <div className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-medium">
        © 2026 - FELICITE
      </div>
    </div>
  </footer>
);

// --- Drawers & Modals ---

const CartDrawer = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onUpdateQty,
  onCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (uniqueId: string) => void;
  onUpdateQty: (uniqueId: string, delta: number) => void;
  onCheckout: () => void;
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
              items.map((item, index) => {
                const uniqueId = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
                return (
                  <div key={uniqueId} className="flex gap-6">
                    <div className="w-24 h-32 bg-gray-50 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                          alt={item.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[8px] font-black uppercase text-gray-300">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-[12px] font-black uppercase tracking-tight leading-tight">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => onRemove(uniqueId)}
                            className="text-gray-300 hover:text-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-4 mb-2">
                          {item.selectedSize && (
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-0.5">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                Color:
                              </span>
                              <div
                                className="w-2 h-2 rounded-full border border-gray-200"
                                style={{ backgroundColor: item.selectedColor }}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-gray-500">
                          ৳{item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-100 rounded-sm">
                          <button
                            onClick={() => onUpdateQty(uniqueId, -1)}
                            className="px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 text-[11px] font-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQty(uniqueId, 1)}
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
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-gray-900 transition-all shadow-xl shadow-black/10"
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

const CheckoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  totalItems,
  totalAmount,
  onUpdateItem,
  hasCoupon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  totalItems: CartItem[];
  totalAmount: number;
  onUpdateItem: (uniqueId: string, updates: Partial<CartItem>) => void;
  hasCoupon?: boolean;
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    socialName: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    paymentInfo: "",
    designDetails: "",
    deliveryZone: "inside" as "inside" | "outside",
    paymentMethod: "COD" as "COD" | "WhatsApp",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    if (hasCoupon && appliedDiscount === 0) {
      setAppliedDiscount(0.1);
      setCouponCode("new10");
    }
  }, [hasCoupon, appliedDiscount]);

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [altPhoneError, setAltPhoneError] = useState("");
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Auto-adjust shipping logic
  useEffect(() => {
    const cityLower = (formData.city || "").toLowerCase();
    if (cityLower.length > 2) {
      if (cityLower.includes("dhaka")) {
        setFormData((prev) => ({ ...prev, deliveryZone: "inside" }));
      } else {
        setFormData((prev) => ({ ...prev, deliveryZone: "outside" }));
      }
    }
  }, [formData.city]);

  const deliveryCharge = formData.deliveryZone === "inside" ? 80 : 150;
  const discountAmount = totalAmount * appliedDiscount;
  const grandTotal = totalAmount + deliveryCharge - discountAmount;

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "new10") {
      setAppliedDiscount(0.1);
      alert('Coupon code "new10" applied successfully!');
    } else {
      alert("Invalid coupon code.");
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(type);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleSubmit = async (
    e: React.FormEvent | null,
    method: "COD" | "WhatsApp" = "COD",
  ) => {
    if (e) e.preventDefault();
    let hasError = false;

    if (!validatePhone(formData.phone)) {
      setPhoneError("Primary phone must be exactly 11 digits");
      hasError = true;
    }

    if (!formData.altPhone || !validatePhone(formData.altPhone)) {
      setAltPhoneError(
        "Alternative mobile number is mandatory and must be 11 digits",
      );
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const orderData = {
        customer_info: formData,
        items: totalItems,
        total_amount: totalAmount,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        coupon_used: appliedDiscount > 0 ? couponCode : null,
        status: "pending" as const,
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
        const message =
          `*NEW ORDER ALERT*%0A%0A` +
          `*Customer Name:* ${formData.firstName} ${formData.lastName}%0A` +
          `*Phone Number:* ${formData.phone}%0A` +
          `*Alternative Number:* ${formData.altPhone}%0A` +
          `*Exact Delivery Address:* ${formData.address}, ${formData.city}%0A%0A` +
          `*Ordered Products:*%0A${productSummary}%0A%0A` +
          `*Customisation Details:* ${formData.designDetails || "None"}%0A%0A` +
          `*Payment Info (Last 4 / Txid):* ${formData.paymentInfo}%0A` +
          `*Order Total:* ৳${grandTotal.toLocaleString()}%0A%0A` +
          `_Authorized via Felicite Store Terminal_`;

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
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/95 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative w-full max-w-[1240px] h-full md:h-auto md:max-h-[92vh] bg-white md:rounded-2xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row border border-gray-100"
          >
            <button
              onClick={onClose}
              className="fixed md:absolute right-4 top-4 md:right-10 md:top-10 z-[100] p-3 bg-white/80 backdrop-blur-md md:bg-transparent hover:bg-gray-100 rounded-full transition-all group shadow-sm md:shadow-none"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400 md:text-gray-300 group-hover:text-gray-900 transition-colors" />
            </button>

            {/* Left Column: Form (Top on Mobile) */}
            <div className="w-full md:flex-1 md:overflow-y-auto px-5 py-12 md:px-16 lg:px-20 md:py-24 bg-white order-1 md:order-1 scrollbar-hide">
              <header className="mb-12 md:mb-20">
                <h2 className="text-3xl md:text-6xl font-serif text-gray-900 italic tracking-tight mb-4">
                  Checkout
                </h2>
                <div className="h-0.5 md:h-1 w-16 md:w-20 bg-gray-900 mb-6 md:mb-8"></div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
                  Secure Terminal Protocol · Release Authoritative
                </p>
              </header>

              <form
                onSubmit={handleSubmit}
                className="space-y-16 md:space-y-24"
              >
                {/* Step 1: Logistics */}
                <section>
                  <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-gray-900 flex items-center justify-center text-[8px] md:text-[10px] font-black">
                      01
                    </span>
                    <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-gray-900">
                      Shipping Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 md:gap-y-12 gap-x-8 md:gap-x-10">
                    <div className="col-span-1 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="First Name"
                        className="w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Last Name"
                        className="w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="House No, Road Name, Area Details"
                        className="w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-1 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="City / District"
                        className="w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-1 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        Mobile Number (11 Digits)
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="01XXXXXXXXX"
                          className={`w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200 ${phoneError ? "text-red-600" : ""}`}
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            setPhoneError("");
                          }}
                        />
                        {phoneError && (
                          <p className="absolute top-0 right-0 text-red-600 text-[8px] font-black uppercase tracking-widest italic">
                            {phoneError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        Alternative Number (Mandatory)
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="01XXXXXXXXX"
                          className={`w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200 ${altPhoneError ? "text-red-600" : ""}`}
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
                          <p className="absolute top-0 right-0 text-red-600 text-[8px] font-black uppercase tracking-widest italic">
                            {altPhoneError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-b-2 border-gray-100 pb-3 focus-within:border-gray-900 transition-all">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                        Design / Customisation Details
                      </label>
                      <input
                        type="text"
                        placeholder="Short & clear details for your custom article..."
                        className="w-full bg-transparent outline-none text-base md:text-lg font-bold placeholder:text-gray-200"
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
                </section>

                {/* Step 2: Distribution */}
                <section>
                  <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-gray-900 flex items-center justify-center text-[8px] md:text-[10px] font-black">
                      02
                    </span>
                    <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-gray-900">
                      Shipping model
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                    {[
                      { id: "inside", title: "Inside Dhaka", price: "80" },
                      { id: "outside", title: "Outside Dhaka", price: "150" },
                    ].map((zone) => (
                      <div
                        key={zone.id}
                        onClick={() => {
                          if (!(formData.city || "").toLowerCase().length) {
                            setFormData({
                              ...formData,
                              deliveryZone: zone.id as "inside" | "outside",
                            });
                          }
                        }}
                        className={`group p-6 md:p-10 border transition-all duration-700 relative ${formData.deliveryZone === zone.id ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-300 opacity-60"} ${(formData.city || "").toLowerCase().length > 2 ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex justify-between items-start relative z-10">
                          <p
                            className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${formData.deliveryZone === zone.id ? "text-gray-900" : "text-gray-400"}`}
                          >
                            Mode: {zone.id.toUpperCase()}
                          </p>
                          <div
                            className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-gray-900 flex items-center justify-center`}
                          >
                            {formData.deliveryZone === zone.id && (
                              <motion.div
                                layoutId="dot"
                                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-900"
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-6 md:mt-10 relative z-10">
                          <p className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-900">
                            {zone.title}
                          </p>
                          <p className="text-[10px] md:text-[11px] font-bold text-gray-400 mt-1 md:mt-2 uppercase tracking-tighter font-mono">
                            BDT {zone.price}.00
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Step 3: Settlement */}
                <section>
                  <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
                    <span className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-gray-900 flex items-center justify-center text-[8px] md:text-[10px] font-black">
                      03
                    </span>
                    <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-gray-900">
                      Order Details
                    </h3>
                  </div>

                  <div className="bg-[#fbfbfb] border border-black/5 p-6 md:p-14 space-y-12 md:space-y-16">
                    <div className="space-y-4">
                      <p className="text-sm md:text-lg font-black text-gray-900 uppercase tracking-widest">
                        Order Summary & Fulfillment
                      </p>
                      <div className="h-1 w-16 bg-gray-900" />
                      <div className="bg-red-50 border-l-4 border-red-600 p-6 md:p-8 mt-8 space-y-3">
                        <p className="text-[12px] md:text-[16px] font-black text-red-700 uppercase tracking-[0.05em] leading-tight">
                          ⚠ ADVANCE DELIVERY CHARGE IS MANDATORY TO CONFIRM THE
                          ORDER.
                        </p>
                        <p className="text-[10px] md:text-[13px] font-bold text-red-600/80 uppercase tracking-widest leading-relaxed">
                          PLEASE SEND{" "}
                          <span className="text-red-700 font-black underline">
                            ৳80 (INSIDE DHAKA)
                          </span>{" "}
                          OR{" "}
                          <span className="text-red-700 font-black underline">
                            ৳150 (OUTSIDE DHAKA)
                          </span>{" "}
                          TO OUR MERCHANT/PERSONAL NUMBER{" "}
                          <span className="text-red-900 font-black">
                            01974004221
                          </span>{" "}
                          VIA BKASH, NAGAD OR ROCKET.
                        </p>
                        <p className="text-[9px] md:text-[11px] font-black text-red-500 uppercase tracking-[0.2em] italic">
                          ORDERS WITHOUT SETTLEMENT AUTH WILL BE AUTO-CANCELLED.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-10 md:space-y-14">
                      <div className="space-y-6 md:space-y-8">
                        <p className="text-[10px] md:text-[12px] font-black text-gray-400 uppercase tracking-[0.5em]">
                          Personal Treasury Node (bKash/Nagad/Rocket)
                        </p>
                        <div className="flex items-center gap-6 md:gap-12">
                          <h4 className="text-3xl md:text-7xl font-mono font-medium tracking-tighter text-gray-900">
                            01974004221
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleCopy("01974004221", "pay")}
                            className="group p-3 md:p-4 hover:bg-black transition-all border border-black/10 rounded-full"
                          >
                            <Copy
                              className={`w-5 h-5 md:w-7 h-7 transition-colors ${copiedStatus === "pay" ? "text-green-500" : "group-hover:text-white text-gray-300"}`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 md:space-y-10 pt-6">
                        <label className="text-[11px] md:text-[13px] font-black text-gray-950 uppercase tracking-[0.2em] block">
                          Settlement Auth (Last 4 Digits / Transaction ID)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="LAST 4 DIGITS / TRANSACTION ID"
                          className="w-full py-4 md:py-8 px-0 bg-transparent border-b-4 border-gray-200 outline-none focus:border-gray-900 transition-all font-mono text-lg md:text-2xl font-bold tracking-[0.1em] uppercase placeholder:text-gray-200"
                          value={formData.paymentInfo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentInfo: e.target.value,
                            })
                          }
                        />
                        <p className="text-[9px] md:text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                          Notice: Verification is processed manually. आर्टिकल
                          निर्माण Settlement के तुरंत बाद शुरू होता है।
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-8 md:pt-12 mb-10 md:mb-20 space-y-4 md:space-y-6">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmit(null, "COD")}
                    className="w-full py-6 md:py-10 bg-gray-900 text-white font-black flex items-center justify-center gap-4 md:gap-6 hover:bg-black transition-all shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] active:scale-[0.99] disabled:bg-gray-400"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 md:w-7 md:h-7 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 md:w-7 md:h-7" />
                    )}
                    <span className="text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.5em] uppercase">
                      Confirm Order
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmit(null, "WhatsApp")}
                    className="w-full py-6 md:py-8 bg-white border-2 border-gray-900 text-gray-900 font-black flex items-center justify-center gap-4 md:gap-6 hover:bg-gray-50 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase">
                      Order via WhatsApp
                    </span>
                  </button>

                  <p className="text-center text-[7px] md:text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-6 md:mt-10">
                    Auth Reference: {formData.deliveryZone.toUpperCase()}X-
                    {Math.random().toString(36).substring(7).toUpperCase()}
                  </p>
                </div>
              </form>
            </div>

            {/* Right Column: Inventory Summary (Bottom on Mobile) */}
            <div className="w-full md:w-[440px] lg:w-[500px] bg-[#f9f9f9] px-6 py-12 md:p-12 lg:p-20 flex flex-col border-t md:border-t-0 md:border-l border-gray-100 order-2 md:order-2 md:overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="md:sticky md:top-0 md:h-full flex flex-col">
                <h3 className="text-2xl md:text-3xl font-serif text-gray-900 italic tracking-tight mb-10 md:mb-20">
                  Inventory
                </h3>

                <div className="space-y-8 md:space-y-12 flex-1 scrollbar-hide mb-10 md:mb-16">
                  {totalItems.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize}`}
                      className="flex gap-6 md:gap-10 group"
                    >
                      <div className="w-16 h-24 md:w-24 md:h-32 bg-white flex-shrink-0 relative overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[8px] font-black uppercase text-gray-300">
                            Void
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 bg-black text-white text-[8px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#f9f9f9] font-mono">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1 md:py-2">
                        <div>
                          <h4 className="text-[10px] md:text-[11px] font-black text-gray-900 uppercase tracking-[0.15em] md:tracking-[0.2em] leading-tight group-hover:tracking-[0.25em] transition-all">
                            {item.name}
                          </h4>
                          <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] mt-1 md:mt-2">
                            Ref: {item.selectedSize} / ARCHIVE
                          </p>
                        </div>
                        <p className="text-[12px] md:text-[14px] font-black text-gray-900 font-mono">
                          ৳{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 md:pt-12 border-t border-gray-200 space-y-4 md:space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                      Sub-Valuation
                    </span>
                    <span className="font-bold text-gray-900 font-mono text-[10px] md:text-xs">
                      ৳{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                      Logistic Fees
                    </span>
                    <span className="font-bold text-gray-900 font-mono text-[10px] md:text-xs">
                      ৳{deliveryCharge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                      Packaging Fee
                    </span>
                    <span className="font-bold text-gray-300 font-mono text-[10px] md:text-xs line-through italic">
                      ৳35.00
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-8 md:pt-10 border-t border-gray-900">
                    <span className="text-gray-900 font-serif text-xl md:text-2xl italic font-medium">
                      Total
                    </span>
                    <span className="text-gray-900 font-mono text-2xl md:text-4xl font-medium tracking-tighter">
                      ৳{grandTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-8 md:mt-12">
                    <div className="flex gap-1 p-1 bg-white border border-gray-100 focus-within:border-gray-900 transition-all">
                      <input
                        type="text"
                        placeholder="VOUCHER"
                        className="flex-1 px-3 md:px-5 py-3 md:py-4 bg-transparent text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] outline-none placeholder:text-gray-200 font-mono"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-6 md:px-10 py-3 md:py-4 bg-gray-50 text-gray-900 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] hover:bg-black hover:text-white transition-all"
                      >
                        Unlock
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-10 md:pt-16 pb-6 md:pb-0 flex items-center gap-4 md:gap-6 opacity-20">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] leading-relaxed">
                    Authorized Settlement Protocol · Status: Operational
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

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
}: {
  productsList: Product[];
  onAddToCart: (p: Product, size?: string, color?: string) => void;
  onProductClick: (p: Product) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoriesList: string[];
  hasCoupon?: boolean;
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

  // Reset page when category or search changes
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
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                [ Clear Search ]
              </button>
            )}
            <span className="text-xs text-gray-400 font-black mb-1">
              [{filteredProducts.length} ARTICLES]
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12 max-w-xl leading-loose">
            {searchQuery
              ? `Displaying search results across all collections matching your query.`
              : "Precision engineering filtered through aesthetic rebellion. Every piece in the collection is meticulously inspected and verified for quality."}
          </p>
        </Reveal>

        {!searchQuery && (
          <Reveal delay={0.2}>
            <div className="flex gap-x-6 md:gap-x-8 overflow-x-auto scrollbar-hide pb-4 sticky top-[72px] md:top-24 bg-white/80 backdrop-blur-md z-40 px-1 -mx-1">
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
                {searchQuery
                  ? "MISSION FAILED - NO MATCHES FOUND"
                  : "End of Transmission"}
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
              {currentPageNum < totalPages && (
                <button
                  onClick={() => {
                    setCurrentPageNum((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
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

const StylistModule = ({
  isOpen,
  onClose,
  products,
  onProductClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductClick: (p: Product) => void;
}) => {
  const [messages, setMessages] = useState<
    { type: "user" | "ai"; text: string; products?: Product[] }[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
                text: `You are the "FELICITE™ AI Stylist". You are sophisticated, minimalist, and knowledgeable about streetwear.
              Your goal is to provide fashion styling advice based on the user's prompt and our current inventory.
              
              Our Inventory: ${JSON.stringify(products.map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price })))}
              
              Rules:
              1. Be professional, chic, and encouraging. Use minimalist language.
              2. Recommend 2-4 products from the provided inventory.
              3. You MUST return ONLY a valid JSON object.
              4. JSON Structure:
              {
                "analysis": "short vibe analysis",
                "recommended_ids": ["string array of product IDs"],
                "chat_output": "the message to the user"
              }
              
              User Request: ${userText}`,
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

      if (!response.text) {
        throw new Error("AI_RESPONSE_EMPTY");
      }

      const data = JSON.parse(response.text);
      const matchedProducts = products.filter((p) =>
        data.recommended_ids?.includes(p.id),
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            data.chat_output ||
            "I couldn't find a recommendation for that. Try describing a different style.",
          products: matchedProducts,
        },
      ]);
    } catch (err) {
      console.error("Stylist Error:", err);
      const msg = err instanceof Error ? err.message : "";

      let errorDisplay = "SYSTEM INTERRUPTION. PLEASE RESTATE YOUR QUERY.";
      if (
        msg.includes("403") ||
        msg.includes("401") ||
        msg.includes("API_KEY")
      ) {
        errorDisplay =
          "AI SERVICE TEMPORARILY UNAVAILABLE. PLEASE TRY AGAIN LATER.";
      } else {
        errorDisplay = `AI ERROR: ${msg}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: errorDisplay,
        },
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
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
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
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Chat Messages */}
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
                  <div className={`max-w-[85%] space-y-4`}>
                    <div
                      className={`p-5 rounded-2xl text-[11px] font-medium tracking-wide leading-relaxed ${
                        m.type === "user"
                          ? "bg-black text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
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
                                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[8px] font-black uppercase text-gray-300">
                                  Void
                                </div>
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

            {/* Input */}
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
                  className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-20"
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

const InfoPage = ({
  title,
  content,
  onBack,
}: {
  title: string;
  content: string;
  onBack: () => void;
}) => (
  <div className="bg-white min-h-screen pt-32 pb-40 px-8">
    <div className="max-w-3xl mx-auto space-y-16">
      <Reveal>
        <button
          onClick={onBack}
          className="flex items-center gap-2 group text-gray-400 hover:text-black transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Return to baseline
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

const ReturnPortal = ({ onBack }: { onBack: () => void }) => {
  const [orderId, setOrderId] = useState("");
  return (
    <div className="bg-white min-h-screen pt-32 pb-40 px-8">
      <div className="max-w-3xl mx-auto space-y-24">
        <Reveal>
          <button
            onClick={onBack}
            className="flex items-center gap-2 group text-gray-400 hover:text-black transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Return to baseline
            </span>
          </button>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Returns & Exchanges
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
              Integrated Logistics V1.0
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="bg-gray-50 p-12 space-y-12 border border-gray-100">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest">
                Identify Shipment
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed uppercase font-medium">
                ENTER YOUR ORDER ID TO INITIATE THE PROTOCOL. ARTICLES MUST BE
                IN ORIGINAL UNUSED CONDITION WITH TAGS INTACT.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Order Reference
                </label>
                <input
                  type="text"
                  placeholder="E.G. #FLC-102938"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-5 text-sm outline-none focus:border-black font-bold uppercase tracking-widest placeholder:font-normal placeholder:italic transition-all"
                />
              </div>
              <button
                onClick={() =>
                  alert(
                    "Order status: Protocol not yet active in your region. Please contact support via the Contact Form.",
                  )
                }
                className="w-full bg-black text-white py-6 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Locate Article
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest">
                Eligibility
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed uppercase font-medium">
                REPLIES WITHIN 7 DAYS OF DELIVERY. SALE ARTICLES ARE FINAL SALE.
                ACCESSORIES ARE NON-RETURNABLE.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest">
                Global Standards
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed uppercase font-medium">
                ALL SHIPMENTS ARE VERIFIED UNDER HIGH-RESOLUTION IMAGING BEFORE
                DISPATCH TO ENSURE QUALITY CONFORMITY.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

const ContactPage = ({ onBack }: { onBack: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Logic for contact submission removed as per Firebase reduction policy
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err) {
      console.error(err);
      alert("Transmission failed. Emergency backup: contact@felicite.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-40 px-8">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <button
            onClick={onBack}
            className="flex items-center gap-2 group text-gray-400 hover:text-black transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Return to baseline
            </span>
          </button>
          <div className="space-y-4 mb-24">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Contact Portal
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
              Direct Communication Line [ENCRYPTED]
            </p>
          </div>
        </Reveal>

        {isSuccess ? (
          <Reveal>
            <div className="bg-gray-50 p-16 text-center space-y-8 border border-gray-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-widest">
                  Transmission Confirmed
                </h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  Our collective will review your message and reply via
                  encrypted mail within 24-48 hours.
                </p>
              </div>
              <button
                onClick={() => setIsSuccess(false)}
                className="text-[10px] font-black uppercase tracking-[0.3em] underline underline-offset-8"
              >
                New Transmission
              </button>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Your Identity
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="NAME / ALIAS"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border-b border-gray-100 py-4 text-sm outline-none focus:border-black font-bold uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Neural Mail
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border-b border-gray-100 py-4 text-sm outline-none focus:border-black font-bold uppercase tracking-widest"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Transmission Objective
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full border-b border-gray-100 py-4 text-sm outline-none focus:border-black font-bold uppercase tracking-widest bg-transparent"
                >
                  <option>General Inquiry</option>
                  <option>Wholesale Protocol</option>
                  <option>Press & Media</option>
                  <option>Technical Error</option>
                  <option>Return/Exchange</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  The Message
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="DECODE YOUR THOUGHTS..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full border border-gray-100 p-6 text-sm outline-none focus:border-black font-medium uppercase tracking-widest resize-none"
                />
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "ENCRYPTING..." : "INITIALIZE TRANSMISSION"}
              </button>
            </form>
          </Reveal>
        )}
      </div>
    </div>
  );
};

const LoadingScreen = () => {
  return (
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
};

// --- App Component ---

export default function App() {
  const [categories, setCategories] = useState<string[]>([]);

  // Load categories from Supabase
  useEffect(() => {
    supabase
      .from("categories")
      .select("name")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setCategories(data.map((c) => c.name));
        }
      });

    // Real-time sync
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
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "shop"
    | "product"
    | "support"
    | "privacy"
    | "terms"
    | "return"
    | "contact"
  >("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [hasUnlockedCoupon, setHasUnlockedCoupon] = useState(false);
  const [isCouponPopupOpen, setIsCouponPopupOpen] = useState(false);
  const [couponPhone, setCouponPhone] = useState("");
  const [hasShownCoupon, setHasShownCoupon] = useState(false);

  // Coupon Popup Timer
  useEffect(() => {
    if (!hasShownCoupon) {
      const timer = setTimeout(() => {
        setIsCouponPopupOpen(true);
        setHasShownCoupon(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [hasShownCoupon]);

  const handleApplyCoupon = (code: string) => {
    if (code.toLowerCase() === "new10") {
      return 0.1; // 10% discount
    }
    return 0;
  };
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [adminEmail, setAdminEmail] = useState<string>("");

  // Auth State
  useEffect(() => {
    const authorizedEmails = [
      "mimpy124ahon124@gmail.com",
      "feliciteclothing@gmail.com",
    ];

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const isAuthorized = user && authorizedEmails.includes(user.email || "");
      setIsAdmin(!!isAuthorized);
      setAdminEmail(user?.email || "");
      if (!isAuthorized) setIsAdminMode(false);
    });

    // Listen for auth changes
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

  // Listen to Orders and Load Products
  useEffect(() => {
    let ordersChannel: ReturnType<typeof supabase.channel> | null = null;

    // LOW-COST ARCHITECTURE:
    // 1. Regular users only load from local products.json (initialized in state)
    // 2. Admin-only collections (orders) are ONLY fetched if isAdmin is true

    if (isAdmin) {
      // Fetch orders once for admins
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (error) console.error("Orders fetch error:", error);
          else setOrders(data || []);
        });

      // Real-time orders subscription
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

    // Load products from Supabase (public, no auth needed)
    supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Products fetch error:", error);
          // Fallback to local products.json via API if Supabase fails
          fetch("/api/products")
            .then((res) => res.json())
            .then((localData) => {
              if (Array.isArray(localData) && localData.length > 0)
                setProductsList(localData);
            })
            .catch(console.error);
        } else if (data && data.length > 0) {
          setProductsList(
            data.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              currency: p.currency || "BDT",
              category: p.category,
              image: p.image || "",
              gallery: p.gallery || [],
              colors: p.colors || [],
              sizes: p.sizes || ["S", "M", "L"],
              description: p.description || "",
              isNewArrival: p.is_new_arrival,
              soldOut: p.sold_out,
              stock: p.stock,
            })),
          );
        } else {
          // No products in DB yet — fall back to local JSON so the store isn't empty
          fetch("/api/products")
            .then((res) => res.json())
            .then((localData) => {
              if (Array.isArray(localData) && localData.length > 0)
                setProductsList(localData);
            })
            .catch(console.error);
        }
        setIsLoading(false);
      });

    // Real-time product changes (adds/edits/deletes reflect instantly)
    const productsChannel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          supabase
            .from("products")
            .select("*")
            .order("sort_order", { ascending: true })
            .then(({ data }) => {
              if (data)
                setProductsList(
                  data.map((p) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    currency: p.currency || "BDT",
                    category: p.category,
                    image: p.image || "",
                    gallery: p.gallery || [],
                    colors: p.colors || [],
                    sizes: p.sizes || ["S", "M", "L"],
                    description: p.description || "",
                    isNewArrival: p.is_new_arrival,
                    soldOut: p.sold_out,
                    stock: p.stock,
                  })),
                );
            });
        },
      )
      .subscribe();

    return () => {
      if (ordersChannel) supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [isAdmin]);

  // Scroll to top on page or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentPage, selectedProduct]);

  // Remove the static 3s timer and let it depend on data loading if possible
  // or keep it as a fallback but shorter
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 5000); // 5s safety fallback
    return () => clearTimeout(timer);
  }, []);

  const toggleAdmin = async () => {
    if (!isAdmin) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsAdminMode(true);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error(err);
    }
  };

  const addOrUpdateProduct = async (p: any) => {
    // Map camelCase Product fields → snake_case DB columns
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
        // Update existing
        const { error } = await supabase
          .from("products")
          .update(dbRow)
          .eq("id", p.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("products").insert([dbRow]);
        if (error) throw error;
      }
      // Realtime subscription will update productsList automatically
    } catch (err) {
      console.error("Product save error:", err);
      alert("Failed to save product. Check console.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Terminate this article from inventory?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      // Realtime will sync — also optimistic local update
      setProductsList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Product delete error:", err);
    }
  };

  const addToCart = (
    product: Product,
    selectedSize?: string,
    selectedColor?: string,
  ) => {
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

  const handleProductClick = (p: Product) => {
    setSelectedProduct(p);
    setCurrentPage("product");
  };

  const handleUpdateCategories = async (newCats: string[]) => {
    // Delete all, re-insert in new order
    await supabase.from("categories").delete().neq("id", 0);
    const rows = newCats.map((name, i) => ({ name, sort_order: i }));
    const { error } = await supabase.from("categories").insert(rows);
    if (error) {
      console.error("Category save error:", error);
      alert("Failed to save categories.");
    }
    // Realtime will update state automatically
  };
  const handleLeadCapture = (phone: string) => {
    if (phone.length >= 10) {
      setHasUnlockedCoupon(true);
      alert(
        "Coupon code unlocked! The 10% discount is now active.\nCode: new10",
      );
      setIsCouponPopupOpen(false);
    } else {
      alert("Invalid contact digits. Protocol rejected.");
    }
  };

  if (isAdminMode && isAdmin) {
    return (
      <AdminDashboard
        orders={orders}
        productsList={productsList}
        categories={categories}
        onUpdateStatus={updateOrderStatus}
        onDeleteOrder={deleteOrder}
        onAddProduct={addOrUpdateProduct}
        onDeleteProduct={deleteProduct}
        onUpdateCategories={handleUpdateCategories}
        adminEmail={adminEmail}
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
            <p className="text-gray-500 text-[12px] md:text-[14px] leading-relaxed md:leading-loose font-medium max-w-sm mx-auto">
              {orderSuccess.payment_method === "WhatsApp"
                ? "Your order details have been saved to our manifest. Please complete the final step in the WhatsApp chat to finalize dispatch."
                : "Your order has been logged into our secure registry. Our logistics team will call you for final vocal verification shortly."}
            </p>
          </div>
          <div className="bg-gray-50/50 p-5 md:p-8 text-left border border-gray-100 rounded-sm space-y-6">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                Order Manifest
              </p>
              <div className="space-y-1">
                {orderSuccess.items.map((item: any, idx: number) => (
                  <p key={idx} className="text-[11px] md:text-[12px] font-bold">
                    {item.name} ({item.selectedSize}/
                    {item.selectedColor || "Default"}) x{item.quantity}
                  </p>
                ))}
              </div>
            </div>

            {orderSuccess.customer_info.designDetails && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Customisation
                </p>
                <p className="text-[11px] md:text-[12px] font-medium text-gray-600 italic">
                  "{orderSuccess.customer_info.designDetails}"
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-6">
              <div className="flex-1">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Shipping To
                </p>
                <p className="text-[11px] md:text-[12px] font-black">
                  {orderSuccess.customer_info.socialName ||
                    `${orderSuccess.customer_info.firstName} ${orderSuccess.customer_info.lastName}`}
                </p>
                <p className="text-[10px] md:text-[11px] text-gray-500 line-clamp-2">
                  {orderSuccess.customer_info.address}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Financials
                </p>
                <p className="text-[16px] md:text-[18px] font-black">
                  ৳{orderSuccess.grandTotal?.toLocaleString()}
                </p>
                <p className="text-[8px] text-gray-400 uppercase font-bold">
                  Incl. Shipping
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOrderSuccess(null);
              setCart([]);
            }}
            className="w-full py-4 md:py-5 bg-black text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20"
          >
            {" "}
            Back to Collections{" "}
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
      {/* Coupon Popup */}
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
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                  coupon for your next order.
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
        setCurrentPage={setCurrentPage}
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
            <Hero setCurrentPage={setCurrentPage} />
            <Categories
              onCategorySelect={setSelectedCategory}
              setCurrentPage={setCurrentPage}
            />
            <section id="new-arrivals" className="py-24 md:py-32 bg-white px-0">
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
                <div className="w-full px-0">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-1">
                    {productsList.slice(0, 5).map((product) => (
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
              </div>
              <div className="mt-32 flex justify-center px-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage("shop")}
                  className="px-16 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-black/20"
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
              onBack={() => setCurrentPage("shop")}
              onProductClick={handleProductClick}
              hasCoupon={hasUnlockedCoupon}
            />
          )
        ) : currentPage === "support" ? (
          <InfoPage
            title="Support"
            onBack={() => setCurrentPage("home")}
            content={`Our support collective is available to assist with your order requirements. 

Dispatch Status:
Orders are processed within 24-48 hours. You will receive a notification once the shipment has been picked up by our logistics partner.

Sizing Consultation:
Review the Size Chart available on each product page. Our articles follow a modern streetwear fit, typically slightly oversized.

Payment:
We currently support Cash on Delivery for all regions in Bangladesh.

Security:
Your data is encrypted and handled according to global standards.`}
          />
        ) : currentPage === "privacy" ? (
          <InfoPage
            title="Privacy Protocol"
            onBack={() => setCurrentPage("home")}
            content={`FELICITE™ prioritizes individual data sovereignty.

Data Collection:
We collect identity information solely for the purpose of shipment fulfillment and communication.

Storage:
Information is stored on secure, encrypted decentralised servers. We do not sell user data to third-party entities.

Transparency:
You may request the deletion of your customer profile at any time via the contact portal.`}
          />
        ) : currentPage === "terms" ? (
          <InfoPage
            title="Terms of Service"
            onBack={() => setCurrentPage("home")}
            content={`Agreement of Use:
By accessing FELICITE™, you agree to abide by our collection protocols and ethical standards.

Orders:
We reserve the right to cancel orders that appear fraudulent or violate our terms.

Intellectual Property:
All designs, visual assets, and trademarks are the sole property of FELICITE™.

Governing Law:
Usage of this platform is governed by the laws of Bangladesh.`}
          />
        ) : currentPage === "return" ? (
          <ReturnPortal onBack={() => setCurrentPage("home")} />
        ) : currentPage === "contact" ? (
          <ContactPage onBack={() => setCurrentPage("home")} />
        ) : null}
      </main>

      <Footer setCurrentPage={setCurrentPage} />

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
