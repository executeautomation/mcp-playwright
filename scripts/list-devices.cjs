#!/usr/bin/env node

/**
 * Script to list all available Playwright device descriptors
 * Usage: node scripts/list-devices.js [filter]
 */

const { devices } = require('playwright');

const filter = process.argv[2]?.toLowerCase();

console.log('\n='.repeat(80));
console.log('Available Playwright Device Presets');
console.log('='.repeat(80));
console.log(`\nTotal devices: ${Object.keys(devices).length}\n`);

// Group devices by category
const categories = {
  iPhone: [],
  iPad: [],
  Pixel: [],
  Galaxy: [],
  Desktop: [],
  Other: []
};

Object.keys(devices).forEach(name => {
  if (filter && !name.toLowerCase().includes(filter)) {
    return;
  }

  const device = devices[name];
  if (name.startsWith('iPhone')) {
    categories.iPhone.push({ name, ...device.viewport });
  } else if (name.startsWith('iPad')) {
    categories.iPad.push({ name, ...device.viewport });
  } else if (name.startsWith('Pixel')) {
    categories.Pixel.push({ name, ...device.viewport });
  } else if (name.startsWith('Galaxy')) {
    categories.Galaxy.push({ name, ...device.viewport });
  } else if (name.startsWith('Desktop')) {
    categories.Desktop.push({ name, ...device.viewport });
  } else {
    categories.Other.push({ name, ...device.viewport });
  }
});

// Print devices by category
Object.entries(categories).forEach(([category, deviceList]) => {
  if (deviceList.length === 0) return;
  
  console.log(`\n${category}:`);
  console.log('-'.repeat(80));
  deviceList.forEach(({ name, width, height }) => {
    const dimensions = `${width}x${height}`;
    console.log(`  ${name.padEnd(40)} ${dimensions.padStart(10)}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('\nUsage in playwright_resize:');
console.log('  await playwright_resize({ device: "iPhone 13" })');
console.log('  await playwright_resize({ device: "iPad Pro 11", orientation: "landscape" })');
console.log('  await playwright_resize({ device: "Desktop Chrome" })');
console.log('\n' + '='.repeat(80) + '\n');
