const configuration = require('./publish.config.js');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

configuration.plugins.push(
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('homolog'),
      'SENTRY_ENV': 'homolog'
    }
  }),
  new webpack.SourceMapDevToolPlugin({
    filename: '[file].map',
    include: /dashboard.*.*/
  })
);

configuration.optimization = {
  splitChunks: {
    cacheGroups: {
      commons: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      }
    }
  },
  minimize: true,
  minimizer: [
    new TerserPlugin({
      // cache: true,
      parallel: true,
      terserOptions: {
        sourceMap: true,
        mangle: false
      }
    })
  ]
}

module.exports = configuration;
