const postcss = require('postcss');
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
  core: { builder: 'webpack5' },
  stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: postcss,
        },
      },
    },
    '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        backgrounds: false,
      },
    },
  ],
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
