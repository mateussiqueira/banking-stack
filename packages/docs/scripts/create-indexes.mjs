import { readdirSync, existsSync, writeFileSync, statSync } from 'fs'
import { join, basename } from 'path'

const distDir = join(import.meta.dirname, '..', '.vitepress', 'dist')

function createIndexFiles(dir) {
  if (!existsSync(dir)) return
  
  const entries = readdirSync(dir)
  const htmlFiles = entries.filter(e => e.endsWith('.html') && e !== 'index.html')
  const subdirs = entries.filter(e => {
    const fullPath = join(dir, e)
    return statSync(fullPath).isDirectory()
  })

  // Create index.html for current directory if it has HTML files but no index
  if (htmlFiles.length > 0 && !existsSync(join(dir, 'index.html'))) {
    const firstFile = htmlFiles[0]
    const indexContent = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=./${firstFile}">
  <link rel="canonical" href="./${firstFile}">
</head>
<body>
  <p>Redirecting to <a href="./${firstFile}">${firstFile}</a></p>
</body>
</html>`
    writeFileSync(join(dir, 'index.html'), indexContent)
    console.log(`Created ${dir.replace(distDir, '')}/index.html -> ${firstFile}`)
  }

  // Recurse into subdirectories
  for (const subdir of subdirs) {
    createIndexFiles(join(dir, subdir))
  }
}

createIndexFiles(distDir)
console.log('Index files created successfully!')
