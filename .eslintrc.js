module.exports = {
  parser: 'babel-eslint',
  plugins: ['flowtype'],
  extends: ['@uncovertruth/eslint-config-flowtype'],
  rules: {
    'no-new': 1,
    'no-console': 1,
    'no-duplicate-imports': 1
  }
}
