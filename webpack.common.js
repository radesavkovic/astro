{
  test: /\.js$/,
  loader: 'source-map-loader',
  exclude: [
    // these packages have problems with their sourcemaps
    helpers.root('node_modules/rxjs'),
    helpers.root('node_modules/@angular'),
  ]
}