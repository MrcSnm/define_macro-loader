const path = require("path")

module.exports = {
    
    entry: "./index.ts",
    mode: "development",
    devtool: "inline-source-map",
    module: {
      rules: [
        { 
          test: /\.(j|t)s$/,
          use : 
          [
            {loader: 'babel-loader'},
            {loader: path.resolve('../define_macro-loader.js')}
          ], 
        }
      ],
    },
    resolve:
    {
      extensions: [".ts", ".js"]
    }
  };