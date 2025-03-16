const { execSync } = require('child_process');

try {
  console.log('Running tests...');
  const output = execSync('npx jest --no-cache --coverage', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('Error running tests:', error.message);
  console.log(error.stdout);
} 