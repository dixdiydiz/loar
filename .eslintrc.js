module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    'max-len': ['error', { code: 80, ignoreUrls: true }],
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'no-empty': ['warn', { allowEmptyCatch: true }]
  }
}
