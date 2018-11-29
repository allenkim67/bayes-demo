var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bayes.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
	use: [{
	  loader: 'babel-loader',
	  query: {presets: ['es2015']}
	}],
        exclude: /node_modules/
      }
    ]
  },
  stats: {
    colors: true
  },
  devtool: 'source-map'
};
