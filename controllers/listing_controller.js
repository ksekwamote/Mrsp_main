const create_listing = require("./modules/listing/create_listing");
const get_presets = require("./modules/listing/get_presets");
const create_rental_preset = require("./modules/listing/create_rental_preset");
const get_listings = require("./modules/listing/get_listings");
const update_default_preset = require("./modules/listing/update_default_preset");
const create_screening_preset = require("./modules/listing/create_screening_preset");
const get_listing = require("./modules/listing/get_listing");
const toggle_listing_visibility = require("./modules/listing/toggle_listing_visibility");
const delete_listing = require("./modules/listing/delete_listing");
const toggle_offer_visibility = require("./modules/listing/toggle_offer_visibility");
const delete_rental_preset = require("./modules/listing/delete_rental_preset");
const delete_screening_preset = require("./modules/listing/delete_screening_preset");
const get_rental_analysis = require("./modules/listing/get_rental_analysis");
const update_potential_credit_loss = require("./modules/listing/update_potential_credit_loss");
const manage_expenses = require("./modules/listing/manage_expenses");
const expenses = require("./modules/listing/expenses");
const billing_inspector = require("./modules/tenant/billing_inspector");

module.exports.load = (req, res, next) => {
  // billing_inspector()
  //   .then((result) => console.log(result))
  //   .catch((error) => console.log(error));

  get_listings({ landlord_id: req.session.passport.user })
    .then((result) => res.render("listings.ejs", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create = (req, res, next) => {
  get_presets({
    landlord_id: req.session.passport.user,
  })
    .then((result) => res.render("listing_form.ejs", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create_listing = (req, res, next) => {
  create_listing({
    LandLordID: req.session.passport.user,
    RentalPresetID: req.body.rental_preset
      ? parseInt(req.body.rental_preset)
      : 0,
    ScreeningPresetID: req.body.screening_preset
      ? parseInt(req.body.screening_preset)
      : 0,
    type: req.body.type,
    plot: req.body.street_address,
    location: req.body.city,
    units_available: 1,
    num_bedrooms: req.body.num_bedrooms,
    num_bathrooms: req.body.num_bathrooms,
    description: req.body.description,
    pictures: req.body.pictures,
    date_created: req.body.date_created,
    visible: "true",
    block: req.body.block,
    unit: req.body.unit,
    class: req.body.class,
    ID: parseInt(req.body.listing_id),
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create_rental_preset = (req, res, next) => {
  create_rental_preset({
    LandLordID: req.session.passport.user,
    ListingID: parseInt(req.body.listing_id),
    name: req.body.preset_name,
    monthly_rent: req.body.monthly_rent,
    security_deposit: req.body.security_deposit,
    escalation_type: req.body.escalation_type,
    escalation_rate: req.body.escalation_rate,
    escalation_interval: req.body.escalation_interval,
    due_day: req.body.due_day,
    pro_rate_method: req.body.pro_rate_method,
    allow_partial_misc: req.body.allow_partial_misc,
    allow_partial_rent: req.body.allow_partial_rent,
    charge_late_fee: req.body.charge_late_fee,
    grace_period: req.body.grace_period ? req.body.grace_period : 0,
    charge_flat: req.body.charge_flat === "on" ? "true" : "false",
    charge_daily: req.body.charge_daily === "on" ? "true" : "false",
    flat_late_fee: req.body.flat_late_fee === "" ? 0 : req.body.flat_late_fee,
    daily_rate: req.body.daily_rate ? req.body.daily_rate : 0,
    max_cumulative_late_fee: req.body.max_cumulative_late_fee
      ? req.body.max_cumulative_late_fee
      : 0,
    other_monthly_fees: req.body.other_monthly_fees,
    purchase_order: req.body.purchase_order,
    update: req.body.update_rental,
    presetdefault: "true",
    rental_preset_id: req.body.rental_preset_id,
  })
    .then((result) => res.status(200).redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.update_default_preset = (req, res, next) => {
  update_default_preset({
    which: req.body.which,
    preset_id: req.body.preset_id,
    listing_id: req.body.listing_id,
  })
    .then((result) => res.status(200).send({ success: "true" }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create_screening_preset = (req, res, next) => {
  create_screening_preset({
    LandLordID: req.session.passport.user,
    name: req.body.preset_name,
    listing_id: req.body.listing_id,
    screening_preset_id: req.body.screening_preset_id,
    update: req.body.update,
    questions: req.body.questions,
    required_documents: req.body.required_docs,
    viewing_slots: req.body.viewing_slots,
  })
    .then((result) => res.status(200).redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.generate_upload_signature = (req, res, next) => {
  generate_signature({
    filename: req.body.filename,
    timestamp: req.body.timestamp,
  })
    .then((result) => res.send(result))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.view_listing = (req, res, next) => {
  get_listing({ listing_id: req.query.id })
    .then((result) => {
      res.render("listing_view.ejs", { payload: result });
    })
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.toggle_listing_visibility = (req, res, next) => {
  toggle_listing_visibility({
    listing_id: req.body.listing_id,
    visible: req.body.visible,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.delete_listing = (req, res, next) => {
  delete_listing({ listing_id: req.body.listing_id })
    .then((result) => res.status(200).redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.edit_listing = (req, res, next) => {
  get_listing({ listing_id: req.query.id })
    .then((result) => res.render("listing_form.ejs", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.toggle_offer_visibility = (req, res, next) => {
  toggle_offer_visibility({
    listing_id: req.body.listing_id,
    visible: req.body.visible,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", error));
};

module.exports.delete_rental_preset = (req, res, next) => {
  delete_rental_preset({
    rental_preset_id: req.body.rental_preset_id,
    listing_id: req.body.listing_id,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.delete_screening_preset = (req, res, next) => {
  delete_screening_preset({
    screening_preset_id: req.body.screening_preset_id,
    listing_id: req.body.listing_id,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.get_rental_analysis = (req, res, next) => {
  get_rental_analysis({ listing_id: req.body.listing_id })
    .then((result) => res.send(result))
    .catch((error) => res.send(error));
};

module.exports.update_potential_credit_loss = (req, res, next) => {
  update_potential_credit_loss({
    listing_id: req.body.listing_id,
    potential_credit_loss: req.body.potential_credit_loss,
  })
    .then((result) => res.send({ success: true }))
    .catch((error) => res.send(error));
};

module.exports.manage_expenses = (req, res, next) => {
  manage_expenses({
    action: req.body.action,
    expense_id: req.body.expense_id,
    expenses: req.body.expenses,
  })
    .then((result) => res.send(result))
    .catch((error) => res.send(error));
};
module.exports.expenses = (req, res, next) => {
  expenses()
    .then((result) => res.render("expenses", { payload: result }))
    .catch((error) => res.send(error));
};
