var query = require("./promise_connection");
var handle = require("./handle");

module.exports = async (req, res, next) => {
  var [result, error] = await handle(
    query("select activated from ProductKey;")
  );
  handle.throw(error);
  if (result[0].activated === "false") {
    return res.redirect("/signup");
  } else {
    return next();
  }
};
