import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import legacy from '@vitejs/plugin-legacy';
import { transformSync } from '@babel/core';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: './',
    publicDir: false,

    server: {
        host: '0.0.0.0',
        port: 8001,
        open: true,
        proxy: {
            '/api': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            '/support-api': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
                rewrite: (path: string) => path.replace(/^\/support-api/, '')
            }
        },
    },

    preview: {
        port: 8001,
        proxy: {
            '/api': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
                ws: true,
            },
            '/support-api': {
                target: 'http://terabithia.online',
                changeOrigin: true,
                secure: false,
                rewrite: (path: string) => path.replace(/^\/support-api/, '')
            },
        },
    },

    resolve: {
        alias: {
            '@': resolve(dirname, './src'),
        },
    },

    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(dirname, 'index.html'),
            },
        },
        assetsInlineLimit: 0,
        copyPublicDir: false,
    },

    plugins: [
        /* --- 1. ES5 bundle for old browsers --- */
        legacy({
            targets: ['> 0.5%', 'last 2 versions', 'not dead'],
            modernPolyfills: true,
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        }),

        /* --- 2. Copy assets --- */
        {
            name: 'copy-assets',
            closeBundle() {
                const src = resolve(dirname, 'src/assets');
                const dest = resolve(dirname, 'dist/src/assets');

                if (existsSync(src)) {
                    cpSync(src, dest, {
                        recursive: true,
                    });
                    console.log('Copied assets');
                }

                const manifestSrc = resolve(dirname, 'manifest.json');
                const manifestDest = resolve(dirname, 'dist/manifest.json');
                if (existsSync(manifestSrc)) {
                    cpSync(manifestSrc, manifestDest);
                    console.log('Copied manifest.json');
                }
            },
        },

        /* --- 3. Copy .hbs templates --- */
        {
            name: 'copy-hbs',
            closeBundle() {
                const fs = require('fs');
                const path = require('path');

                const copy = (src: string, dest: string) => {
                    if (!fs.existsSync(src)) return;

                    if (fs.statSync(src).isDirectory()) {
                        if (!fs.existsSync(dest)) {
                            fs.mkdirSync(dest, { recursive: true });
                        }
                        fs.readdirSync(src).forEach((file: string) =>
                            copy(path.join(src, file), path.join(dest, file))
                        );
                    } else if (src.endsWith('.hbs')) {
                        fs.copyFileSync(src, dest);
                        console.log(`Copied HBS: ${src}`);
                    }
                };

                copy(resolve(dirname, 'src'), resolve(dirname, 'dist/src'));
            },
        },

        /* --- 4. Babel-transpile service-worker --- */
        {
            name: 'transpile-service-worker',
            closeBundle() {
                const src = resolve(dirname, 'service-worker.ts');
                const dest = resolve(dirname, 'dist/service-worker.js');

                if (!existsSync(src)) return;

                const code = readFileSync(src, 'utf8');

                const result = transformSync(code, {
                    filename: 'service-worker.ts',
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                targets: ['> 0.5%', 'last 2 versions', 'not dead'],
                                modules: false,
                                useBuiltIns: false,
                            },
                        ],
                        ['@babel/preset-typescript'],
                    ],
                    comments: false,
                    minified: true,
                });

                if (!result || !result.code) {
                    throw new Error('Babel did not return transformed code');
                }
                writeFileSync(dest, result!.code);
                console.log('Transpiled service-worker.js');
            },
        },
    ],
});
