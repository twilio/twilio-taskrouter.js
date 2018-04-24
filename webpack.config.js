const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackAutoInject = require('webpack-auto-inject-version');
const webpack = require('webpack');

const createConfig = libraryTarget => {
    const config = {
        output: {
            libraryTarget: libraryTarget,
            filename: 'index.' + libraryTarget + '.js'
        },
        plugins: [
            new WebpackAutoInject({
                components: {
                    AutoIncreaseVersion: false
                },
                InjectAsComment: {
                    tag: 'Version: {version} - {date}',
                    dateFormat: 'h:MM:ss TT'
                },
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            })
        ],
        module: {},
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    uglifyOptions: {
                        parallel: true,
                        output: {
                            comments: /^\**!|@preserve|@license|@cc_on/
                        }
                    }
                })
            ]
        }
    };

    if (libraryTarget === 'window') {
        config.node = {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            process: false
        };
        config.target = 'web';
        config.entry = { main: './lib/web.js' }
    } else {
        config.entry = { main: './lib/index.js' }
        config.target = 'node';
    }

    return config;
};

module.exports = [
    createConfig('commonjs2'),
    createConfig('window')
];
