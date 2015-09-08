var tfis2 = require('./test/tfis/TFIS2');
var fs = require('fs-extra');
var path = require('path');
var childProcess = require('child_process');
var spawn = childProcess.spawn;
var _ = require('underscore');
var cheerio = require('cheerio');
var saveLicense = require('uglify-save-license');
var upath = require('upath');

_.templateSettings = {
    interpolate: /\"<%=([\s\S]+?)%>\"/g
};

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell-spawn');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-file-append');
    grunt.loadNpmTasks('grunt-exorcise');
    grunt.loadNpmTasks('grunt-contrib-compress');

    var everliveCordovaPath = './test/mobile/EverliveCordova';
    var everliveNativeScriptPath = './test/mobile/EverliveNativeScript';

    var testResultsFileNameTemplate = './test/testResults';

    function getTestResutsFileName(platform) {
        return testResultsFileNameTemplate + platform + '.tap';
    }

    var PLATFORMS = {
        All: 'all',
        Desktop: 'desktop',
        Cordova: 'cordova',
        NativeScript: 'nativescript',
        CordovaAndNativeScript: 'cordovaandnativescript',
        Nodejs: 'nodejs'
    };

    var platform = (grunt.option('platform') || PLATFORMS.All).toLowerCase();

    var suite = grunt.option('suite');

    var DEFAULT_FILE = 'test/suites/everlive-all.html';
    var file = grunt.option('file') || DEFAULT_FILE;

    if (suite) {
        file = 'test/suites/' + suite + '/' + suite + '.html';
    }

    if (!fs.existsSync(file)) {
        grunt.fail.fatal('File - ' + file + ' does not exist');
    }

    var watchFiles = grunt.option('watch-files');
    if (watchFiles) {
        watchFiles = watchFiles.split(' ');
    } else {
        watchFiles = 'test/suites/**/*.js';
    }

    var browserifyConfig = {
        files: {
            'everlive.js': ['./src/index.js']
        },
        options: {
            external: ['application-settings', 'local-settings', 'file-system', 'http', 'stream', 'buffer', 'url',
                'https', 'zlib', 'node-localstorage', 'nativescript-push-notifications', 'platform'],
            browserifyOptions: {
                debug: true,
                standalone: 'Everlive'
            }
        }
    };

    grunt.initConfig({
        sessionId: null,
        env: {
            sessionId: {
                sessionId: function () { //grunt-env with function to set the sessionId env variable
                    return grunt.config.get('sessionId');
                }
            }
        },
        shell: {
            options: {
                failOnError: false
            },
            initializeNativeScriptPlatforms: {
                command: 'tns platform add android',
                options: {
                    execOptions: {
                        cwd: everliveNativeScriptPath
                    }
                }
            },
            initializeCordovaPlatforms: {
                command: 'cordova platform add android',
                options: {
                    execOptions: {
                        cwd: everliveCordovaPath
                    }
                }
            },
            initializeCordovaPlugins: {
                command: 'cordova plugin add org.apache.cordova.file https://github.com/apache/cordova-plugin-whitelist org.apache.cordova.file-transfer',
                options: {
                    execOptions: {
                        cwd: everliveCordovaPath
                    }
                }
            },
            deployCordovaApp: {
                command: 'cordova run android',
                options: {
                    execOptions: {
                        cwd: everliveCordovaPath
                    }
                }
            },
            deployNativeScriptApp: {
                command: 'tns run android --justlaunch',
                options: {
                    execOptions: {
                        cwd: everliveNativeScriptPath
                    }
                }
            },
            clearLogcat: {
                command: 'adb logcat -c'
            }
        },
        watch: {
            test: {
                files: watchFiles,
                tasks: ['test'],
                options: {
                    spawn: false,
                    atBegin: true
                }
            },
            browserify: {
                files: ['./src/*.js', './src/**/*.js'],
                tasks: ['build'],
                options: {
                    spawn: false,
                    atBegin: true
                }
            }
        },
        connect: {
            tests: {
                options: {
                    base: './',
                    keepalive: true,
                    useAvailablePort: true
                }
            }
        },
        exorcise: {
            everlive: {
                options: {},
                files: {
                    './everlive.map': ['./everlive.js']
                }
            }
        },
        browserify: {
            build: browserifyConfig,
            buildWatch: (function () {
                var config = JSON.parse(JSON.stringify(browserifyConfig));
                config.options.watch = true;
                config.options.keepAlive = true;
                return config;
            }())
        },
        uglify: {
            dist: {
                options: {
                    preserveComments: saveLicense
                },
                files:{
                    './dist/everlive.all.min.js': ['./dist/everlive.all.js']
                }
            }
        },
        copy: {
            license: {
                src: './license',
                dest: './dist/license'
            },
            readme: {
                src: './readme',
                dest: './dist/readme'
            }
        },
        compress: {
            dist: {
                options: {
                    archive: 'EverliveSDK.JS.zip'
                },
                cwd: './dist',
                src: ['**'],
                flatten: true,
                expand: true
            }
        }
    });


    grunt.registerTask('loginInIdentity', function () {
        var done = this.async();
        tfis2.login(function (err, sessionId) {
            if (err) {
                return done(err);
            }

            console.log('SessionID: ' + sessionId);
            grunt.config.set('sessionId', sessionId);
            done();
        });
    });

    grunt.registerTask('processExternalConfig', function () {
        var externalConfigFolder = path.join('./test', 'suites');
        var externalConfigTemplate = fs.readFileSync(path.join(externalConfigFolder, 'externalconfig.template.js'), 'utf8');
        var compiledTemplate = _.template(externalConfigTemplate);

        var detectPlatformCode = fs.readFileSync(path.join('./test', 'everlive.platform.js'), 'utf8');
        var detectPlatformCompiledFunction = new Function(detectPlatformCode);

        var externalConfig = compiledTemplate({
            sessionId: grunt.config.get('sessionId'),
            detectPlatform: detectPlatformCompiledFunction.toString()
        });

        fs.writeFileSync(path.join(externalConfigFolder, 'externalconfig.js'), externalConfig);
    });

    grunt.registerTask('copyDependencies', function () {
        npmModules.forEach(function (module) {
            if (!module.browserify) {
                grunt.file.copy(module.path, './dist/src/' + module.name + '.js');
            }
        });
    });

    grunt.registerTask('copyEverlive', function () {
        grunt.file.copy('./everlive.js', './dist/everlive.all.js');
        grunt.file.copy('./everlive.map', './dist/everlive.all.map');
    });

    grunt.registerTask('copyTests', function (platformName) {
        var platformFolder = 'Everlive' + platformName;
        var testsFolder = path.join(__dirname, 'test');
        platformName = platformName.toLowerCase();

        var platformFolderContent;
        if (platformName === PLATFORMS.Cordova) {
            platformFolderContent = path.join(testsFolder, 'mobile', platformFolder, 'www');
            fs.removeSync(platformFolderContent);
            fs.mkdirsSync(platformFolderContent);
        } else if (platformName === PLATFORMS.NativeScript) {
            platformFolderContent = path.join(testsFolder, 'mobile', platformFolder, 'app');
        }

        var platformTestsFolder = path.join(platformFolderContent, 'test');

        fs.readdirSync('./test')
            .filter(function (file) {
                return file !== 'mobile';
            })
            .forEach(function (fileName) {
                var filePath = path.join(testsFolder, fileName);
                fs.copySync(filePath, path.join(platformTestsFolder, fileName));
            });

        fs.copySync('./everlive.js', path.join(platformTestsFolder, 'everlive.js'));
        fs.copySync('./everlive.map', path.join(platformTestsFolder, 'everlive.map'));
    });

    function handleOutput(stdout, stderr, filter, logPlatform, done) {
        var mochaEndRegex = /# fail ([0-9]+)/;
        var delimiter = 'Mocha^^';

        stdout.on('data', function (data) {
            var line = data.toString();
            var lines = line.split(/\r\n|\n|\r/g);
            lines.forEach(function (line) {
                if ((filter && filter.test(line)) || !filter) {
                    grunt.log.writeln(line);
                }

                var hasDelimiter = line.indexOf(delimiter) !== -1;
                if (((line.indexOf('CordovaLog') !== -1 || line.indexOf('SystemWebChromeClient') !== -1) && hasDelimiter && logPlatform === PLATFORMS.Cordova) ||
                    (line.indexOf('JS') !== -1 && hasDelimiter && logPlatform === PLATFORMS.NativeScript) ||
                    (hasDelimiter && (logPlatform === PLATFORMS.Desktop || logPlatform === PLATFORMS.Nodejs))) {
                    var delimiterIndex = line.indexOf(delimiter);
                    var log = line.substr(delimiterIndex + delimiter.length).trim();
                    fs.appendFileSync(getTestResutsFileName(logPlatform), log + '\r\n');

                    if (mochaEndRegex.test(log)) {
                        done();
                    }
                }
            });
        });

        stderr.on('data', function (data) {
            grunt.log.writeln(data.toString());
        });
    }

    function handleSpawnProcess(procName, args, filter, logPlatform, done) {
        var childProc = spawn(procName, args);

        handleOutput(childProc.stdout, childProc.stderr, filter, logPlatform, done);

        process.on('exit', function () {
            childProc.kill();
        });
    }

    grunt.registerTask('readLogcat', function (logPlatform) {
        logPlatform = logPlatform.toLowerCase();
        var done = this.async();
        var adbFilter;
        if (logPlatform === PLATFORMS.Cordova) {
            adbFilter = /CordovaLog|SystemWebChromeClient/;
        } else if (logPlatform === PLATFORMS.NativeScript) {
            adbFilter = /JS|TNS.Native/;
        }

        handleSpawnProcess('adb', ['logcat'], adbFilter, logPlatform, done);
    });

    grunt.registerTask('testPhantomjs', function () {
        var done = this.async();
        if (path.extname(file) !== '.html') {
            grunt.fail.fatal('The file to run in phantomjs must be of type html ' + file);
        }

        handleSpawnProcess('./node_modules/phantomjs/bin/phantomjs', ['./test/external/phantomjsTest.js', file], null, PLATFORMS.Desktop, done);
    });

    grunt.registerTask('createCordovaFolders', function () {
        fs.ensureDirSync(path.join(everliveCordovaPath, 'platforms'));
        fs.ensureDirSync(path.join(everliveCordovaPath, 'plugins'));
        fs.ensureDirSync(path.join(everliveCordovaPath, 'www'));
    });

    grunt.registerTask('processCordovaConfig', function () {
        var configFilePath = path.join(everliveCordovaPath, 'config.xml');
        var configTemplateFilePath = path.join(everliveCordovaPath, 'config.template.xml');
        var configContent = fs.readFileSync(configTemplateFilePath, 'utf8');
        var compiledTemplate = _.template(configContent);
        var configuredConfig = compiledTemplate({file: '"' + file + '"'});

        fs.writeFileSync(configFilePath, configuredConfig);
    });

    grunt.registerTask('createNativeScriptFolders', function () {
        var platformsPath = path.join(everliveNativeScriptPath, 'platforms');
        fs.removeSync(platformsPath);
        fs.ensureDirSync(platformsPath)
    });

    function getTestsFromInputFile() {
        var entryFileContent = fs.readFileSync(file, 'utf8');
        var $ = cheerio.load(entryFileContent);
        var scripts = $('script');
        return scripts[0].attribs['data-js'].split(',').map(function (test) {
            test = test.trim();

            if (file === DEFAULT_FILE) {
                test = path.join('test', 'suites', test);
            } else {
                var testPath = path.resolve('/', file, '..');
                test = path.join(testPath, test);
            }

            var normalizedTestPath = upath.normalize(test);
            return normalizedTestPath;
        });
    }

    grunt.registerTask('processNativeScriptConfig', function () {
        var tests = getTestsFromInputFile();

        var compiledTemplate = _.template('module.exports = {tests: "<%= nativeScriptTests %>"};');
        var nativeScriptConfig = compiledTemplate({nativeScriptTests: JSON.stringify(tests)});
        fs.outputFileSync(path.join(everliveNativeScriptPath, 'app', 'config.js'), nativeScriptConfig);
    });

    grunt.registerTask('clearTestResults', function (platform) {
        fs.removeSync(getTestResutsFileName(PLATFORMS[platform]));
    });

    grunt.registerTask('test', function () {
        var tasks;

        function getTaskByPlatform(platform) {
            return 'test' + platform;
        }

        if (platform === PLATFORMS.All) {
            tasks = Object.keys(PLATFORMS)
                .filter(function (platform) {
                    return platform !== 'All' && platform !== 'CordovaAndNativeScript';
                })
                .map(function (platform) {
                    return getTaskByPlatform(platform);
                });
        } else if (platform === PLATFORMS.CordovaAndNativeScript) {
            tasks = [getTaskByPlatform('Cordova'), getTaskByPlatform('NativeScript')];
        } else {
            tasks = Object.keys(PLATFORMS)
                .filter(function (platformKey) {
                    return PLATFORMS[platformKey] === platform;
                })
                .map(function (platformKey) {
                    return getTaskByPlatform(platformKey);
                });
        }

        console.log('Running ' + tasks + ' tasks');
        grunt.task.run(tasks);
    });

    grunt.registerTask('clearDistFolder', function () {
        if (grunt.file.exists('dist')) {
            grunt.file.delete('dist');
        } else {
            grunt.log.writeln('No dist folder to clear');
        }
    });

    //release build
    grunt.registerTask('default', ['clearDistFolder', 'build', 'copyEverlive', 'uglify:dist', 'copy:license', 'copy:readme', 'compress:dist']);

    grunt.registerTask('build', ['browserify:build', 'exorcise:everlive']);
    grunt.registerTask('buildWatch', ['watch:browserify']);

    //common tests task
    grunt.registerTask('testCommon', ['loginInIdentity', 'processExternalConfig', 'build']);

    //desktop
    grunt.registerTask('testDesktop', ['testCommon', 'clearTestResults:Desktop', 'testPhantomjs']);

    //cordova
    grunt.registerTask('initializeCordova', ['createCordovaFolders', 'processCordovaConfig', 'shell:initializeCordovaPlatforms', 'shell:initializeCordovaPlugins']);
    grunt.registerTask('testCordova', ['testCommon', 'clearTestResults:Cordova', 'initializeCordova', 'copyTests:Cordova',
        'shell:deployCordovaApp', 'shell:clearLogcat', 'readLogcat:Cordova']);

    //nativescript
    grunt.registerTask('testNativeScript', ['testCommon', 'clearTestResults:NativeScript', 'createNativeScriptFolders', 'shell:initializeNativeScriptPlatforms',
        'copyTests:NativeScript', 'processNativeScriptConfig', 'shell:deployNativeScriptApp', 'shell:clearLogcat', 'readLogcat:NativeScript']);

    //nodejs
    grunt.registerTask('nodejsRunTests', function () {
        var tests = JSON.stringify(getTestsFromInputFile());

        var done = this.async();
        handleSpawnProcess('node', ['./test/external/nodejsTest.js', tests], null, PLATFORMS.Nodejs, done);
    });

    grunt.registerTask('testNodejs', ['testCommon', 'clearTestResults:Nodejs', 'nodejsRunTests']);
};
