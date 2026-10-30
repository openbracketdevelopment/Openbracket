export const themeStorageKey = 'openbracket-theme';
// Runs before page content is painted. Storage may be blocked, so system preference remains a safe fallback.
export const themeBootstrap = `(()=>{const r=document.documentElement;let t;try{t=localStorage.getItem('${themeStorageKey}')}catch{}const explicit=t==='light'||t==='dark';r.dataset.themePreference=explicit?t:'system';r.dataset.theme=explicit?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';})()`;
