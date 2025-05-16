
// Import buffer for polyfill
import { Buffer as BufferPolyfill } from 'buffer';

// Polyfill required globals for crypto-browserify
if (typeof window !== 'undefined') {
  // Define global as window for crypto-browserify
  (window as any).global = window;
  
  // Buffer is used by crypto-browserify
  (window as any).Buffer = (window as any).Buffer || BufferPolyfill;
  
  // process.nextTick is used by some crypto modules
  (window as any).process = (window as any).process || {};
  (window as any).process.nextTick = (window as any).process.nextTick || setTimeout;
  (window as any).process.env = (window as any).process.env || {};
}

export {};
