/* eslint-disable no-process-env */

'use strict';

process.env.BROWSERSLIST_CONFIG = './.browserslistrc';

const path = require('path');

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  context: path.join(__dirname, 'src', 'js'),
  entry: {
    sentry: 'js/sentry',
    app: ['whatwg-fetch', 'js/index', 'sass/app.scss'],
  },
  resolve: {
    modules: ['src', 'static', 'node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@/js': path.join(__dirname, 'src', 'js'),
      '@/img': path.join(__dirname, 'static', 'images'),
    },
  },
  output: {
    publicPath: '/static/',
  },
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/](?!@sentry)/,
          chunks: 'all',
        },
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  module: {
    rules: [
      // Use `?raw` query on imports to bypass loaders and import raw file
      {
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      {
        test: /\.(j|t)sx?$/,
        include: [
          path.join(__dirname, 'src/js'),
          path.join(__dirname, 'node_modules/@salesforce/design-system-react'),
        ],
        exclude: [
          path.join(
            __dirname,
            'node_modules/@salesforce/design-system-react/node_modules',
          ),
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: { filter: (url) => !url.startsWith('/') },
              sourceMap: true,
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: { sourceMap: true },
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true },
          },
        ],
      },
      {
        test: /\.(gif|jpe?g|png)$/,
        type: 'asset',
      },
      {
        test: /\.(eot|woff|woff2|ttf)$/,
        type: 'asset',
      },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/raw/] },
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
    }),
  ],
  performance: {
    hints: false,
  },
};
