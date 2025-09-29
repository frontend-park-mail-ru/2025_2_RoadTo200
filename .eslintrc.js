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


   },
};