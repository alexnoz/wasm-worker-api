var Module
if (!Module) Module = {}

Module.locateFile = function (url) {
  return 'build/' + url
}