const query = require("../utils/promise_connection");
const datefns = require("date-fns");
const datefns_tz = require("date-fns-tz");
const handle = require("../utils/handle");

module.exports = async (params) => {
  var today = datefns_tz.utcToZonedTime(new Date(), "Africa/Johannesburg");

  var [result, error] = await handle(
    query(
      "select concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Listing.plot, Listing.location, Listing.ID as listing_id, Payment.* from Payment join ActiveTenant on ActiveTenant.ID = Payment.ActiveTenantID join Listing on ActiveTenant.ListingID = Listing.ID join Tenant on ActiveTenant.TenantID = Tenant.ID where Payment.status = ? or ActiveTenant.status = ?",
      ["late", "frozen"]
    )
  );

  for (var i = 0; i < result.length; i++) {
    var days_late = datefns.differenceInCalendarDays(
      today,
      as_date(result[i].due_date)
    );
    result[i]["days_late"] = days_late;
  }

  return { defaulters: result };
};

function as_date(str) {
  return datefns.parseISO(str + "T01:00:00.000Z");
}
