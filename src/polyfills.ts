
// Import buffer for polyfill
import { Buffer as BufferPolyfill } from 'buffer';

// Polyfill required globals for crypto-browserify
if (typeof window !== 'undefined') {
  // Define global as window for crypto-browserify
  (window as any).global = window;
  
  // Buffer is used by crypto-browserify
  (window as any).Buffer = BufferPolyfill;
  
  // process.nextTick is used by some crypto modules
  (window as any).process = (window as any).process || {};
  (window as any).process.nextTick = (window as any).process.nextTick || setTimeout;
  (window as any).process.env = (window as any).process.env || {};
  
  // Polyfill for util.inherits used by readable-stream
  (window as any).util = (window as any).util || {};
  (window as any).util.inherits = function(ctor: any, superCtor: any) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
  
  // Stream polyfills
  (window as any).stream = (window as any).stream || {};
  (window as any).stream.Transform = function() {};
}

export {};
