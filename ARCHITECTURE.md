# Celifoto E-commerce Architecture

## 1. System Architecture Diagram
```text
[ User Browser ]
      |
      | (A) Static Assets (HTML/JS/CSS/JSON)
      v
[ Vercel CDN Layer ] <--- (High Performance, Edge Cached)
      |
      | (B) Product Data (Static JSON / API Routes)
      v
[ Application Logic ] (React + Vite)
      |
      | (C) Auth & Order Submission
      v
[ Firebase / Firestore ] (Order Processing Database)
      |
      | (D) Webhook / Admin Access
      v
[ Admin Dashboard ] (Internal Management)
```

## 2. Data Flow
1. **User Discovery**: User enters the site via Meta Ads. Request is served instantly by Vercel's global CDN.
2. **Product View**: Product list and details are loaded from a localized `products.json` or a static constant. **Zero database reads** occur here, making it immune to traffic spikes and keeping costs at $0.
3. **Checkout (COD)**: User fills their info in the checkout form.
4. **Order Storage**: The application submits a write request to Firestore. Firestore Security Rules validate the schema, immutability, and timestamp.
5. **Success**: User receives immediate confirmation. Admin is notified (can be via Firebase Cloud Functions or dashboard polling).

## 3. Recommended Tech Stack
- **Frontend**: React 19 + Vite (Fast builds, optimized bundles).
- **Styling**: Tailwind CSS 4 (Utility-first, minimal CSS overhead).
- **Animations**: Framer Motion (Premium micro-interactions).
- **Backend/DB**: Google Firebase / Cloud Firestore (Serverless, scalable).
- **Hosting**: Vercel (Optimized for React/Vite, Edge caching).
- **Analytics**: Meta Pixel + Google Analytics 4 (Traffic tracking).

## 4. Scalability Explanation
- **Spike Resilience**: Since products are served as static data, 10,000+ concurrent visitors only hit Vercel's CDN. Vercel automatically scales to handle millions of requests without manual intervention.
- **Cost Efficiency**: Database costs are usually driven by reads. In this architecture, **Reads are 0** for visitors. Users only perform a **single Write** during checkout. This keeps Firebase costs nearly zero even with high traffic.
- **SEO Optimization**: By keeping the structure flat and assets lightweight, we achieve a high Lighthouse score, which is critical for Meta Ad quality scores and organic ranking.
- **COD Ready**: The flow is streamlined for the local market requirements where Cash on Delivery is the primary payment method, reducing friction and increasing conversion rates from ads.
