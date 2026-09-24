import React, { useState } from "react";
import {
  Truck,
  ShieldCheck,
  RotateCw,
  Sparkles,
  ArrowUp,
  Check,
  Copy,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";

interface FooterProps {
  setCurrentPage: (page: string) => void;
  hasBanner?: boolean;
  onCategorySelect?: (category: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  setCurrentPage,
  hasBanner = false,
  onCategorySelect,
  onOpenAdmin,
}) => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(() => {
    try {
      return localStorage.getItem("felicite_newsletter_subscribed") === "true";
    } catch {
      return false;
    }
  });
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address");
      setSubscribeStatus("error");
      return;
    }
    setSubscribeStatus("loading");
    setErrorMessage("");

    setTimeout(() => {
      try {
        localStorage.setItem("felicite_newsletter_subscribed", "true");
        localStorage.setItem("felicite_newsletter_email", email);
      } catch {
        // ignore
      }
      setIsSubscribed(true);
      setSubscribeStatus("success");
      setEmail("");
    }, 450);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("feliciteclothing@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    }
    setCurrentPage("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageClick = (pageName: string) => {
    setCurrentPage(pageName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      aria-label="Site Footer"
      className={`bg-[#080808] text-neutral-300 border-t border-white/10 relative z-20 font-sans antialiased transition-all ${
        hasBanner ? "mt-0" : "mt-20 md:mt-32"
      }`}
    >
      {/* ─────────────────────────────────────────────
          1. VIP ARCHIVE NEWSLETTER STRIP
      ───────────────────────────────────────────── */}
      <div className="border-b border-white/[0.08] bg-black/60">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Headline & Manifesto */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 uppercase font-sans">
                  PRIVATE ACCESS DISPATCH
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.01em] text-white uppercase font-sans">
                JOIN THE FELICITÉ ARCHIVE
              </h3>
              <p className="text-sm text-neutral-400 max-w-lg leading-relaxed font-normal font-sans">
                Receive confidential drop announcements, private showroom invitations, and
                first priority access to limited capsule runs before public release.
              </p>
            </div>

            {/* Right: Working Subscription Input */}
            <div className="lg:col-span-6">
              {isSubscribed ? (
                <div className="bg-white/5 border border-white/15 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-[0.15em] font-sans">
                        Archive Membership Confirmed
                      </p>
                      <p className="text-[11px] text-neutral-400 font-sans">
                        You have VIP priority access to upcoming limited collections.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubscribed(false);
                      setSubscribeStatus("idle");
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white underline uppercase tracking-[0.12em] shrink-0 transition-colors font-sans"
                  >
                    Change Email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="ENTER YOUR EMAIL FOR VIP ENTRY..."
                        className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/15 focus:border-white/40 rounded-lg pl-11 pr-4 py-3 text-xs md:text-sm text-white placeholder-neutral-500 tracking-wide font-sans outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={subscribeStatus === "loading"}
                      className="px-6 py-3 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 rounded-lg text-xs font-bold uppercase tracking-[0.18em] font-sans flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-60"
                    >
                      {subscribeStatus === "loading" ? (
                        <span>Enrolling...</span>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                  {errorMessage ? (
                    <p className="text-[11px] text-red-400 font-sans tracking-wide pl-1">{errorMessage}</p>
                  ) : (
                    <p className="text-[10px] text-neutral-500 font-sans tracking-wide pl-1">
                      Strict privacy · No marketing clutter · Unsubscribe anytime.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. SERVICE PILLARS & TRUST BADGES
      ───────────────────────────────────────────── */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Truck className="w-5 h-5 text-neutral-200" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-sans">
                  Express Delivery
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Inside Dhaka in 24–48 hrs (৳80). All districts across Bangladesh in 3–5 days (৳150).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-neutral-200" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-sans">
                  Cash on Delivery
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Inspect your garment at your doorstep before payment across all 64 districts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                <RotateCw className="w-5 h-5 text-neutral-200" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-sans">
                  3-Day Exchange Guarantee
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Simple, hassle-free size and silhouette exchanges for unworn pieces with tags intact.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-neutral-200" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-sans">
                  Heavyweight Craft
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  100% combed cotton, 380+ GSM ultra-soft fleece, and custom boxy architectural cuts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. MAIN NAVIGATION & CONCIERGE DIRECTORY
      ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Column 1: Brand Wordmark & Atelier Profile (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <h2
                className="text-3xl sm:text-4xl font-black tracking-[0.18em] text-white uppercase cursor-pointer hover:opacity-80 transition-opacity font-sans"
                onClick={() => handlePageClick("home")}
              >
                FELICITÉ
              </h2>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 uppercase font-sans">
                CONTEMPORARY READY-TO-WEAR
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm font-sans font-normal">
              Architectural cuts, heavyweight custom textiles, and progressive streetwear drape.
              Every garment is developed in Dhaka and crafted in strictly limited capsule editions.
            </p>

            <div className="space-y-3 pt-2 text-xs font-sans">
              <div className="flex items-center gap-2.5 text-neutral-300">
                <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>Dhaka, Bangladesh · Worldwide Dispatch</span>
              </div>
              <div className="flex items-center gap-2.5 text-neutral-300">
                <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                <a
                  href="mailto:feliciteclothing@gmail.com"
                  className="hover:text-white transition-colors underline-offset-4 hover:underline font-medium"
                >
                  feliciteclothing@gmail.com
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email address"
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {copiedEmail && (
                  <span className="text-[10px] text-emerald-400 font-sans font-medium tracking-wide">Copied</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-neutral-300">
                <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                <a
                  href="https://wa.me/8801974004221"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors font-medium tracking-wide font-sans"
                >
                  +880 1974-004221
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Collections & Archive (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold tracking-[0.18em] text-white uppercase font-sans">
              Archive & Shop
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-400 font-sans font-medium">
              <li>
                <button
                  onClick={() => handleCategoryClick("BOXY FIT T-SHIRTS")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  Boxy Fit T-Shirts
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("Hoodies")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  Heavyweight Hoodies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("Bottoms")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  Pants & Bottoms
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("Premium Stone wash Tee")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  Stone Wash Tees
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("Palestine Merch")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  Palestine Capsule
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick("All")}
                  className="text-white hover:text-neutral-300 font-semibold transition-colors hover:translate-x-1 transform duration-200 inline-flex items-center gap-1.5"
                >
                  View All Products →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Care & Policies (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold tracking-[0.18em] text-white uppercase font-sans">
              Client Care
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-400 font-sans font-medium">
              <li>
                <button
                  onClick={() => handlePageClick("support")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Support & Assistance
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("return")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Returns & 3-Day Exchange
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("shipping")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Shipping Rates & Timelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("sizing")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Sizing & Fit Consultation
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("care")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Garment Care & Wash Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => handlePageClick("contact")}
                  className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Dedicated WhatsApp Concierge & Hours (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold tracking-[0.18em] text-white uppercase font-sans">
              Direct Concierge
            </h4>

            {/* Concierge Box */}
            <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-semibold tracking-[0.14em] text-emerald-400 uppercase font-sans">
                    Live Concierge Online
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase font-sans">
                  BST (UTC+6)
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans font-normal">
                Connect directly with our styling team for size recommendations, parcel tracking, or bulk custom requests.
              </p>

              <a
                href="https://wa.me/8801974004221?text=Hello%20Felicite%2C%20I%20have%20an%20inquiry%20regarding%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-[0.15em] font-sans flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <div className="pt-1 flex items-center gap-2 text-[11px] text-neutral-400 font-sans font-medium">
                <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                <span>Active: 10:00 AM – 10:00 PM Daily</span>
              </div>
            </div>

            {/* Quick Legal Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-neutral-400 pt-1 font-sans font-medium">
              <button
                onClick={() => handlePageClick("privacy")}
                className="hover:text-white transition-colors"
              >
                Privacy
              </button>
              <span>·</span>
              <button
                onClick={() => handlePageClick("terms")}
                className="hover:text-white transition-colors"
              >
                Terms
              </button>
              {onOpenAdmin && (
                <>
                  <span>·</span>
                  <button
                    onClick={onOpenAdmin}
                    className="hover:text-white transition-colors"
                  >
                    Terminal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          4. BOTTOM COLOPHON & PAYMENT PARTNERS
      ───────────────────────────────────────────── */}
      <div className="border-t border-white/[0.08] bg-black font-sans">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Copyright */}
            <div className="text-center md:text-left space-y-1">
              <p className="text-[11px] text-neutral-400 font-sans tracking-[0.14em] uppercase font-semibold">
                © {new Date().getFullYear()} FELICITÉ CLOTHING CO. ALL RIGHTS RESERVED.
              </p>
              <p className="text-[10px] text-neutral-500 font-sans tracking-[0.18em] uppercase font-medium">
                HAUTE READY-TO-WEAR · DHAKA · CASUAL & LUXURY STREETWEAR
              </p>
            </div>

            {/* Center: Accepted Payment & Delivery Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <span className="text-[10px] font-sans font-semibold text-neutral-400 uppercase tracking-[0.15em] pr-1 hidden sm:inline">
                Accepted:
              </span>
              <div className="px-2.5 py-1 bg-white/[0.05] border border-white/10 rounded text-[10px] font-sans text-neutral-300 font-semibold uppercase tracking-wider">
                Cash on Delivery
              </div>
              <div className="px-2.5 py-1 bg-[#E2136E]/10 border border-[#E2136E]/30 rounded text-[10px] font-sans text-[#E2136E] font-bold tracking-wider">
                bKash
              </div>
              <div className="px-2.5 py-1 bg-[#F7931E]/10 border border-[#F7931E]/30 rounded text-[10px] font-sans text-[#F7931E] font-bold tracking-wider">
                Nagad
              </div>
              <div className="px-2.5 py-1 bg-white/[0.05] border border-white/10 rounded text-[10px] font-sans text-neutral-300 font-bold tracking-wider">
                VISA
              </div>
              <div className="px-2.5 py-1 bg-white/[0.05] border border-white/10 rounded text-[10px] font-sans text-neutral-300 font-bold tracking-wider">
                Mastercard
              </div>
            </div>

            {/* Right: Social Channels & Back to Top */}
            <div className="flex items-center gap-5">
              {/* Social Channels */}
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com/feliciteclo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Felicite Facebook"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:scale-105"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/feliciteclo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Felicite Instagram"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:scale-105"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/8801974004221"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Felicite WhatsApp"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/feliciteclo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Felicite X / Twitter"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all hover:scale-105"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>

              {/* Back to Top */}
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Scroll back to top"
                className="group flex items-center gap-1.5 py-1.5 px-3 bg-white/[0.04] hover:bg-white/15 border border-white/10 rounded-full text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-neutral-300 hover:text-white transition-all hover:border-white/30 cursor-pointer"
              >
                <span>TOP</span>
                <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
