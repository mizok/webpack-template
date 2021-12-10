const fs = require('fs');
const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const globalSources = ['./src/scss/main.scss'];

const entry = ((globalSources) => {
  const entryObj = {};
  const jsRegx = /(.*)(\.js)/g;
  fs.readdirSync(resolve(__dirname, 'src/js')).forEach((o) => {
    if (!o.match(jsRegx)) return;
    const entryName = o.replace(jsRegx, `$1`);
    const entryPath = `${resolve(__dirname, 'src/js')}/${o}`;

    entryObj[entryName] = [entryPath, ...globalSources];
  })
  return entryObj;
})(globalSources)



const entryTemplates = Object.keys(entry).map((entryName) => {
  // 如果解析出來的檔名還包含"."的話, 例如"{name}.{template}", 則將{template}的部分自動解析為預計使用共用的模板檔案
  let templateName = entryName;
  let fileName = entryName;
  const templateRegex = /(.*)(\.)(.*)/g;
  if (entryName.match(templateRegex)) {
    templateName = entryName.replace(templateRegex, `$3`);
    fileName = entryName.replace(templateRegex, `$1`);
  };
  // check if template exist;
  const ejsTemplateFileExist = fs.existsSync(resolve(__dirname, `${templateName}.ejs`));
  const htmlTemplateFileExist = fs.existsSync(resolve(__dirname, `${templateName}.html`));

  if (!ejsTemplateFileExist && !htmlTemplateFileExist) {
    throw new Error(`目錄中找不到名為"${templateName}.ejs"的模板檔案，同時也不存在名為"${templateName}.html"的模板檔案。每當新增Entry JS File，請同時建立同名的模板檔案。`)
  }
  if (ejsTemplateFileExist) {
    const ejsFilePath = resolve(__dirname, `${templateName}.ejs`);
    const data = fs.readFileSync(ejsFilePath, 'utf8')
    if (!data) {
      //填入一個空白字元用來規避template-ejs-loader不接受空白檔案的情況
      fs.writeFile(ejsFilePath, ' ', () => { });
      console.warn(`請注意 : ${templateName}.ejs 為空白檔案`);
    }
  }

  return new HtmlWebpackPlugin({
    chunks: [entryName],
    filename: `${fileName}.html`,
    template: ejsTemplateFileExist ? `${templateName}.ejs` : `${templateName}.html`
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