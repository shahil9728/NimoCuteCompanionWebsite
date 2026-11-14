/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_WAITLIST_TABLE?: string;
  readonly VITE_WEB3FORMS_KEY?: string;
  readonly VITE_WAITLIST_COUNT_OFFSET?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }

// GSAP's UMD global, loaded on demand by src/lib/gsap.ts for the playground
declare const gsap: any;
interface Window {
  gsap?: any;
  gtag?: (...args: any[]) => void; dataLayer?: any[]; nimoTrack?: any;
}
