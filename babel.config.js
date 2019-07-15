'use strict';

const presets = ['@babel/preset-react', '@babel/preset-typescript'];

module.exports = {
  presets: [
    ...presets,
    [
      '@babel/preset-env',
      {
        modules: false,
        corejs: '3',
        useBuiltIns: 'usage',
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
  env: {
    test: {
      presets: [
        ...presets,
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
    },
  },
};
