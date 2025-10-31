module.exports = {
    root: true,


    env: {
        browser: true,
        es2021: true,
        node: true,
    },


    extends: [
        'eslint:recommended',  
        'airbnb-base',
        'prettier',
    ],


    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module', 
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'import/prefer-default-export': 'off',

        // 1. Разрешить несколько классов в файле - пока проблемы только в роутере, где класс Router и Route вместе
        'max-classes-per-file': 'off',
        
        // 2. Разрешить унарные операторы (++, --)
        'no-plusplus': 'off',
        
        // 3. Разрешить использование расширений файлов в импортах - разобраться потом, почему проект не билдится без расширений
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'always',
                jsx: 'always',
                ts: 'always',
                tsx: 'always',
            },
        ],
        'indent': ['error', 4, {
            'SwitchCase': 1,
            'ignoredNodes': ['TemplateLiteral']
        }],

    },

};