const gulp = require('gulp');
const sass = require('gulp-sass');
const bs = require('browser-sync').create();
const nunjucksRender = require('gulp-nunjucks-render');
const htmltidy = require('gulp-htmltidy');
const path = require('path');
const tildeImporter = require('node-sass-tilde-importer');
const fs = require('fs');
const opn = require('opn');
const dir = require('node-dir');
const viewDir = path.resolve(__dirname, 'src', 'templates', 'page');

gulp.task('browser-sync', function () {
    bs.init({
        server: {
            baseDir: './dist/'
        },
        middleware: [
            function (req, res, next) {
                // If this is an document request, find and set the correct HTML file to render.
                if (isHtmlReq(req)) {
                    req.url = getResolvedRoute(req.url);
                }
                
                next();
            }
        ],
        open: false
    });
    opn('http://localhost:3000/_dash');
});

gulp.task('sass', ['fonts', 'images'], function () {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sass({
            includePaths: [
                'src/scss',
                'node_modules'
            ],
            importer: tildeImporter
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(bs.reload({ stream: true }));
});

gulp.task('fonts', function () {
    return gulp.src(['src/fonts/**/*'])
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('js', function () {
    return gulp.src(['src/js/**/*'])
        .pipe(gulp.dest('dist/js'))
        .pipe(bs.reload({ stream: true }));
});

gulp.task('images', function () {
    return gulp.src(['src/images/**/*'])
        .pipe(gulp.dest('dist/images'));
});

gulp.task('html', function () {
    return gulp.src([
            'src/templates/page/**/*'
        ])
        // Render the page view templates.
        .pipe(nunjucksRender({
            path: 'src/templates'
        }))
        // Format the HTML output.
        .pipe(htmltidy({
            indent: true,
            indentSpaces: 4,
            hideComments: false
        }))
        // Send out to 'dist'.
        .pipe(gulp.dest('dist'))
        // Not always necessary.
        .pipe(bs.reload({ stream: true }));
});

gulp.task('dash', function () {
    let pages = getPages();

    return gulp.src([
            'src/templates/_dash.html'
        ])
        // Render the page view templates.
        .pipe(nunjucksRender({
            path: 'src/templates'
        }))
        // Format the HTML output.
        .pipe(htmltidy({
            indent: true,
            indentSpaces: 4,
            hideComments: false
        }))
        // Send out to 'dist'.
        .pipe(gulp.dest('dist'))
        // Not always necessary.
        .pipe(bs.reload({ stream: true }));
});

gulp.task('watch', ['html', 'sass', 'js', 'browser-sync'], function () {
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/templates/**/*.html', ['html']);
});

/**
 * Utils
 */

 // To differeniate between document requests and asset requests.
const isHtmlReq = function isHtmlReq(req) {
    return req.headers.accept
        && req.headers.accept.indexOf('text/html') !== -1;
};

const getPages = function getPages() {
    //dir.readFiles(path.resolve(__dirname, ''));
}

// Take the URL and resolve it to an HTML file to render.
const getResolvedRoute = function getResolvedRoute(url) {
    let route = '';

    // Strip leading/trailing slashes and HTML file extension.
    let reqUrl = url.replace(/^\/|\/$|\.html$/g, '');
    // If reqUrl is empty, set it to 'index' as a convention.
    reqUrl = reqUrl ? reqUrl : 'index';
    const resource = '/' + reqUrl;
    // For now, add an HTML extension.
    const resourceFilename = resource + '.html';

    // Get the full path to the resource file.
    let resourceFilePath = path.join(viewDir, resourceFilename);

    // Check if the file exists on disk.
    try {
        // Try the path/file itself.
        let stat = fs.statSync(resourceFilePath);
        route = resourceFilename;
    } catch (err) {
        try {
            // Try an index file in a directory as a last resort.
            resourceFilePath = path.join(viewDir, resource, 'index.html');
            let stat = fs.statSync(resourceFilePath);
            route = path.join(resource, 'index.html');
        } catch (err) {
            // 404 it.
            route = '/404.html';
        }
    }

    return route;
};
