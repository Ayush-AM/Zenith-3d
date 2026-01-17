"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 120;

export default function HeadphoneScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Lock scroll during loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  // Load Images
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      let count = 0;

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        const frameNumber = i.toString().padStart(3, "0");
        img.src = `/sequence/frame_${frameNumber}_delay-0.04s.jpg`;
        
        await new Promise((resolve) => {
           img.onload = () => {
             count++;
             setLoadedCount(prev => count);
             resolve(true); 
           }
           img.onerror = () => {
               console.error(`Failed to load frame ${i}`);
               resolve(true);
           }
        });
        loadedImages.push(img);
      }
      
      setImages(loadedImages);
      setIsLoading(false);
    };

    loadImages();
  }, []);

  const renderFrame = (index: number) => {
      if (!canvasRef.current || !images[index]) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const img = images[index];

      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw image "cover" style
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        
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

  useLayoutEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            if (images.length > 0) renderFrame(0);
        }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [images]);

  useGSAP(() => {
    if (isLoading || images.length === 0) return;

    const playhead = { frame: 0 };
    
    // Master Timeline
    // We want to control the exact timing of frames vs text
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.1, // Faster scrub response
            pin: canvasRef.current,
            snap: {
                snapTo: [0, 0.33, 0.66, 1],
                duration: { min: 0.1, max: 0.3 }, // Faster snap
                ease: "power2.inOut",
                delay: 0, // Instant snap check
            }
        }
    });

    // 1. Frame Animation (Linear throughout the scroll)
    tl.to(playhead, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        duration: 1, 
        onUpdate: () => renderFrame(Math.round(playhead.frame)),
    }, 0);

    // 2. Text Animations matched to [0, 0.33, 0.66, 1]
    
    // Section 1: Title (Starts Visible)
    // Fade OUT around 0.15
    tl.to(".text-section-1", { opacity: 0, scale: 0.9, filter: "blur(10px)", duration: 0.15, ease: "power2.in" }, 0.05);

    // Section 2: Precision (Visible at 0.33)
    // 0.23 -> 0.33 (In) -> 0.43 (Out)
    tl.fromTo(".text-section-2", 
        { opacity: 0, y: 50, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1, ease: "power2.out" }, 
        0.23
    );
    tl.to(".text-section-2", 
        { opacity: 0, y: -50, filter: "blur(10px)", duration: 0.1, ease: "power2.in" }, 
        0.43
    );

    // Section 3: Titanium (Visible at 0.66)
    // 0.56 -> 0.66 (In) -> 0.76 (Out)
    tl.fromTo(".text-section-3", 
        { opacity: 0, x: 50, filter: "blur(10px)" }, // Come from right
        { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.1, ease: "power2.out" }, 
        0.56
    );
    tl.to(".text-section-3", 
        { opacity: 0, x: -50, filter: "blur(10px)", duration: 0.1, ease: "power2.in" }, 
        0.76
    );

    // Section 4: CTA (Visible at 1.0)
    // 0.90 -> 1.0 (In)
    tl.fromTo(".text-section-4",
        { opacity: 0, scale: 1.1, filter: "blur(10px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.1, ease: "power2.out" },
        0.9
    );


  }, { scope: containerRef, dependencies: [isLoading, images] });


  return (
    // 400vh height for faster pacing (less scroll distance)
    <div ref={containerRef} className="relative w-full" style={{ height: "400vh" }}>
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <p className="text-sm tracking-widest uppercase opacity-60">Loading Assets ({Math.round((loadedCount / FRAME_COUNT) * 100)}%)</p>
            </div>
        </div>
      )}

      {/* Pinned Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
         <canvas 
            ref={canvasRef} 
            className="absolute inset-0 block h-full w-full object-cover"
         />
         
         {/* -- Section 1: Title -- */}
         <div className="text-section-1 absolute inset-0 flex items-center justify-center pointer-events-none">
             <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white/90 text-center drop-shadow-2xl">
                Zenith X.<br/>
                <span className="text-4xl md:text-6xl text-white/60 font-medium">Pure Sound.</span>
             </h1>
         </div>

         {/* -- Section 2: Precision -- */}
         <div className="text-section-2 absolute inset-0 flex items-center justify-start pl-10 md:pl-32 pointer-events-none opacity-0">
             <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-semibold text-white/90 tracking-tight drop-shadow-lg">Precision Engineering.</h2>
                <div className="h-1 w-20 bg-white/50 my-4" />
                <p className="text-xl text-white/80 font-light leading-relaxed">Crafted with aerospace-grade aluminum for clear, resonance-free audio. Every curve is calculated for acoustic perfection.</p>
             </div>
         </div>

         {/* -- Section 3: Titanium -- */}
         <div className="text-section-3 absolute inset-0 flex items-center justify-end pr-10 md:pr-32 pointer-events-none opacity-0">
             <div className="max-w-xl text-right flex flex-col items-end">
                <h2 className="text-4xl md:text-5xl font-semibold text-white/90 tracking-tight drop-shadow-lg">Titanium Drivers.</h2>
                <div className="h-1 w-20 bg-white/50 my-4" />
                <p className="text-xl text-white/80 font-light leading-relaxed">50mm custom-tuned drivers deliver deep bass and crystal clear highs. Experience sound as the artist intended.</p>
             </div>
         </div>

         {/* -- Section 4: CTA -- */}
         <div className="text-section-4 absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
             <div className="text-center pointer-events-auto">
                <h2 className="text-6xl md:text-7xl font-bold text-white/90 tracking-tighter mb-8 drop-shadow-2xl">Hear Everything.</h2>
                <button className="relative overflow-hidden rounded-full bg-white px-10 py-5 text-xl font-bold text-black transition-transform hover:scale-105 active:scale-95 group">
                    <span className="relative z-10">Pre-order Now</span>
                    <div className="absolute inset-0 bg-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"/>
                </button>
             </div>
         </div>

      </div>
    </div>
  );
}
