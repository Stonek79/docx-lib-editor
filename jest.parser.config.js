/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node', // Используем node вместо jsdom
    roots: ['<rootDir>/src', '<rootDir>/__tests__'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
    },
    testMatch: [
        '**/__tests__/parser/**/*.test.ts',
        '!**/__tests__/fixtures/**'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/fixtures/'
    ],
    maxWorkers: '50%', // Используем 50% доступных CPU для параллельного выполнения
    setupFiles: ['setimmediate'] // Добавляем setImmediate для Node.js
}
