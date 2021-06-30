const path = require("path")

module.exports = {
    
    entry: "./index.ts",
    mode: "development",
    devtool: "inline-source-map",
    module: {
      rules: [
        { test: /\.(j|t)sx?$/, use : {loader: 'babel-loader', 
        options: 
        {
            presets: 
            [
                "@babel/preset-env"
            ]
        }}},
        { test: /\.tsx?$/, use: [{ loader: path.resolve('../define_macro-loader.js')}]},
      ],
    },
  };