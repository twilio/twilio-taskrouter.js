const TerserPlugin = require('terser-webpack-plugin');
const WebpackAutoInject = require('webpack-auto-inject-version');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

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
                // eslint-disable-next-line no-process-env
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            })
        ],
        externals: [nodeExternals()],
        module: {},
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
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
        config.entry = { main: './lib/web.js' };
        config.output.library = 'TaskRouter';
        config.output.libraryTarget = 'umd';
    } else if (libraryTarget === 'test') {
        config.node = {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            process: false
        };
        config.entry = { main: './test/unit/index.js' };
        config.output.libraryTarget = 'umd';
    } else {
        config.entry = { main: './lib/index.js' };
        config.target = 'node';
    }

    return config;
};

module.exports = function(env) {
  if (env && env.NODE_ENV === 'test') {
    return [
      createConfig('window'),
      createConfig('test')
    ];
  }
    return [
      createConfig('commonjs2'),
      createConfig('window')
    ];
};
