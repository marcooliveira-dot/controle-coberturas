import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:fileURLToPath(new URL('../public',import.meta.url)),resolve:{alias:{'@':fileURLToPath(new URL('..',import.meta.url))}},define:{'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify('')},build:{outDir:fileURLToPath(new URL('../dist/netlify',import.meta.url)),emptyOutDir:true},css:{postcss:fileURLToPath(new URL('..',import.meta.url))}});
