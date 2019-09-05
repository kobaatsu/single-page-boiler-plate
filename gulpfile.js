const gulp = require('gulp')

const plumber = require('gulp-plumber')
const notify = require('gulp-notify')

const bs = require('browser-sync')
const pug = require('gulp-pug')
const rename = require('gulp-rename')

const stylus = require('gulp-stylus')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const mqpacker = require('css-mqpacker')
const nano = require('cssnano')
const sorting = require('postcss-sorting')
const prettify = require('postcss-prettify')

const wpConfig = require('./webpack.config')
const wp = require('webpack')
const wpStream = require('webpack-stream')

const fs = require('fs')
const path = require('path')
const jsyaml = require('js-yaml')

var htmlBase64 = require('gulp-inline-image-html')
var faviconBase64 = require('gulp-base64-favicon')
var cssBase64 = require('gulp-css-base64')

const SRC_ROOT = 'src'
const DEV = 'dev'
const DIST = 'dist'
const TEMP = 'temp'

const SRC = {
  pug: [`${SRC_ROOT}/pug/main.pug`],
  stylus: [`${SRC_ROOT}/stylus/main.styl`]
}

const WATCH = [`${SRC_ROOT}/**/*.*`]

const PORT = '8080'

const BrowserSync = (base, port, directory) => {
  const opts = {
    server: {
      baseDir: base,
      directory: true
    },
    port
  }
  return bs.init(opts)
}
const open = () => BrowserSync(DEV, PORT, false)
exports.open = open

const CompilePug = (src, dist, prod) => {
  return gulp
    .src(src)
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: 'PUG Error: Line <%= error.line %>',
          message: '<%= error.message %>'
        })
      })
    )
    .pipe(
      pug({
        pretty: !prod,
        locals: {
          dev: !prod,
          fs,
          path,
          jsyaml
        }
      })
    )
    .pipe(
      rename(path => {
        path.basename = 'index'
        path.extname = '.html'
      })
    )
    .pipe(htmlBase64(SRC_ROOT))
    .pipe(faviconBase64())
    .pipe(gulp.dest(dist))
}

const html = () => CompilePug(SRC.pug, DEV, false)
exports.html = html

const htmlDist = () => CompilePug(SRC.pug, DIST, true)
exports.htmlDist = htmlDist

const CompileStylus = (src, dist, prod) => {
  const opts = []
  let sourcemapOpts = false
  opts.push(mqpacker({ sort: true }))
  opts.push(sorting())
  opts.push(autoprefixer())
  opts.push(
    nano({
      preset: ['default', { discardComments: true }]
    })
  )
  if (!prod) {
    opts.push(prettify())
    sourcemapOpts = true
  }

  return gulp
    .src(src, { sourcemaps: sourcemapOpts })
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: 'STYLUS Error: Line <%= error.line %>',
          message: '<%= error.message %>'
        })
      })
    )
    .pipe(stylus({ 'include css': true }))
    .pipe(postcss(opts))
    .pipe(cssBase64())
    .pipe(gulp.dest(dist, { sourcemaps: sourcemapOpts }))
}
module.CompileStylus = CompileStylus

const css = () => CompileStylus(SRC.stylus, `${TEMP}/dev`, false)
exports.css = css

const cssDist = () => CompileStylus(SRC.stylus, `${TEMP}/dist`, true)
exports.cssDist = cssDist

const js = () => {
  wpConfig.mode = 'development'
  wpConfig.devtool = 'inline-source-map'
  return wpStream(wpConfig, wp, (err, stats) => {
    if (err) {
      this.emit('end')
    }
    console.log(stats.toString({}))
  }).pipe(gulp.dest(`${TEMP}/dev`))
}
exports.js = js

const jsDist = () => {
  wpConfig.mode = 'production'
  return wpStream(wpConfig, wp, (err, stats) => {
    if (err) {
      this.emit('end')
    }
    console.log(stats.toString({}))
  }).pipe(gulp.dest(`${TEMP}/dist`))
}
exports.jsDist = jsDist

const dev = gulp.series(js, css, html)
exports.dev = dev

const dist = gulp.series(jsDist, cssDist, htmlDist)
exports.dist = dist

const watch = cb => {
  gulp.watch(WATCH, dev)
  cb()
}
exports.watch = watch

const def = gulp.series(dev, watch, open)
exports.default = def
