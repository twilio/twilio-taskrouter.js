const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const pkg = require('./package.json');

const fileVersion = `${pkg.name}.js ${pkg.version}`;
const banner = `${fileVersion}`;

const createConfig = libraryTarget => {
    const config = {
        output: {
            libraryTarget: libraryTarget,
            filename: 'index.' + libraryTarget + '.js'
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }),
            new CopyPlugin({
                patterns: [
                    { from: 'types.d.ts' }
                ]
            }),
            new webpack.BannerPlugin({
                banner,
                include: /\.js$/
            })
        ],
        externals: [nodeExternals()],
        module: {},
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        format: {
                            comments: /^\**!|@preserve|@license|@cc_on/
                        }
                    },
                    extractComments: true
                })
            ],
        }
    };

    if (libraryTarget === 'window') {
        config.resolve = {
            fallback: {
                fs: 'empty',
                net: 'empty',
                tls: 'empty',
                process: false,
                path: require.resolve('path-browserify'),
                util: require.resolve('util/'),
                https: require.resolve('./utils/https-browserify'),
                http: false,
                url: false,
            },
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
