import { defineConfig } from 'vite'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { resolve, dirname, relative } from 'path'

const cdpConfig = Object.fromEntries(
  readFileSync(resolve(import.meta.dirname, '.cdp'), 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
)

const CDP_LOGICAL_NAME = cdpConfig.CDP_LOGICAL_NAME
const CDP_TARGET_PATH = cdpConfig.CDP_TARGET_PATH ?? CDP_LOGICAL_NAME

const TEMPLATES = resolve(import.meta.dirname, 'templates')
const DIST = resolve(import.meta.dirname, 'dist')
const DIST_DEST = CDP_TARGET_PATH

function cleanDist() {
  return {
    name: 'clean-dist',
    buildStart() {
      rmSync(DIST, { recursive: true, force: true })
    }
  }
}

function renderContent(template, context) {
  return Object.entries(context).reduce(
    (out, [key, val]) => out.replaceAll(`\${${key}}`, val),
    template
  )
}

function generateFile({ templatePath, outPath, context}) {
  return {
    name: `template_${relative(TEMPLATES, templatePath).replaceAll('/', '_')}`,
    closeBundle() {
      const content = readFileSync(templatePath, 'utf8')
      const out = typeof outPath === 'function' ? outPath() : outPath
      mkdirSync(dirname(out), { recursive: true })
      
      writeFileSync(out, renderContent(content, context))
    }
  }
}

function currentCommit() {
  return execSync('git rev-parse HEAD').toString().trim()
}

function generateCdpMeta() {
  return generateFile({
    templatePath: resolve(TEMPLATES, 'cdp-meta/_meta.json'),
    outPath: resolve(DIST, DIST_DEST, '_meta.json'),
    context: {
      cdpLogicalName: CDP_LOGICAL_NAME,
      version: currentCommit(),
      date: new Date().toISOString()
    }
  })
}

function generateCdpNav() {
  return generateFile({
    templatePath: resolve(TEMPLATES, 'cdp-nav/index.html'),
    outPath: resolve(DIST, 'index.html'),
    context: {
      cdpLogicalName: CDP_LOGICAL_NAME,
      distDest: DIST_DEST
    }
  })
}

export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  build: {
    outDir: resolve(DIST, DIST_DEST),
    emptyOutDir: true,
  },
  plugins: [cleanDist(), generateCdpMeta(), generateCdpNav()],
})
