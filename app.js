// import environment variables.
require("dotenv").config();
const globalError = require("http-errors");

// import node modules.
const express = require("express"),
  cookieParser = require("cookie-parser"),
  compression = require("compression"),
  helmet = require("helmet"),
  sassMiddleware = require("node-sass-middleware"),
  path = require("path"),
  cookieSession = require("cookie-session"),
  cookieSessionConfig = require("./config/cookieSession.config"),
  { hasData, checkPublic, checkLangQuery } = require("./utils");

// initialize application.
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "pug");

// general app configuration.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.app_session_secret));
app.use(require("./config/i18n.config").init);

// in production: use redis for sessions
// but this works for now
app.use(cookieSession(cookieSessionConfig));

// in production: precompile CSS
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    debug: false,
    indentedSyntax: false, // look for .scss files, not .sass files
    sourceMap: true,
    outputStyle: "compressed"
  })
);

// public assets go here (css, js, etc)
app.use(express.static(path.join(__dirname, "public")));

// dnsPrefetchControl controls browser DNS prefetching
// frameguard to prevent clickjacking
// hidePoweredBy to remove the X-Powered-By header
// hsts for HTTP Strict Transport Security
// ieNoOpen sets X-Download-Options for IE8+
// noSniff to keep clients from sniffing the MIME type
// xssFilter adds some small XSS protections
app.use(helmet());
// gzip response body compression.
app.use(compression());

app.use(checkPublic);
app.use(checkLangQuery);

// Adding values/functions to app.locals means we can access them in our templates
app.locals.GITHUB_SHA = process.env.GITHUB_SHA || null;
app.locals.hasData = hasData;

// configure routes
require("./routes/start/start.controller")(app);
require("./routes/login/login.controller")(app);
require("./routes/personal/personal.controller")(app);
require("./routes/notify/notify.controller")(app);
require("./routes/confirmation/confirmation.controller")(app);
require("./routes/offramp/offramp.controller")(app);
require("./routes/remind/remind.controller")(app);

// clear session
app.get("/clear", (req, res) => {
  req.session = null;
  res.redirect(302, "/");
});

app.use(function(req, res, next) {
  console.log((req.originalUrl))
  next(globalError(404));
});

// handle global errors.
app.use(function(err, req, res) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  console.log(err.message);

  res.status(err.status || 500).json({ message: "Internal service error." });
});

module.exports = app;
