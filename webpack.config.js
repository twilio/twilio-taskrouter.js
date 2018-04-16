const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WebpackAutoInject = require('webpack-auto-inject-version');
const webpack = require('webpack');

const createConfig = (libraryTarget) => {
    return {
        entry: {
            main: './lib'
        },
        output: {
            libraryTarget: libraryTarget,
            filename: 'index.' + libraryTarget + '.js'
        },
        target: 'node',
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
        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            process: false
        },
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
};

module.exports = [
    createConfig('commonjs2'),
    createConfig('window')
];
