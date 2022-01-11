const query = require("../utils/promise_connection");

const handle = require("../utils/handle");

module.exports = async () => {
  var [bills, error] = await handle(
    query(
      "select Tenant.first_name, Tenant.last_name, tenant_bill.fees ,tenant_bill.invoice_id,tenant_bill.billing_date,tenant_bill.total from tenant join tenant_bill on tenant.id = tenant_bill.tenant_id;"
    )
  );

  handle.throw(error);

  return { bills: bills };
};
