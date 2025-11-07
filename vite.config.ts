import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: './',
    publicDir: 'src/assets',
    server: {
        host: '0.0.0.0', 
        port: 8001,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(dirname, 'index.html'),
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(dirname, './src'),
        },
    },
    plugins: [
        {
            name: 'copy-service-worker',
            closeBundle() {
                const swSource = resolve(dirname, 'service-worker.js');
                const swDest = resolve(dirname, 'dist', 'service-worker.js');
                const distDir = resolve(dirname, 'dist');
                
                if (!existsSync(distDir)) {
                    mkdirSync(distDir, { recursive: true });
                }
                
                if (existsSync(swSource)) {
                    copyFileSync(swSource, swDest);
                    console.log('Service Worker copied to dist folder');
                }
            }
        }
    ]
});