const CopyPlugin = require('copy-webpack-plugin');
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
            }),
            new CopyPlugin(['types.d.ts']),
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
        config.entry = { main: './lib/web.js' }
        config.output.library = 'TaskRouter';
        config.output.libraryTarget = 'umd';
    } else if (libraryTarget == 'test') {
        config.node = {
            fs: 'empty',
            net: 'empty',
            tls: 'empty',
            process: false
        };
        config.entry = { main: './test/unit/index.js'},
        config.output.libraryTarget = 'umd';
    } else {
        config.entry = { main: './lib/index.js' }
        config.target = 'node';
    }

    return config;
};

module.exports = function(env, argv) {
  if (env && env.NODE_ENV === 'test') {
    return [
      createConfig('window'),
      createConfig('test')
    ]
  } else {
    return [
      createConfig('commonjs2'),
      createConfig('window')
    ]
  }
}
