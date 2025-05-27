import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  minimalHeader?: boolean;
  bgColor?: string;
  minimalBgColor?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  scrollContainerRef,
  minimalHeader = true,
  bgColor = 'bg-slate-50',
  minimalBgColor = 'bg-slate-50'
}) => {
  const mainHeaderRef = useRef<HTMLDivElement>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    if (!mainHeaderRef.current || !scrollContainerRef.current) return;
    
    const options = {
      root: scrollContainerRef.current,
      rootMargin: '-20px 0px 0px 0px', // Header will be considered invisible when 20px of it goes out of view
      threshold: 0.1 // Trigger when 10% of the element is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsHeaderVisible(entry.isIntersecting);
      });
    }, options);
    
    observer.observe(mainHeaderRef.current);
    
    return () => {
      if (mainHeaderRef.current) {
        observer.unobserve(mainHeaderRef.current);
      }
    };
  }, [scrollContainerRef]);

  return (
    <>
      {minimalHeader && (
        <AnimatePresence>
          {!isHeaderVisible && (
            <motion.div 
              key="minimal-header"
              className={`sticky top-0 z-40 px-4 py-2 ${minimalBgColor} backdrop-blur-sm shadow-sm`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.15,
                ease: "easeInOut"
              }}>
              <motion.p className="text-sm font-medium text-gray-800">
                {title}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      <div ref={mainHeaderRef}>
        <motion.div 
          key="full-header"
          className={`z-10 px-4 ${bgColor}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}>
          <motion.div 
            className="heading-wrapper flex-col gap-y-2 pt-8 pb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}>
            <motion.h1 
              className="text-2xl font-semibold tracking-tight text-slate-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}>
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p 
                className="text-sm text-gray-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}>
                {subtitle}
              </motion.p>
            )}
            {children}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};