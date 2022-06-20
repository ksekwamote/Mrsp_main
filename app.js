var createError = require("http-errors");
var express = require("express");
var connect = require("connect-ensure-login");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var path = require("path");
var cryptojs = require("crypto-js");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var morgan_body = require("morgan-body");
var index_router = require("./routes/index");
var listing_router = require("./routes/listing");
var tenant_router = require("./routes/tenant");
var application_router = require("./routes/application");
var session = require("express-session");
var mysqlstore = require("express-mysql-session");
var flash = require("connect-flash");
var promise_query = require("./controllers/modules/utils/promise_connection");
var billing_inspector = require("./controllers/modules/tenant/billing_inspector");
var cron = require("node-cron");
require("dotenv").config({ path: require("app-root-path") + "/.env" });

var app = express();

var options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  connectionLimit: 1,
  endConnectionOnClose: true,
};

var sessionStore = new mysqlstore(options);
//set resave to true for use with mysql store b/c it does not implement touch method(session renewal)

app.use(
  session({
    key: "mrps-landlord-mts_key",
    secret: "mrsp-landlord-session_cookie_secret",
    store: sessionStore,
    resave: true,
    saveUninitialized: false,
  })
);

// view engine setup
// app.engine('html', require('ejs').renderFile);
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true, // allows us to pass back the entire request to the callback,
      successReturnToOrRedirect: "/",
      failureRedirect: "/",
    },
    (req, username, password, done) => {
      promise_query(
        "select * from LandLord where email_address = ? or accounting_email_address = ? or maintenance_email_address =  ? or management_email_address =? or secondary_email_address = ?",
        [username, username, username, username, username]
      )
        .then((result) => {
          if (result.length === 0) {
            return done(null, false, { message: "Incorrect Email Address" });
          }

          var hash = cryptojs.SHA256(password).toString(cryptojs.enc.Base64);

          if (username === result[0].email_address) {
            if (hash === result[0].password) {
              req.session["role"] = "primary";
              return done(null, result[0]);
            }
          }
          if (username === result[0].accounting_email_address) {
            if (hash === result[0].accounting_password) {
              req.session["role"] = "accounts";

              return done(null, result[0]);
            }
          }
          if (username === result[0].maintenance_email_address) {
            if (hash === result[0].maintenance_password) {
              req.session["role"] = "maintenance";

              return done(null, result[0]);
            }
          }

          if (username === result[0].management_email_address) {
            if (hash === result[0].management_password) {
              req.session["role"] = "management";
              return done(null, result[0]);
            }
          }

          if (username === result[0].secondary_email_address) {
            if (hash === result[0].secondary_password) {
              req.session["role"] = "secondary";
              return done(null, result[0]);
            }
          }

          return done(null, false, { message: "Incorrect password" });
        })
        .catch((error) => done(error));
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user.ID);
});

passport.deserializeUser(function (user_id, cb) {
  promise_query("select email_address  from LandLord where ID = ?", [user_id])
    .then((result) =>
      cb(null, true, { ID: user_id, email_address: result[0].email_address })
    )
    .catch((error) => cb(null, false, { message: error.message }));
});

app.set("view engine", "ejs");

app.locals.delimiter = "?";

app.use(logger("dev"));
morgan_body(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/", index_router);
app.use("/listings", connect.ensureLoggedIn("/"), listing_router);
app.use("/tenants", connect.ensureLoggedIn("/"), tenant_router);
app.use("/applications", connect.ensureLoggedIn("/"), application_router);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  if (err) throw err;
  res.send(err.message);
});
//daily at 08:30 am
var task = cron.schedule("30 8 * * *", () => {
  billing_inspector()
    .then((result) => console.log("Billing Inspector: " + result))
    .catch((error) => console.log("Billing Inspector Error: " + error));
});
task.start();

app.listen(3012, () => console.log(`Listening to 3012`));
// module.exports = app;
