const query = require("../utils/promise_connection");
const datefns = require("date-fns");
const datefns_tz = require("date-fns-tz");
const handle = require("../utils/handle");
//for Lapsing, show leases that have i) lapsed and ii) are less than or equal to 90 days from lapse(diff(today, lease.lapse_date) <= 90)
module.exports = async (params) => {
  var today = datefns_tz.utcToZonedTime(new Date(), "Africa/Johannesburg");

  var [result, error] = await handle(
    query(
      "select concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Listing.plot, Listing.location, Listing.ID as listing_id,  ActiveTenant.tenancy_period, ActiveTenant.lapse_date, ActiveTenant.status  from ActiveTenant join Listing on ActiveTenant.ListingID = Listing.ID join Tenant on ActiveTenant.TenantID = Tenant.ID where ActiveTenant.status = ? or ActiveTenant.status = ?",
      ["active", "lapsed"]
    )
  );

  if (error) {
    console.log(result);
    throw Error(
      "error getting lapsed leases: " + error.message + "\n" + error.stacktrace
    );
  }
  var final = [];
  for (var i = 0; i < result.length; i++) {
    if (result[i].status === "lapsed") {
      result[i]["days_from_lapse"] = "lapsed";
      final.push(result[i]);
    } else {
      var days_from_lapse = datefns.differenceInCalendarDays(
        as_date(result[i].lapse_date),
        today
      );
      if (days_from_lapse <= 90) {
        result[i]["days_from_lapse"] = days_from_lapse + " days";
        final.push(result[i]);
      }
    }
  }

  return { lapsing: final };
};

function as_date(str) {
  return datefns.parseISO(str + "T01:00:00.000Z");
}
