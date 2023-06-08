module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'max-len': ['error', { code: 300 }],
    'react/prop-types': 'off',
    'import/no-cycle': 'off',
    'react/jsx-props-no-spreading': 'off',
  },
};
