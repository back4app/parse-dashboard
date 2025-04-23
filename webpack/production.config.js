/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
const configuration = require('./base.config.js');
const webpack = require('webpack');

configuration.mode = 'production';
configuration.entry = {
  dashboard: './dashboard/index.js',
  // login: './login/index.js',
  PIG: './parse-interface-guide/index.js',
  quickstart: './quickstart/index.js',
};
configuration.output.path = require('path').resolve('./production/bundles');

configuration.plugins.push(
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production'),
      'SENTRY_ENV': JSON.stringify('production')
    }
  }),
);

module.exports = configuration;
