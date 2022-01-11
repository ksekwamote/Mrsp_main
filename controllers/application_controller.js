const get_applications = require("./modules/applications/get_applications");
const get_application = require("./modules/applications/get_application");
const close_application = require("./modules/applications/close_application");

module.exports.load = (req, res, next) => {
  get_applications({ landlord_id: req.session.passport.user })
    .then((result) => res.render("applications.ejs", { payload: result }))
    .catch((error) => res.status(500).send(error));
};

module.exports.view_application = (req, res, next) => {
  get_application({ application_id: req.query.id })
    .then((result) => res.render("application_view.ejs", { payload: result }))
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};

module.exports.close_application = (req, res, next) => {
  close_application({
    application_id: req.body.application_id,
    email: req.body.email,
    listing: req.body.listing,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.status(500).send(error));
};
