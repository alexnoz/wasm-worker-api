var Module
if (!Module) Module = {}
Module.locateFile = function (url) {
  if (ENVIRONMENT_IS_NODE)
    return '<%path%>' + url
}