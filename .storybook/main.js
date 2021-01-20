'use strict';
const custom = require('../webpack.dev.js');

module.exports = {
  stories: [
    '../src/stories/*.stories.mdx',
    '../src/stories/*.stories.@(js|jsx|ts|tsx)',
  ],
  // stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  webpackFinal: (config) => ({
    ...config,
    module: { ...config.module, rules: custom.module.rules },
  }),
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
