// Source - https://stackoverflow.com/a/77069317
// Posted by Michele Colombo, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-26, License - CC BY-SA 4.0

const { getDefaultConfig } = require('@expo/metro-config');

const configs = getDefaultConfig(__dirname);
configs.resolver.assetExts.push('csv')

module.exports = configs;
