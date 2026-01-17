"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion, AnimatePresence } from "framer-motion";

const FRAME_COUNT = 120;

export default function HeadphoneScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll progress for the container
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress (0-1) to frame index (0-119)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      let count = 0;

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        const frameNumber = i.toString().padStart(3, "0");
        img.src = `/sequence/frame_${frameNumber}_delay-0.04s.jpg`;
        
        await new Promise((resolve, reject) => {
           img.onload = () => {
             count++;
             setLoadedCount(count);
             resolve(true); 
           }
           img.onerror = () => {
               console.error(`Failed to load frame ${i}`);
               resolve(true); // Resolve anyway to continue
           }
        });
        loadedImages.push(img);
      }
      
      setImages(loadedImages);
      setIsLoading(false);
    };

    loadImages();
  }, []);

  useEffect(() => {
    // Render loop hooked into scroll change
    const updateCanvas = (index: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      const img = images[index];

      if (canvas && context && img) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw image "cover" style (Full Screen)
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio); // Use MAX for cover
        
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        
        context.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            centerShift_x,
            centerShift_y,
            img.width * ratio,
            img.height * ratio
        );
      }
    };

    // Subscribe to frameIndex changes
    const unsubscribe = frameIndex.on("change", (latest) => {
        const index = Math.round(latest);
        // Ensure index is within bounds
        const safeIndex = Math.max(0, Math.min(index, FRAME_COUNT - 1));
        if (!isLoading && images.length > 0) {
            requestAnimationFrame(() => updateCanvas(safeIndex));
        }
    });

    // Initial draw
    if (!isLoading && images.length > 0) {
        updateCanvas(0);
    }
    
    // Handle Window Resize
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            // Redraw current frame
            const currentIndex = Math.round(frameIndex.get());
            if (!isLoading && images.length > 0) {
                 updateCanvas(currentIndex);
            }
        }
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Init size

    return () => {
        unsubscribe();
        window.removeEventListener("resize", handleResize);
    };
  }, [isLoading, images, frameIndex]);

  // Adjust triggers for 4 sections (0, 0.33, 0.66, 1) implies 3 scroll "gaps" but 4 snap points.
  // The scrollYProgress goes from 0 (top of section 1) to 1 (bottom of section 4? No, bottom of scroll)
  // Our structure: 4 sections of 100vh. Total scrollable height = 400vh. Viewport = 100vh.
  // Max scroll offset = 300vh.
  // 0% scroll = Section 1 in view.
  // 33.3% scroll = Section 2 in view.
  // 66.6% scroll = Section 3 in view.
  // 100% scroll = Section 4 in view.

  // Text Animation Opacity Logic
  
  // Section 1: Title (Visible at 0, Fade out quickly by 0.1)
  const opacityTitle = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  
  // Section 2: Precision (Visible at 0.33)
  // Fade/Slide in later (0.23 -> 0.33) for "immediate" feel
  // Fade out quickly (0.33 -> 0.43)
  const opacityPrecision = useTransform(scrollYProgress, [0.23, 0.33, 0.43], [0, 1, 0]);
  const xPrecision = useTransform(scrollYProgress, [0.23, 0.33], [-100, 0]); // Increased distance for snappier effect
  
  // Section 3: Titanium (Visible at 0.66)
  // Fade/Slide in later (0.56 -> 0.66)
  // Fade out quickly (0.66 -> 0.76)
  const opacityTitanium = useTransform(scrollYProgress, [0.56, 0.66, 0.76], [0, 1, 0]);
  const xTitanium = useTransform(scrollYProgress, [0.56, 0.66], [100, 0]);

  // Section 4: CTA (Visible at 1.0)
  // Fade in later (0.9 -> 1.0)
  const opacityCTA = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

  return (
    <div 
        ref={containerRef} 
        className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-background relative"
    >
      {/* Fixed Content Layer (Canvas + Text) */}
      <div className="fixed inset-0 h-full w-full overflow-hidden pointer-events-none">
        
        {/* Loading Spinner */}
        <AnimatePresence>
            {isLoading && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-background text-white pointer-events-auto"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                        <p className="text-sm tracking-widest uppercase opacity-60">Loading Assets ({Math.round((loadedCount / FRAME_COUNT) * 100)}%)</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 block h-full w-full object-cover"
        />

        {/* Text Layer: Title */}
        <motion.div style={{ opacity: opacityTitle }} className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white/90 text-center">
                Zenith X.<br/>
                <span className="text-4xl md:text-6xl text-white/60 font-medium">Pure Sound.</span>
            </h1>
        </motion.div>

        {/* Text Layer: Precision (Left) */}
        <motion.div style={{ opacity: opacityPrecision, x: xPrecision }} className="absolute inset-0 flex items-center justify-start pl-10 md:pl-32">
             <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-semibold text-white/90 tracking-tight">Precision Engineering.</h2>
                <p className="mt-4 text-xl text-white/60">Crafted with aerospace-grade aluminum for clear, resonance-free audio.</p>
             </div>
        </motion.div>

        {/* Text Layer: Titanium (Right) */}
        <motion.div style={{ opacity: opacityTitanium, x: xTitanium }} className="absolute inset-0 flex items-center justify-end pr-10 md:pr-32">
             <div className="max-w-xl text-right">
                <h2 className="text-4xl md:text-5xl font-semibold text-white/90 tracking-tight">Titanium Drivers.</h2>
                <p className="mt-4 text-xl text-white/60">50mm custom-tuned drivers deliver deep bass and crystal clear highs.</p>
             </div>
        </motion.div>

        {/* Text Layer: CTA */}
        <motion.div style={{ opacity: opacityCTA }} className="absolute inset-0 flex items-center justify-center">
             <div className="text-center pointer-events-auto">
                <h2 className="text-6xl md:text-7xl font-bold text-white/90 tracking-tighter mb-8">Hear Everything.</h2>
                <button className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:scale-105 hover:bg-gray-200">
                    Pre-order Now
                </button>
             </div>
        </motion.div>

      </div>

      {/* Scroll Snap Sections (Ghost Content) */}
      <div className="relative z-10 pointer-events-none">
        <section className="h-screen w-full snap-start snap-always" /> {/* Title */}
        <section className="h-screen w-full snap-start snap-always" /> {/* Precision */}
        <section className="h-screen w-full snap-start snap-always" /> {/* Titanium */}
        <section className="h-screen w-full snap-start snap-always" /> {/* CTA */}
      </div>

    </div>
  );
}
