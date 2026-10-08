const { execSync } = require('child_process')
console.log('Building standalone offline bundle...')
execSync('npx --yes esbuild js/main.js --bundle --outfile=js/bundle.js --format=iife --minify', { stdio: 'inherit' })
console.log('Build complete: js/bundle.js')
