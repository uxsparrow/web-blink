/**
 * Tiny zero-dependency static server, for previewing the site locally.
 *
 *   node tools/preview.js          -> http://localhost:8080
 *   node tools/preview.js 3000     -> a different port
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.argv[2] || process.env.PORT || 8080)
const ROOT = path.join(__dirname, '..') // the site root

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0])
    let file = path.join(ROOT, url === '/' ? 'index.html' : url)

    // never serve outside the folder
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    fs.stat(file, (err, stat) => {
      if (err || stat.isDirectory()) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
        return
      }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-cache',
      })
      fs.createReadStream(file).pipe(res)
    })
  })
  .listen(PORT, () => console.log(`Blink CMS — http://localhost:${PORT}`))
