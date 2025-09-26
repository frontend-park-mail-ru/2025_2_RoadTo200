const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
                options: {
                    partialDirs: path.resolve(__dirname, 'src/'),
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html'
        })
    ],
    devServer: {
        static: path.join(__dirname, 'dist'),
        port: 3002,
        historyApiFallback: true
    },
    mode: 'development'
};