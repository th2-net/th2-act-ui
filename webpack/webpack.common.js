/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const { appSrc, appPath } = require('./paths');

const api_env = process.env.API_ENV || 'http';

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.scss', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(ts|tsx)$/,
                loader: "babel-loader",
                exclude: /node_modules/
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg|jpg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'resources/',
                    },
                }]
            }
        ]
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            API_ENV: api_env
        }),
        new HtmlWebPackPlugin({
            title: 'Message-sender-ui',
            template: path.resolve(appSrc, 'index.html'),
            favicon: false,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: './node_modules/monaco-editor/min/vs/base',
                    to: './resources/vs/base',
                },
                {
                    from: './node_modules/monaco-editor/min/vs/editor',
                    to: './resources/vs/editor',
                    filter: (src) => {
                        const files = ['editor.main.css', 'editor.main.js', 'editor.main.nls.js'];
                        return !/\.(js|css)?$/.test(src) || files.some(file => src.includes(file));
                    }
                },
                {
                    from: './node_modules/monaco-editor/min/vs/language/json',
                    to: './resources/vs/language/json',
                },
                {
                    from: './node_modules/monaco-editor/min/vs/basic-languages/xml',
                    to: './resources/vs/basic-languages/xml',
                },
                {
                    from: './node_modules/monaco-editor/min/vs/loader.js',
                    to: './resources/vs/loader.js',
                },
            ],
        }),
    ],
};
