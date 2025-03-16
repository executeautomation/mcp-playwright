// test-import.js
import { setupRequestHandlers } from './dist/requestHandler.js';
import { handleToolCall } from './dist/toolHandler.js';

console.log('Imports successful!');
console.log('setupRequestHandlers:', typeof setupRequestHandlers);
console.log('handleToolCall:', typeof handleToolCall); 