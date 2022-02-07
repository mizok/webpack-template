const fs = require('fs');
const { resolve } = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
import * as webpack from 'webpack';
import 'webpack-dev-server';// dont remove this import, it's for webpack-dev-server type
import HtmlWebpackPlugin from 'html-webpack-plugin';

const NO_COMPRESS = false;

//generate entry object
const entry:webpack.EntryObject = (() => {
  const entryObj:webpack.EntryObject = {};
  const templateRegx = /(.*)(\.)(ejs|html)/g;
  fs.readdirSync(__dirname).forEach((o:string) => {
    if (!o.match(templateRegx)) return;
    let entryName:string = o.replace(templateRegx, `$1`);
    const entryRegex = /(.*)(\.)(.*)/g;
    // 如果解析出來的template名還包含"."的話, 例如"{name}.{entry}", 則將{entry}的部分自動解析為預計使用共用的entry，而{name}則作為build出來的檔案名稱
    if (entryName.match(entryRegex)) {
      entryName = entryName.replace(entryRegex, `$3`);
    }
    const entryPath = resolve(__dirname, `src/ts/${entryName}.ts`);
    // 該entry的stylesheet
    const entryStyleSheetPath = resolve(__dirname, `./src/scss/${entryName}.scss`);
    const entryExist = fs.existsSync(entryPath);
    const entryStyleSheetExist = fs.existsSync(entryStyleSheetPath);

    if (entryExist) {
      if (!entryStyleSheetExist) {
        throw new Error(`src/scss中找不到名為"${entryName}.scss"的模板樣式檔案，請補上該檔案。`)
      }
    }
    else {
      throw new Error(`src/js中找不到名為"${entryName}.js"的入口檔案，請補上該entry file。`)
    }

    entryObj[entryName] = [entryPath, entryStyleSheetPath];

  })
  return entryObj;
})()
//generate htmlWebpackPlugin instances
const entryTemplates:HtmlWebpackPlugin[] = fs.readdirSync(__dirname).map((fullFileName:string) => {
  const templateRegx = /(.*)(\.)(ejs|html)/g;
  const ejsRegex = /(.*)(\.ejs)/g;
  const entryRegex = /(.*)(\.)(.*)(\.)(ejs|html)/g;
  if (!fullFileName.match(templateRegx)) return;
  const isEjs = fullFileName.match(ejsRegex);
  let entryName = '';
  let outputFileName = fullFileName.replace(templateRegx, `$1`);
  if (fullFileName.match(entryRegex)) {
    outputFileName = fullFileName.replace(entryRegex, `$1`);
    entryName = fullFileName.replace(entryRegex, `$3`);
  }
  const ejsFilePath = resolve(__dirname, `${fullFileName}`);
  const data = fs.readFileSync(ejsFilePath, 'utf8')
  if (!data) {
    fs.writeFile(ejsFilePath, ' ', () => { });
    console.warn(`請注意 : ${fullFileName} 為空白檔案`);
  }

  return new HtmlWebpackPlugin({
    cache: false,
    chunks: [entryName],
    filename: `${outputFileName}.html`,
    template: isEjs ? fullFileName : fullFileName.replace(ejsRegex, `$1.html`),
    favicon: 'src/assets/images/logo.svg',
    minify: NO_COMPRESS ? false : {
      collapseWhitespace: true,
      keepClosingSlash: true,
      removeComments: true,
      removeRedundantAttributes: false, 
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true
    }
  })
}).filter(function (x:HtmlWebpackPlugin|undefined) {
  return x !== undefined;
});


const config:webpack.Configuration = {
  entry: entry,
  output: {
    filename: 'js/[name].[chunkhash].js',
    chunkFilename: '[id].[chunkhash].js',
    path: resolve(__dirname, 'dist'),
    clean: true
  },
  target: ['web', 'es5'],
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    watchFiles: ['*.html', 'src/template/*.html', '*.ejs', 'src/template/*.ejs'],// this is important
    port: 8080
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node-modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        ],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: !NO_COMPRESS
            }
          }
        ],
      },
      {
        test: /\.ejs$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: !NO_COMPRESS
            }
          },
          'template-ejs-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      },
      {
        test: /\.(sass|scss|css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                ident: 'postcss',
                plugins: [
                  require('postcss-preset-env')()
                ]
              }
            }
          },
          (() => {
            return NO_COMPRESS ? {
              loader: 'sass-loader',
              options: { sourceMap: true, sassOptions: { minimize: false, outputStyle: 'expanded' } }
            } : 'sass-loader'
          })()

        ]
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg)$/,
        type: 'asset/inline',
      }

    ]
  },
  resolve: {
    alias: {
      '@img': resolve(__dirname, './src/assets/images/'),
      '@font': resolve(__dirname, './src/assets/fonts/')
    }
  },
  optimization: {
    minimize: !NO_COMPRESS,
    minimizer: [new TerserPlugin({
      terserOptions: {
        format: {
          comments: false,
        },
      },
      test: /\.(ts|js)(\?.*)?$/i,
      extractComments: false
    })],
    splitChunks: { name: 'vendor', chunks: 'all' }
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    (() => {
      return NO_COMPRESS ? undefined : new OptimizeCssAssetsWebpackPlugin()
    })(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CopyPlugin(
      {
        patterns: [
          {
            from: 'src/static',
            to: 'static',
            globOptions: {
              dot: true,
              ignore: ['**/.DS_Store', '**/.gitkeep'],
            },
            noErrorOnMissing: true,
          }
        ],
      }
    ),
    ...entryTemplates,

  ].filter(function (x) {
    return x !== undefined;
  })
}

export default config;