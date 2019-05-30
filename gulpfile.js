const gulp = require('gulp')

const tasks = require('gulp4-tasks')

const SRC_ROOT = 'src'
const DEV = 'dev'
const DIST = 'dist'
const TEMP = 'temp'

const SRC = {
  pug: [`${SRC_ROOT}/index.pug`],
  stylus: [`${SRC_ROOT}/style.styl`],
  js: [`${SRC_ROOT}/index.js`]
}

const WATCH = [`${SRC_ROOT}/**/*.*`]

const PORT = '9779'

const open = () => tasks.BrowserSync(DEV, PORT, false)
exports.open = open

const htmlDevOpts = { pretty: true }
const htmlDev = () => tasks.CompilePug(SRC.pug, DEV, htmlDevOpts)
exports.htmlDev = htmlDev

const htmlDistOpts = { pretty: false }
const html = () => tasks.CompilePug(SRC.pug, DIST, htmlDistOpts)
exports.html = html

const cssOpts = {
  mqpack: true,
  minify: false,
  sort: true,
  prefix: true
}
const cssDev = () => tasks.CompileStylus(SRC.stylus, TEMP, cssOpts)
exports.cssDev = cssDev

const cssDistOpts = Object.assign(cssOpts, { minify: true })
const css = () => tasks.CompileStylus(SRC.stylus, TEMP, cssDistOpts)
exports.css = css

let wpConfig = require('./webpack.config')
const jsDev = cb => {
  wpConfig.mode = 'development'
  wpConfig.devtool = 'source-map'
  tasks.Webpack(SRC.js, TEMP, wpConfig)
  cb()
}
exports.jsDev = jsDev

const js = cb => {
  wpConfig.mode = 'production'
  tasks.Webpack(SRC.js, TEMP, wpConfig)
  cb()
}
exports.js = js

const dev = gulp.series(gulp.parallel(cssDev, jsDev), htmlDev)
exports.dev = dev

const watch = cb => {
  gulp.watch(WATCH, dev)
  cb()
}
exports.watch = watch

const dist = gulp.series(gulp.parallel(css, js), html)
exports.dist = dist

const hmr = gulp.series(dev, watch, open)
exports.default = hmr
