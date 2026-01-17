# Zenith X - Motion Web Experience

A high-performance "scrollytelling" experience for a premium headphone brand, featuring a seamless 3D-sequence animation driven by scroll.

🔗 **Live Demo:** [https://zenith-3d.vercel.app/](https://zenith-3d.vercel.app/)

## 🚀 Technologies

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animation Engine:** [GSAP](https://gsap.com/) (ScrollTrigger)
*   **Smooth Scrolling:** [Lenis](https://github.com/darkroomengineering/lenis)
*   **3D Sequences:** Canvas-based frame interpolation

## ✨ Features

*   **Cinematic Scrollytelling:** Scroll-driven image sequence animation (120 frames).
*   **Smooth Momentum Scroll:** Integrated Lenis with GSAP for a buttery-smooth feel.
*   **Smart Snapping:** Automatically snaps to key product features (Title, Precision, Titanium, CTA).
*   **Responsive Scaling:** Intelligent `contain/cover` logic for perfect visibility on both Mobile and Desktop.
*   **Loading Splash Screen:** Premium entrance animation with asset preloading and scroll locking.

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
