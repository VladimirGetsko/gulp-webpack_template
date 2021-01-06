const { src, dest, watch, parallel, series } = require('gulp');

const scss 					= require('gulp-sass'),
			concat 				= require('gulp-concat'),
			browserSync 	= require('browser-sync').create(),
			autoprefixer 	= require('gulp-autoprefixer'),
			imagemin 			= require('gulp-imagemin'),
			del 					= require('del'),
			webpack 			= require('webpack-stream');

let isDev = true;
// let isProd = !isDev;

function browsersync() {
	browserSync.init({
		server: {
			baseDir: "app/"
		}
	});
}

function cleanDist() {
	return del('dist');
}

let webConfig = {
	output: {
		filename: 'main.min.js'
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [['@babel/preset-env', {
								corejs: 3,
								// debug: true,
								useBuiltIns: "usage"
						}]]
					}
				}
			}
		]
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? 'eval-source-map' : 'none'
};

function scripts() {
	return src('./app/js/main.js')
					.pipe(webpack(webConfig))
					.pipe(dest('./app/js'))
					.pipe(browserSync.stream());
}

function images () {
	return src('app/images/**/*')
					.pipe(imagemin(
						[
							imagemin.gifsicle({ interlaced: true }),
							imagemin.mozjpeg({ quality: 75, progressive: true }),
							imagemin.optipng({ optimizationLevel: 5 }),
							imagemin.svgo({
								plugins: [
									{ removeViewBox: true },
									{ cleanupIDs: false }
								]
							})
						]
					))
					.pipe(dest('dist/images'));
}

function styles() {
	return 	src('app/scss/style.scss')
					.pipe(scss({outputStyle: 'compressed'})) // compressed || expanded
					.pipe(concat('style.min.css'))
					.pipe(autoprefixer({
						overrideBrowserslist: ['last 10 version'],
						grid: true
					}))
					.pipe(dest('app/css'))
					.pipe(browserSync.stream());
}

function build() {
	return src([
						'./app/css/style.min.css',
						'./app/fonts/**/*',
						'./app/js/main.min.js',
						'./app/*.html'
					], {base: 'app'}) // base directory
					.pipe(dest('dist'));
}

function watching() {
	watch(['./app/scss/**/*.scss'], styles);
	watch(['./app/js/**/*.js', '!app/js/main.min.js'], scripts);
	watch(['./app/*.html']).on('change', browserSync.reload);
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;

exports.build = series(cleanDist, images, build);
exports.default = parallel(scripts, styles, browsersync, watching, scripts);

