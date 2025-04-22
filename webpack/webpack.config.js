/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
const configuration = require('./base.config.js');

configuration.entry = {
  dashboard: './dashboard/index.js',
  // login: './login/index.js',
  // signup: './signup/index.js',
  // PIG: './parse-interface-guide/index.js',
  // quickstart: './quickstart/index.js',
};
configuration.output.path = require('path').resolve('./bundles');

// Enable code splitting and chunk optimization
configuration.optimization = {
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      // React and related packages
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|react-helmet)[\\/]/,
        name: 'vendor.react',
        chunks: 'all',
        priority: 40
      },
      // UI related packages
      ui: {
        test: /[\\/]node_modules[\\/](@back4app2|@sentry|graphiql)[\\/]/,
        name: 'vendor.ui',
        chunks: 'all',
        priority: 30
      },
      // Data handling and utilities
      utils: {
        test: /[\\/]node_modules[\\/](immutable|moment|axios|core-js)[\\/]/,
        name: 'vendor.utils',
        chunks: 'all',
        priority: 20
      },
      // Remaining vendor packages
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: -10,
        reuseExistingChunk: true
      },
      // Common application code
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'async',
        priority: -20,
        reuseExistingChunk: true,
        enforce: true
      }
    }
  },
  runtimeChunk: 'single'
};

module.exports = configuration;
