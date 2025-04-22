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
  login: './login/index.js',
  signup: './signup/index.js',
  PIG: './parse-interface-guide/index.js',
  quickstart: './quickstart/index.js',
};
configuration.output.path = require('path').resolve('./bundles');

// Enable code splitting and chunk optimization
configuration.optimization = {
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: -10
      },
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
