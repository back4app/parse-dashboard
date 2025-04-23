/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
const configuration = require('./base.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

configuration.mode = 'production';
configuration.entry = {
  dashboard: './dashboard/index.js',
};
configuration.output.path = path.resolve('./Parse-Dashboard/public/bundles');
configuration.output.filename = '[name].[chunkhash].js';

// Enable minification
configuration.plugins.push(
  new HtmlWebpackPlugin({
    template: '../Parse-Dashboard/index.ejs',
    filename: path.resolve('./Parse-Dashboard/public/index.html'),
    chunks: ['dashboard'], // Explicitly include only dashboard chunk
    inject: true
  }),
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }),
);

module.exports = configuration;
