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
    'disable',
  ],
  processor: 'disable/disable',
  overrides: [
    {
      files: ['*.js'],
      settings: {
        'disable/plugins': ['jsx-a11y'],
      }
    }
  ],
  rules: {
    'max-len': ['error', { code: 300 }],
    'react/prop-types': 'off',
    'import/no-cycle': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-filename-extension': 'off',
    'react/no-unescaped-entities': 'off',
    'no-alert': 'off',
    "no-unused-vars": "off",
    "no-unused-vars": [
      "error",
      { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
};
