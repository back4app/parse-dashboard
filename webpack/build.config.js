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

configuration.mode = 'development';
configuration.entry = {
  dashboard: './dashboard/index.js',
  // login: './login/index.js',
};
configuration.output.path = path.resolve('./Parse-Dashboard/public/bundles');
configuration.output.filename = '[name].[chunkhash].js';

configuration.plugins.push(
  new HtmlWebpackPlugin({
    template: '../Parse-Dashboard/index.ejs',
    filename: path.resolve('./Parse-Dashboard/public/index.html'),
  })//,
  // new HtmlWebpackPlugin({
  //   template: '../Parse-Dashboard/login.ejs',
  //   filename: path.resolve('./Parse-Dashboard/public/login.html'),
  // }),
  // new HtmlWebpackExternalsPlugin({
  //   externals: [
  //     {
  //       module: '@back4app/back4app-navigation',
  //       entry: settings.BACK4APP_NAVIGATION_PATH + '/back4app-navigation.bundle.js',
  //     },
  //   ],
  // })
);

module.exports = configuration;
