/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
const configuration = require('./base.config.js');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

configuration.mode = 'production';
configuration.entry = {
  dashboard: './dashboard/index.js',
};

configuration.output.path = path.resolve('./Parse-Dashboard/public/bundles');
configuration.output.filename = '[name].[chunkhash].js';

configuration.optimization = {
  usedExports: true,
  minimize: true,
  concatenateModules: true,
  sideEffects: true,
  providedExports: true,
  innerGraph: true,
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxAsyncRequests: 30,
    maxInitialRequests: 30
  }
};

configuration.plugins.push(
  new HtmlWebpackPlugin({
    template: '../Parse-Dashboard/index.ejs',
    filename: path.resolve('./Parse-Dashboard/public/index.html')
  }),
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production'),
      'SENTRY_ENV': JSON.stringify('production')
    }
  }),
  // new BundleAnalyzerPlugin()
);

configuration.module = configuration.module || {};
configuration.module.rules = configuration.module.rules || [];

// Ensure babel-loader is configured for tree shaking
const babelRule = configuration.module.rules.find(rule => rule.use && rule.use.includes('babel-loader'));
if (babelRule) {
  babelRule.use = {
    loader: 'babel-loader',
    options: {
      presets: [
        ['@babel/preset-env', {
          modules: false // This is important for tree shaking
        }]
      ]
    }
  };
}

module.exports = configuration;
