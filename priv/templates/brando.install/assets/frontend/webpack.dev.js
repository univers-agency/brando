// webpack.dev.js - development builds
const MODERN_CONFIG = 'modern'

// node modules
const merge = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')

// webpack plugins
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

// config files
const common = require('./webpack.common.js')
const settings = require('./webpack.settings.js')

// Configure the webpack-dev-server
const configureDevServer = buildType => ({
  public: settings.devServerConfig.public(),
  host: settings.devServerConfig.host(),
  port: settings.devServerConfig.port(),
  disableHostCheck: true,
  hot: true,
  https: !!parseInt(settings.devServerConfig.https()),
  overlay: true,
  // outputPath: path.resolve(__dirname, settings.paths.dist.base),
  contentBase: path.resolve('static'),
  watchOptions: {
    poll: !!parseInt(settings.devServerConfig.poll()),
    ignored: [
      /node_modules([\\]+|\/)+(?!@univers-agency\/jupiter)/
    ]
  },
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
})

// Configure Image loader
const configureImageLoader = () => ({
  test: /\.(png|jpe?g|gif|svg|webp)$/i,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]'
      }
    }
  ]
})

// Configure the Postcss loader
const configurePostcssLoader = buildType => {
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      use: [
        {
          loader: ExtractCssChunks.loader,
          options: {
            hmr: true
            // reloadAll: true // when desperation kicks in - this is a brute force HMR flag
          }
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            sourceMap: true
          }
        },
        {
          loader: 'resolve-url-loader'
        },
        {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            sourceMap: true
          }
        }
      ]
    }
  }
}

// Development module exports
module.exports = [
  merge(
    common.modernConfig,
    {
      entry: {
        app: [
          './js/polyfills.modern.js',
          './js/index.js'
        ]
      },
      output: {
        filename: path.join('./js', '[name].js'),
        publicPath: `${settings.devServerConfig.public()}/`
      },
      mode: 'development',
      devtool: 'eval-cheap-module-source-map',

      devServer: configureDevServer(MODERN_CONFIG),
      module: {
        rules: [
          configurePostcssLoader(MODERN_CONFIG),
          configureImageLoader(MODERN_CONFIG)
        ]
      },
      plugins: [
        new WriteFilePlugin(),

        new CopyWebpackPlugin({
          patterns: [
            {
              context: './static',
              from: '**/*',
              to: '.',
              force: true
            }
          ]
        }),

        new ExtractCssChunks(
          {
            filename: 'css/[name].css',
            orderWarning: true
          }
        ),

        new webpack.HotModuleReplacementPlugin(),
        new HardSourceWebpackPlugin()
      ]
    }
  )
]