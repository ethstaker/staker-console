#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .split('\n')
  .filter(file => (file.endsWith('.ts') || file.endsWith('.tsx')) && file.startsWith('src/'));

if (stagedFiles.length === 0) {
  console.log('No staged TypeScript files to check');
  process.exit(0);
}

// tsc-files covers sources only; ESLint covers tests too, matching what CI lints.
const typeCheckFiles = stagedFiles.filter(file => !file.includes('.test'));

// Include custom-elements.d.ts to ensure global type definitions are loaded
const typeDefsFile = 'src/custom-elements.d.ts';
const filesToCheck = existsSync(typeDefsFile)
  ? [...typeCheckFiles, typeDefsFile].filter((f, i, arr) => arr.indexOf(f) === i) // dedupe
  : typeCheckFiles;

if (typeCheckFiles.length === 0) {
  console.log('No staged TypeScript sources to type check');
} else {
  console.log('Checking TypeScript files:', typeCheckFiles.join(', '));

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
}

console.log('Linting files:', stagedFiles.join(', '));

try {
  execSync(`npx eslint ${stagedFiles.join(' ')} --fix`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ EsLint check passed');
} catch (error) {
  console.error('❌ EsLint failed');
  process.exit(1);
}
