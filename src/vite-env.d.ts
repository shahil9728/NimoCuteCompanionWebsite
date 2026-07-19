/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_WAITLIST_TABLE?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }

// UMD globals loaded from CDN in index.html
declare const gsap: any;
declare const ScrollTrigger: any;
declare const Lenis: any;
interface Window {
  gsap?: any; ScrollTrigger?: any; Lenis?: any;
  gtag?: (...args: any[]) => void; dataLayer?: any[]; nimoTrack?: any;
}
