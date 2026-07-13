import { type Variants } from 'framer-motion';

// A premium ease-out curve, similar to Apple's standard transitions
export const premiumEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const pageItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40, 
    filter: 'blur(4px)' 
  },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.6, 
      ease: premiumEase 
    } 
  },
};

export const fabVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: {
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: premiumEase,
      delay: 0.2 
    }
  }
};
