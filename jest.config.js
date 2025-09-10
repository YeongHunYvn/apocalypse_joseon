module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.spec.(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'screens/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // testTimeout 옵션 제거 - Jest 29+에서는 지원하지 않음
  maxWorkers: '50%', // CPU 코어의 50%만 사용하여 안정성 향상
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  // 성능 테스트를 위한 설정
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // 테스트 파일별 설정
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      // testTimeout 옵션 제거 - Jest 29+에서는 지원하지 않음
    },
  ],
}; 