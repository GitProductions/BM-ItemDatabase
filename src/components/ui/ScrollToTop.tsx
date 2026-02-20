"use client";
import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    const container: Element | Window | null = document.querySelector('main') || window;

    const getScrollTop = () => {
      if (container === window) return window.pageYOffset || document.documentElement.scrollTop || 0;
      return (container as Element).scrollTop || 0;
    };

    const onScroll = () => setIsVisible(getScrollTop() > 600);

    if (container === window) {
      window.addEventListener('scroll', onScroll, { passive: true });
    } else {
      (container as Element).addEventListener('scroll', onScroll, { passive: true });
    }



    // Watch the footer so the button lifts above it when it comes into view
    const footer = document.querySelector('footer');
    let observer: IntersectionObserver | null = null;
    if (footer) {
      observer = new IntersectionObserver(
        ([entry]) => setNearFooter(entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(footer);
    }


    return () => {
      if (container === window) {
        window.removeEventListener('scroll', onScroll);
      } else {
        (container as Element).removeEventListener('scroll', onScroll);
      }
      observer?.disconnect();
    };
  }, []);

  
  const scrollToTop = () => {
    const container: Element | Window | null = document.querySelector('main') || window;
    if (container === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      (container as Element).scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      title="Scroll to top"
      aria-label="Scroll to top"
      className={`fixed right-10 z-50 inline-flex items-center justify-center w-10 h-10 rounded-md
        bg-orange-500 text-white shadow-lg
        hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none
        transition-all duration-300 active:scale-95
        ${nearFooter ? 'bottom-20' : 'bottom-5'}`}
    >
      <ChevronUp size={24} />
    </button>
  );
};

export default ScrollToTopButton;