import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: './',
    publicDir: 'src/assets',
    server: {
        port: 8001,
        open: true,
        proxy: {
            '/api': {
                target: 'http://217.16.17.116:8080',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''),
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
});
