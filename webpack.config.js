const fs = require('fs');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
let globalSources = ['./src/scss/main.scss'];

let entry = ((globalSources) => {
  let entryObj = {};
  let jsRegx = /(.*)(\.js)/g
  fs.readdirSync(resolve(__dirname, 'src/js')).forEach((o) => {
    if (!o.match(jsRegx)) return;
    let entryPath = `${resolve(__dirname, 'src/js')}/${o}`;
    let entryName = o.replace(jsRegx, `$1`);
    entryObj[entryName] = [entryPath, ...globalSources];
  })
  return entryObj;
})(globalSources)

let entryTemplates = Object.keys(entry).map((entryName) => {
  // check if template exist;
  let ejsTemplateFileExist = fs.existsSync(resolve(__dirname, `${entryName}.ejs`));
  let htmlTemplateFileExist = fs.existsSync(resolve(__dirname, `${entryName}.html`));


  if (!ejsTemplateFileExist && !htmlTemplateFileExist) {
    throw new Error(`目錄中找不到名為"${entryName}.ejs"的模板檔案，同時也不存在名為"${entryName}.html"的模板檔案`)
  }

  return new HtmlWebpackPlugin({
    filename: `${entryName}.html`,
    template: ejsTemplateFileExist ? `${entryName}.ejs` : `${entryName}.html`
  })
})


module.exports = {
  entry: entry,
  output: {
    filename: 'assets/js/[name].js',
    chunkFilename: '[name].min.js',
    path: resolve(__dirname, 'build'),
    clean: true,
  },
  target: 'web',
  devServer: {
    contentBase: resolve(__dirname, 'build'),
    open: true,
    compress: true,
    hot: true
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
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
          }
        ],
      },
      {
        test: /\.ejs$/,
        use: [
          'html-loader',
          'template-ejs-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/img/[name][ext]'
        }
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../../'
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
          'sass-loader'
        ]
      },
      {
        test: /\.(otf|eot|ttf|woff2?)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/font/[name][ext]'
        }
      }

    ]
  },
  resolve: {
    alias: {
      '@img': resolve(__dirname, './src/img/'),
      '@font': resolve(__dirname, './src/font/')
    }
  },
  plugins: [
    new OptimizeCssAssetsWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: './assets/css/[name].css'
    }),
    ...entryTemplates,
  ]
}