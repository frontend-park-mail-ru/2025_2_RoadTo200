import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'fs';
import { fileURLToPath } from 'url';
import { transformSync } from '@babel/core';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: './',
    publicDir: false, // Отключаем стандартное копирование
    server: {
        host: '0.0.0.0',
        port: 8001,
        open: true,
        proxy: {
            '/api': {
                // локальный сервер или на тачке
                target: 'http://127.0.0.1:8080',
                //target: 'http://terabithia.online:8080',
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
        assetsInlineLimit: 0, // Не инлайнить ассеты
        copyPublicDir: false, // Отключено, используем плагин
    },
    preview: {
        port: 4173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
                secure: false,
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
            name: 'copy-assets-with-structure',
            closeBundle() {
                const srcAssetsDir = resolve(dirname, 'src/assets');
                const distAssetsDir = resolve(dirname, 'dist/src/assets');
                
                if (existsSync(srcAssetsDir)) {
                    cpSync(srcAssetsDir, distAssetsDir, { 
                        recursive: true,
                        filter: (src) => !src.endsWith('.png'), 
                    });
                    console.log('📦 Copied assets to dist/src/assets/');
                }
            },
        },
        {
            name: 'copy-hbs-templates',
            closeBundle() {
                const srcDir = resolve(dirname, 'src');
                const distDir = resolve(dirname, 'dist');
                
                // Копируем все .hbs файлы из src в dist
                const copyHbsFiles = (src: string, dest: string) => {
                    const fs = require('fs');
                    const path = require('path');
                    
                    if (!fs.existsSync(src)) return;
                    
                    if (fs.statSync(src).isDirectory()) {
                        if (!fs.existsSync(dest)) {
                            fs.mkdirSync(dest, { recursive: true });
                        }
                        
                        fs.readdirSync(src).forEach((file: string) => {
                            copyHbsFiles(
                                path.join(src, file),
                                path.join(dest, file)
                            );
                        });
                    } else if (src.endsWith('.hbs')) {
                        fs.copyFileSync(src, dest);
                        console.log(`📄 Copied: ${src} → ${dest}`);
                    }
                };
                
                copyHbsFiles(srcDir, resolve(distDir, 'src'));
            },
        },
        {
            name: 'transpile-service-worker',
            closeBundle() {
                const swSource = resolve(dirname, 'service-worker.ts');
                const swDest = resolve(dirname, 'dist', 'service-worker.js');
                const distDir = resolve(dirname, 'dist');

                if (!existsSync(distDir)) {
                    mkdirSync(distDir, { recursive: true });
                }

                if (existsSync(swSource)) {
                    try {
                        const code = readFileSync(swSource, 'utf-8');
                        const result = transformSync(code, {
                            filename: 'service-worker.ts',
                            presets: [
                                ['@babel/preset-env', {
                                    targets: { browsers: ['> 0.5%', 'not dead'] },
                                    modules: false, // Важно! Не конвертируем в CommonJS
                                }],
                                ['@babel/preset-typescript']
                            ],
                            minified: true,
                            comments: false,
                        });
                        
                        if (result?.code) {
                            writeFileSync(swDest, result.code);
                            console.log('✅ Service Worker transpiled to service-worker.js');
                        } else {
                            throw new Error('Babel returned no code');
                        }
                    } catch (err) {
                        const error = err as Error;
                        console.error('❌ Babel transpilation failed:', error.message);
                        console.error('Full error:', error);
                    }
                }
            },
        },
    ],
});
