const create_active_tenant = require("./modules/tenant/create_active_tenant");
const get_tenants = require("./modules/tenant/get_tenants");
const get_tenant = require("./modules/tenant/get_tenant");
const create_payment = require("./modules/tenant/create_payment");
const post_notice = require("./modules/tenant/post_notice");
const resolve_incident = require("./modules/tenant/resolve_incident");
const onboard_tenant = require("./modules/tenant/onboard_tenant");
const revoke_code = require("./modules/tenant/revoke_code");
const defaulters = require("./modules/tenant/defaulters");
const escalations = require("./modules/tenant/escalations");
const lapsing = require("./modules/tenant/lapsing");
const service_requests = require("./modules/tenant/service_requests");
const transactions = require("./modules/tenant/transactions");
const confirm_pop = require("./modules/tenant/confirm_pop");
const assign_respondent = require("./modules/tenant/assign_respondent");
const get_tenant_bills = require("./modules/tenant/get_tenant_bills");
const bulk_upload_tenants = require("./modules/tenant/bulk_upload");
const XLSX = require("xlsx");
const multer = require("multer");
const changeInvoiceDate = require('./modules/tenant/changeInvoiceDate');

// const billing_inspector = require("./modules/tenant/billing_inspector");
// const upload = multer({ dest: "uploads/" });
const inspector = require("./modules/tenant/billing_inspector");

module.exports.changeInvoiceDate = (req,res, next)=>{
  changeInvoiceDate(req.body).then(
    () => res.send({success: "success"})
  ).catch(error => res.status(200).send(error))
}



module.exports.bulk_upload = (req, res, next) => {
  const file = XLSX.readFile(req.file.path);
  let data = [];
  const sheets = file.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
    temp.forEach((user) => {
      data.push(user);
      // data[i].password = password;
    });
  }
  console.log(data)
  bulk_upload_tenants(data, req.session.passport.user).then(
    console.log("Data uploaded")
  ).catch(err => console.log("An error has occured: "+err))
  res.redirect("/listings");
};

module.exports.load = (req, res, next) => {
  get_tenants({ landlord_id: req.session.passport.user })
    .then((result) => res.render("tenants.ejs", { payload: result }))
    .catch((error) => res.status(200).send(error));
};

module.exports.get_bills = (req, res, next) => {
  get_tenant_bills()
    .then((results) => res.render("bills.ejs", { payload: results }))
    .catch((error) => res.status.status(200).send(error));
};

module.exports.view_tenant = (req, res, next) => {
  get_tenant({ active_tenant_id: req.query.id })
    .then((result) => res.render("tenant_view", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create_active_tenant = (req, res, next) => {
  create_active_tenant({
    tenant_id: req.body.tenant_id,
    listing_id: req.body.listing_id,
    application_id: req.body.application_id,
    rental_preset_id: req.body.rental_preset,
    monthly_rent: req.body.monthly_rent,
    security_deposit: req.body.security_deposit,
    start_date: req.body.start_date,
    tenancy_period: req.body.tenancy_period,
    tenant_name: req.body.tenant_name,
    email: req.body.email,
    listing: req.body.listing,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.onboard_tenant = (req, res, next) => {
  onboard_tenant({
    rental_preset_id: req.body.rental_preset_id,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email_address: req.body.email_address,
    phone_number: req.body.phone_number,
    listing_id: req.body.listing_id,
    tenancy_period: req.body.tenancy_period,
    date: req.body.date,
    landlord_name: req.body.landlord_name,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.create_payment = (req, res, next) => {
  create_payment({
    ActiveTenantID: req.body.active_tenant_id,
    description: req.body.description,
    status: "due",
    amount: req.body.amount,
    due_date: req.body.due_date,
    email: req.body.email,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => {
      console.log(error);
      return res.render("error", { message: error.message });
    });
};

module.exports.post_notice = (req, res, next) => {
  post_notice({
    all: req.body.all,
    listing_id: req.body.listing_id,
    active_tenant_id: req.body.active_tenant_id,
    message: req.body.message,
    date: req.body.date,
    email: req.body.email,
  })
    .then((result) => res.send(result))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.resolve_incident = (req, res, next) => {
  resolve_incident({
    service_request_id: req.body.service_request_id,
    listing_id: req.body.listing_id,
    email: req.body.email,
    title: req.body.title,
    active_tenant_id: req.body.active_tenant_id,
    labour_cost: req.body.labour_cost,
    supply_cost: req.body.supply_cost,
    vat: req.body.vat,
    date: req.body.date,
  })
    .then((result) => res.send(result))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.revoke_code = (req, res, next) => {
  revoke_code({
    pending_tenant_id: req.body.pending_tenant_id,
    listing_id: req.body.listing_id,
    rental_code: req.body.rental_code,
  })
    .then((result) => res.redirect(result.url))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.defaulters = (req, res, next) => {
  defaulters()
    .then((result) => res.render("defaulters", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.escalations = (req, res, next) => {
  inspector()
    .then((result) => console.log(result))
    .catch((error) => console.log(error));

  escalations()
    .then((result) => res.render("escalations", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.lapsing = (req, res, next) => {
  lapsing()
    .then((result) => res.render("lapsing", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.service_requests = (req, res, next) => {
  service_requests()
    .then((result) => res.render("service_requests", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.transactions = (req, res, next) => {
  transactions()
    .then((result) => res.render("transactions", { payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};

module.exports.confirm_pop = (req, res, next) => {
  confirm_pop({
    accept: req.body.accept,
    transaction_id: req.body.transaction_id,
    payment_id: req.body.payment_id,
    confirmed_amount: req.body.confirmed_amount,
    payment_amount: req.body.payment_amount,
    date: req.body.date,
  })
    .then((result) => res.send({ payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};
module.exports.assign_respondent = (req, res, next) => {
  assign_respondent({
    service_request_id: req.body.service_request_id,
    assigned_respondent: req.body.assigned_respondent,
    respondent_contact: req.body.respondent_contact,
    email_address: req.body.email_address,
    date: req.body.date,
  })
    .then((result) => res.send({ payload: result }))
    .catch((error) => res.render("error", { message: error.message }));
};
