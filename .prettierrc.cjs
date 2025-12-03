module.exports = {
  trailingComma: 'all',
  singleQuote: true,
  semi: true,
  arrowParens: 'always',
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['<THIRD_PARTY_MODULES>', '^(@/|src/)(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: [
    'typescript',
    'decorators-legacy',
    'classProperties',
  ],
};
