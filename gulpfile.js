var gulp = require('gulp');
var $ = require('gulp-load-plugins')();                          // 簡化載入套件
// var jade = require('gulp-jade');                              // 編譯 jade
// var sass = require('gulp-sass');                              // 編譯 sass
// var plumber = require('gulp-plumber');                        // 出錯繼續執行
// var postcss = require('gulp-postcss');                        
var autoprefixer = require('autoprefixer');                      // 加入 css 前綴詞
var browserSync = require('browser-sync').create();              // web server 生成
var minimist = require('minimist');                              // 自定義狀態


//定義環境
var envOptions = {
  // string: 'enviroment',
  default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options);

//清除檔案
gulp.task('clean', function () {
  return gulp.src(['./dist'], { read: false, allowEmpty: true })
    .pipe($.clean());
});

// icon font
gulp.task('iconfont', () =>
  gulp.src('./src/stylesheet/icons/**')
    .pipe(gulp.dest('./dist/icons/'))
);

// 編譯 jade
gulp.task('jade', function () {
  return gulp.src('./src/**/*.jade')
    .pipe($.plumber())
    ////載入 json 檔案
    .pipe($.data(function(){
      var data = require('./src/data/data.json');
      var source = {
        data,
      };
      return source;
    }))
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
});

// 編譯 sass
gulp.task('sass', function () {
  return gulp.src('./src/stylesheet/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested',
      includePaths: ['./node_modules/bootstrap/scss'],        //外部載入套件
    }).on('error', $.sass.logError))
    //編譯完成
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(options.env === 'production' ,$.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())
});

// 編譯 js
gulp.task('js', () =>
  gulp.src('./src/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production' ,$.uglify({
      compress: {
        drop_console: true
      } 
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream())
);

//暫存檔 js 資料夾內
gulp.task('vendorJs', function(){
  return gulp.src([
    './node_modules/jquery/dist/jquery.js',
    './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
    .pipe($.concat('vendors.js'))
    .pipe($.if(options.env === 'production' ,$.uglify()))
    .pipe(gulp.dest('./dist/js'))
});


// 壓縮圖片
gulp.task('image-min', () =>
  gulp.src('./src/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./dist/images'))
);

// parallel and series
// parallel 同時執行
// series 依序執行
gulp.task('build',
  gulp.series(
    'clean',
    'vendorJs',
    gulp.parallel('iconfont', 'jade', 'sass', 'js', 'image-min')
  )
)

gulp.task('default',
  gulp.series(
    'clean',
    'vendorJs',
    gulp.parallel('iconfont', 'jade', 'sass', 'js', 'image-min'),
    function (done) {
      browserSync.init({
        server: {
          baseDir: "./dist"
        },
        reloadDebounce: 2000
      });
      gulp.watch('./src/**/*.jade', gulp.series('jade'));
      gulp.watch('./src/stylesheet/**/*.scss', gulp.series('sass'));
      gulp.watch('./src/js/**/*.js', gulp.series('js'));
      done();
    }
  )
)