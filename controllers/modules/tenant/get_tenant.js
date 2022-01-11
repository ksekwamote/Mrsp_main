const promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    var payload = {};
    promise_query("select * from ActiveTenant where ID = ?", [
      params.active_tenant_id,
    ])
      .then((tenant) => {
        payload["tenant"] = tenant[0];

        return promise_query(
          "select * from ServiceRequest where ActiveTenantID = ? and status != ?",
          [parseInt(params.active_tenant_id), 2]
        );
      })
      .then((service_requests) => {
        payload["service_requests"] = service_requests;

        return promise_query(
          "select Payment.*, Invoice.file from Payment join Invoice on Payment.InvoiceID = Invoice.ID where Payment.ActiveTenantID = ? order by Payment.status, Payment.due_date desc",
          [parseInt(params.active_tenant_id)]
        );
      })
      .then((payments) => {
        payload["payments"] = payments;

        return promise_query(
          "select ID, plot, location from Listing where ID = ?",
          [payload.tenant.ListingID]
        );
      })
      .then((listing) => {
        payload["listing"] = listing[0];

        return promise_query("select * from Tenant where ID = ?", [
          payload.tenant.TenantID,
        ]);
      })
      .then((result) => {
        payload.tenant["profile"] = result[0];
        return promise_query("select * from RentalPreset where ID = ?", [
          payload.tenant.RentalPresetID,
        ]);
      })
      .then((rental_preset) => {
        payload["rental_preset"] = rental_preset[0];
        return resolve(payload);
      })
      .catch((error) => reject(error));
  });
};
