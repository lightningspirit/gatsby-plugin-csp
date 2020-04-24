const React = require("react");
const flatten = require("lodash.flatten");

const { cspString, getHashes, saveCsp, defaultDirectives } = require("./utils");

exports.onPreRenderHTML = (
  {
    pathname,
    getHeadComponents,
    replaceHeadComponents,
    getPreBodyComponents,
    getPostBodyComponents,
  },
  userPluginOptions
) => {
  const {
    disableOnDev = true,
    reportOnly = false,
    mergeScriptHashes = true,
    mergeStyleHashes = true,
    mergeDefaultDirectives = true,
    directives: userDirectives,
    useMetaTag = true,
    cspFileName = ".cache/csp.json",
  } = userPluginOptions;

  // early return if plugin is disabled on dev env
  if (process.env.NODE_ENV === "development" && disableOnDev) {
    return;
  }

  let components = [
    ...flatten(getHeadComponents()),
    ...flatten(getPostBodyComponents()),
    ...flatten(getPreBodyComponents()),
  ];

  let directives = {
    ...(mergeDefaultDirectives && defaultDirectives),
    ...userDirectives,
  };

  let csp = {
    ...directives,
    ...(mergeScriptHashes && {
      "script-src": `${directives["script-src"] || ""} ${getHashes(
        components,
        "script"
      )}`,
    }),
    ...(mergeStyleHashes && {
      "style-src": `${directives["style-src"] || ""} ${getHashes(
        components,
        "style"
      )}`,
    }),
  };

  const headerName = reportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  const path = pathname.endsWith("/")
    ? `${pathname.substr(1)}index.html`
    : pathname.substr(1);

  saveCsp(cspFileName, path, {
    [headerName]: cspString(csp),
  });

  if (useMetaTag) {
    const cspComponent = React.createElement("meta", {
      httpEquiv: headerName,
      content: cspString(csp),
    });

    let headComponentsWithCsp = [cspComponent, ...getHeadComponents()];

    replaceHeadComponents(headComponentsWithCsp);
  }
};
