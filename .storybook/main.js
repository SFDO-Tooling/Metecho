const merge = require('webpack-merge').merge;

const webpackConfig = require('../webpack.common.js');

// Add some of our custom webpack settings...
const minimalWebpackConfig = {
  resolve: {
    modules: webpackConfig.resolve.modules,
    alias: webpackConfig.resolve.alias,
  },
  module: {
    rules: [
      webpackConfig.module.rules[0],
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              url: (url) => !url.startsWith('/'),
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
};

module.exports = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  webpackFinal: (config) => merge(config, minimalWebpackConfig),
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};
