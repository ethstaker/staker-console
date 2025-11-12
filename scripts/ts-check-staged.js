#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .split('\n')
  .filter(file => (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test'))
  .filter(file => file.startsWith('src/'));

if (stagedFiles.length === 0) {
  console.log('No staged TypeScript files to check');
  process.exit(0);
}

// Include custom-elements.d.ts to ensure global type definitions are loaded
const typeDefsFile = 'src/custom-elements.d.ts';
const filesToCheck = existsSync(typeDefsFile)
  ? [...stagedFiles, typeDefsFile].filter((f, i, arr) => arr.indexOf(f) === i) // dedupe
  : stagedFiles;

console.log('Checking TypeScript files:', stagedFiles.join(', '));

try {
  execSync(`npx tsc-files --noEmit --skipLibCheck ${filesToCheck.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ TypeScript check passed');
} catch (error) {
  console.error('❌ TypeScript check failed');
  process.exit(1);
}

try {
  execSync(`npx eslint ${filesToCheck.join(' ')} --fix`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ EsLint check passed');
} catch (error) {
  console.error('❌ EsLint failed');
  process.exit(1);
}
