const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
  entry: {
    popup: path.join(srcDir, "Popup.tsx"),
    options: path.join(srcDir, "Options.tsx"),
    background: path.join(srcDir, "background.ts"),
    content_script: path.join(srcDir, "content_script.tsx"),
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js",
  },
  optimization: {
    splitChunks: {
      name: "vendor",
      chunks(chunk) {
        return chunk.name !== "background";
      },
    },
    },
    module: {
    rules: [
      {
      test: /\.(ts|tsx)$/,
      use: "ts-loader",
      exclude: /node_modules/,
      },
      {
      test: /\.s?css$/,
      use: ["style-loader", "css-loader", "postcss-loader"], // add "postcss-loader" to CSS loaders
        exclude: /\.module\.s?(c|a)ss$/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: ".", to: "../", context: "public" }],
      options: {},
    }),
  ],
};
