const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const browserSync = require('browser-sync').create()
const uglify = require('gulp-uglify')
const babelify = require('babelify')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const htmlmin = require('gulp-htmlmin')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')

gulp.task('copy', (done) =>
{
    gulp.src('./src/models/*.*')
        .pipe(gulp.dest('./dist/models'))
    gulp.src('./src/images/*.*')
        .pipe(gulp.dest('./dist/images'))
    gulp.src('./src/audio/*.*')
        .pipe(gulp.dest('./dist/audio'))
    gulp.src('./src/css/*.*')
        .pipe(gulp.dest('./dist/css'))
    gulp.src('./src/js/ammo/*.*')
        .pipe(gulp.dest('./dist/js/ammo'))
    gulp.src('./src/js/bundle.js')
        .pipe(gulp.dest('./dist/js'))
    done()
})

gulp.task('html', () =>
{
    return gulp.src('src/**.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('./dist'))
})

gulp.task('js', () =>
{
    return browserify({ debug: true })
        .add('./src/js/index.js')
        .transform(babelify, { global: true, presets: ['@babel/preset-env'], plugins: ['@babel/plugin-transform-runtime'] })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        //.pipe(uglify())
        .pipe(gulp.dest('./src/js'))
})

gulp.task('sass', () =>
{
    return gulp.src('./src/scss/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest('./src/css'))
        .pipe(browserSync.stream())
})

gulp.task('serve', gulp.series('js', 'sass', () =>
{
    browserSync.init({
        server: './src'
    })

    gulp.watch("./src/js/*.js", gulp.series('js'))
    gulp.watch('./src/scss/*.scss', gulp.series('sass'))
    gulp.watch('./src/*.html').on('change', browserSync.reload)
}))

gulp.task('default', gulp.series('serve'))
gulp.task('build', gulp.series('sass', 'js', 'copy', 'html'))