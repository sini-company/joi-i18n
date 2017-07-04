module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts',
      '!test/**/*.spec.ts',
    ],

    tests: [
      'test/**/*.spec.ts',
    ],

    compilers: {
      '**/*.{ts,js}': wallaby.compilers.typeScript(),
    },

    env: {
      type: 'node'
    }
  };
};
