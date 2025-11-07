import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
    root: './',
    publicDir: 'src/assets',
    server: {
        port: 8001,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                // НЕ переписываем путь - оставляем /api
            },
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    plugins: [
        {
            name: 'copy-service-worker',
            closeBundle() {
                const swSource = resolve(__dirname, 'service-worker.js');
                const swDest = resolve(__dirname, 'dist', 'service-worker.js');
                const distDir = resolve(__dirname, 'dist');
                
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
