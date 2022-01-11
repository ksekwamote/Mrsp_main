const query = require("../utils/promise_connection");

const handle = require("../utils/handle");

module.exports = async (params) => {
  var [transactions, error] = await handle(
    query(
      "select concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Listing.plot, Listing.location, Listing.ID as listing_id, Payment.ID, Payment.ActiveTenantID, Payment.TransactionID, Payment.InvoiceID, Payment.description, Payment.amount, Payment.due_date, Payment.status, Transaction.file as pop_file, Transaction.upload_date, Transaction.confirmation_date, Transaction.status as t_status, Invoice.file as invoice_file from Payment left join Transaction on Payment.TransactionID = Transaction.ID left join Invoice on Payment.InvoiceID = Invoice.ID join ActiveTenant on Payment.ActiveTenantID = ActiveTenant.ID join Tenant on ActiveTenant.TenantID = Tenant.ID join Listing on ActiveTenant.ListingID = Listing.ID order by Payment.status, Payment.due_date desc; "
    )
  );

  handle.throw(error);

  return { transactions: transactions };
};
