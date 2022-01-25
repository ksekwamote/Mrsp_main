var express = require("express");
var tenant_controller = require("../controllers/tenant_controller");
var inspector = require("../controllers/modules/tenant/billing_inspector");
var router = express.Router();
var datefns_tz = require("date-fns-tz");
const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, __basedir + "/uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
//   },
// });

const upload = multer({ dest: "uploads/" });

router.get("/", tenant_controller.load);

router.post("/create_payment", tenant_controller.create_payment);

router.post("/create_active_tenant", tenant_controller.create_active_tenant);

router.post("/onboard_tenant", tenant_controller.onboard_tenant);

router.post(
  "/bulk_upload_tenants",
  upload.single("file"),
  tenant_controller.bulk_upload
);

router.get('/invoice' ,tenant_controller.invoice_inspector)

router.get("/view_tenant", tenant_controller.view_tenant);

router.post("/post_notice", tenant_controller.post_notice);

router.post("/resolve_incident", tenant_controller.resolve_incident);

router.post("/revoke_code", tenant_controller.revoke_code);

router.get("/defaulters", tenant_controller.defaulters);

router.get("/escalations", tenant_controller.escalations);

router.get("/lapsing", tenant_controller.lapsing);

router.get("/service_requests", tenant_controller.service_requests);

router.post("/confirm_pop", tenant_controller.confirm_pop);

router.get("/tenant_bills", tenant_controller.get_bills);

router.get("/transactions", tenant_controller.transactions);
router.post("/changeInvoiceDate" ,tenant_controller.changeInvoiceDate)
router.post("/assign_respondent", tenant_controller.assign_respondent);

router.post("/uploadfile", upload.single("uploadfile"), (req, res) => {
  importExcelData2MySQL(__basedir + "/uploads/" + req.file.filename);
  console.log(res);
});

router.get("/run_inspector", (req, res, next) =>
  inspector({
    date: datefns_tz.utcToZonedTime(new Date(), "Africa/Johannesburg"),
  })
    .then((result) => res.status(200).send(result))
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    })
);

module.exports = router;
