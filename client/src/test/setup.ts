import '@testing-library/jest-dom';

// Mock environment variables
global.process = {
  ...global.process,
  env: {
    ...global.process?.env,
    NODE_ENV: 'test',
  },
};