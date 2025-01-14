  'use strict';

  // gulp
  import gulp from 'gulp';
  import gulpif from 'gulp-if';
  import browserSync from 'browser-sync';
  import rename from 'gulp-rename';
  import plumber from 'gulp-plumber';
  import { deleteSync } from 'del';

  // html*pug
  import htmlmin from 'gulp-htmlmin';
  import gulppug from 'gulp-pug';
  import prettyHtml from 'gulp-pretty-html';

  // css
  import * as sass from 'sass';
  import gulpSass from 'gulp-sass';
  const compSass = gulpSass(sass);

  import sourcemaps from 'gulp-sourcemaps';
  import autoprefixer from 'gulp-autoprefixer';
  import cleanCSS from 'gulp-clean-css';
  import gcmq from 'gulp-group-css-media-queries';
  import { stream as critical } from 'critical';

  // js
  import terser from 'gulp-terser';
  import webpackStream from 'webpack-stream';
  import webpack from 'webpack';

  //img
  import tinypng from 'gulp-tinypng-compress';
  import gulpImg from 'gulp-image';
  import gulpWebp from 'gulp-webp';
  import gulpAvif from 'gulp-avif';
  import svgSprite from 'gulp-svg-sprite';

  let dev = false;

  const path = {
    docs: {
      base: 'docs/',
      html: 'docs/',
      js: 'docs/js/',
      css: 'docs/css/',
      cssIndex: 'docs/css/style.min.css',
      img: 'docs/img/',
      fonts: 'docs/fonts/',
      php: 'docs/php/', // Добавляем путь для PHP файлов
    },
    src: {
      base: 'src/',
      html: [
        'src/*.html',
      ],
      other: [
        'src/manifest.webmanifest',
        'src/sitemap.xml',
        'src/robots.txt',
      ],
      pug: 'src/pug/*.pug',
      scss: 'src/scss/**/*.scss',
      critjs: [],
      js: [
        // 'src/libs/air-datepicker.js',
        'src/libs/jquery-3.7.1.min.js',
        'src/libs/slick.min.js',
        'src/libs/jquery-ui.min.js',
        'src/libs/just-validate.production.min.js',
        'src/libs/jquery.inputmask.min.js',
        'src/libs/ya-map.js',
        'src/js/script.js',
      ],
      img: 'src/img/**/*.*',
      svg: 'src/svg/**/*.svg',
      imgF: 'src/img/**/*.{jpg,jpeg,png}',
      php: 'src/php/**/*.php', // Добавляем путь для исходных PHP файлов
      assets: [
        'src/fonts/**/*.*',
        'src/icons/**/*.*',
        'src/video/**/*.*',
        'src/public/**/*.*',
      ],
    },
    watch: {
      html: 'src/*.html',
      js: 'src/**/*.js',
      pug: 'src/**/*.pug',
      css: 'src/**/*.scss',
      svg: 'src/svg/**/*.svg',
      img: 'src/img/**/*.*',
      imgF: 'src/img/**/*.{jpg,jpeg,png}',
      php: 'src/php/**/*.php', // Добавляем в отслеживание PHP файлов
      other: [
        'src/manifest.webmanifest',
        'src/sitemap.xml',
        'src/robots.txt',
      ],
    },
  };


  //html

  export const html = () =>
    gulp
      .src(path.src.html)
      .pipe(
        gulpif(
          !dev,
          htmlmin({
            removeComments: true,
            collapseWhitespace: true,
          }),
        ),
      )
      .pipe(gulp.dest(path.docs.html))
      .pipe(browserSync.stream());


  export const php = () =>
    gulp
      .src(path.src.php)
      .pipe(gulp.dest(path.docs.php)) // Копируем PHP файлы в docs/php
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  // Добавляем задачу для обработки файлов из папки 'other'
  export const other = () =>
    gulp
      .src(path.src.other)
      .pipe(gulp.dest(path.docs.base))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );


  //pug
  export const pug = () =>
    gulp
      .src(path.src.pug)
      .pipe(
        gulppug({
          pretty: true,
        }).on('error', function (err) {
          console.log(err.toString());
          this.emit('end');
        }),
      )
      .pipe(gulpif(!dev, gulp.dest(path.docs.html)))
      .pipe(
        gulpif(
          dev,
          prettyHtml(),
          htmlmin({
            removeComments: true,
            collapseWhitespace: true,
          }),
        ),
      )
      .pipe(gulp.dest(path.docs.html))
      .pipe(browserSync.stream());

  // css

  export const scss = () =>
    gulp
      .src(path.src.scss)
      .pipe(gulpif(dev, sourcemaps.init()))
      .pipe(compSass().on('error', compSass.logError))
      .pipe(
        gulpif(
          !dev,
          autoprefixer({
            cascade: false,
            grid: false,
          }),
        ),
      )
      .pipe(gulpif(!dev, gcmq()))
      .pipe(gulpif(!dev, gulp.dest(path.docs.css)))
      .pipe(
        gulpif(
          !dev,
          cleanCSS({
            2: {
              specialComments: 0,
            },
          }),
        ),
      )
      .pipe(
        rename({
          suffix: '.min',
        }),
      )
      .pipe(gulpif(dev, sourcemaps.write()))
      .pipe(gulp.dest(path.docs.css))
      .pipe(browserSync.stream());

  // js

  const webpackConfCritjs = {
    mode: dev ? 'development' : 'production',
    devtool: dev ? 'eval-source-map' : false,
    optimization: {
      minimize: false,
    },
    output: {
      filename: 'critjs.js',
    },
    module: {
      rules: [],
    },
  };

  const webpackConfJs = {
    mode: dev ? 'development' : 'production',
    devtool: dev ? 'eval-source-map' : false,
    optimization: {
      minimize: true,
    },
    output: {
      filename: 'index.js',
    },
    module: {
      rules: [],
    },
  };

  if (!dev) {
    webpackConfCritjs.module.rules.push({
      test: /\.(js)$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
    });

    webpackConfJs.module.rules.push({
      test: /\.(js)$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
    });
  }

  export const critjs = () =>
    gulp
      .src(path.src.critjs)
      .pipe(plumber())
      .pipe(webpackStream(webpackConfCritjs, webpack))
      .pipe(gulpif(!dev, gulp.dest(path.docs.js)))
      .pipe(gulpif(!dev, terser()))
      .pipe(
        rename({
          basename: 'critjs',
          suffix: '.min',
        }),
      )
      .pipe(gulp.dest(path.docs.js))
      .pipe(browserSync.stream());

  export const js = () =>
    gulp
      .src(path.src.js)
      .pipe(plumber())
      .pipe(webpackStream(webpackConfJs, webpack))
      .pipe(gulpif(!dev, gulp.dest(path.docs.js)))
      .pipe(gulpif(!dev, terser()))
      .pipe(
        rename({
          basename: 'index',
          suffix: '.min',
        }),
      )
      .pipe(gulp.dest(path.docs.js))
      .pipe(browserSync.stream());

  export const img = () =>
    gulp
      .src(path.src.img)
      // .pipe(gulpif(!dev, tinypng({
      // 	key: 'API_KEY',
      // 	summarize: true,
      // 	log: true
      // })))
      .pipe(
        gulpif(
          !dev,
          gulpImg({
            optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
            pngquant: ['--speed=1', '--force', 256],
            zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
            jpegRecompress: [
              '--strip',
              '--quality',
              'medium',
              '--min',
              40,
              '--max',
              80,
            ],
            mozjpeg: ['-optimize', '-progressive'],
            gifsicle: ['--optimize'],
            svgo: true,
          }),
        ),
      )
      .pipe(gulp.dest(path.docs.img))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  export const svg = () =>
    gulp
      .src(path.src.svg)
      .pipe(
        svgSprite({
          mode: {
            stack: {
              sprite: '../sprite.svg',
            },
          },
        }),
      )
      .pipe(gulp.dest(path.docs.img))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  export const webp = () =>
    gulp
      .src(path.src.imgF)
      .pipe(
        gulpWebp({
          quality: dev ? 100 : 60,
        }),
      )
      .pipe(gulp.dest(path.docs.img))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  export const avif = () =>
    gulp
      .src(path.src.imgF)
      .pipe(
        gulpAvif({
          quality: dev ? 100 : 50,
        }),
      )
      .pipe(gulp.dest(path.docs.img))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  export const critCSS = () =>
    gulp
      .src(path.src.html)
      .pipe(
        critical({
          base: path.docs.base,
          inline: true,
          css: [path.docs.cssIndex],
        }),
      )
      .on('error', (err) => {
        console.error(err.message);
      })
      .pipe(gulp.dest(path.docs.base));

  export const copy = () =>
    gulp
      .src(path.src.assets, {
        base: path.src.base,
      })
      .pipe(gulp.dest(path.docs.base))
      .pipe(
        browserSync.stream({
          once: true,
        }),
      );

  export const server = () => {
    browserSync.init({
      ui: false,
      notify: false,
      host: 'localhost',
      port: 3001,
      tunnel: true,
      server: {
        baseDir: 'docs',
      },
    });

    gulp.watch(path.watch.html, html);
    // gulp.watch(path.watch.pug, pug);
    gulp.watch(path.watch.css, scss);
    gulp.watch(path.watch.js, js);
    gulp.watch(path.watch.svg, svg);
    gulp.watch(path.watch.img, img);
    gulp.watch(path.watch.imgF, webp);
    gulp.watch(path.watch.imgF, avif);
    gulp.watch(path.watch.php, php); // Добавляем вотчинг для PHP
  };


  export const clear = (done) => {
    deleteSync([path.docs.base], {
      force: true,
    });
    done();
  };

  const develop = (ready) => {
    dev = true;
    ready();
  };

  // export const base = gulp.parallel(html, scss, critjs, js, img, svg, webp, avif, copy);
  // export const base = gulp.parallel(html, scss, js, img, svg, webp, avif, copy);
  // export const base = gulp.parallel(html, scss, js, img, svg, webp, avif, php, copy); // Добавляем php
  export const base = gulp.parallel(html, scss, js, img, svg, webp, avif, php, copy, other);


  export const build = gulp.series(clear, base, critCSS);

  export default gulp.series(develop, base, server);
