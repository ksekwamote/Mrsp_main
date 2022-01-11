const query = require("../utils/promise_connection");

const handle = require("../utils/handle");

module.exports = async (params) => {
  var [expenses, error] = await handle(
    query(
      "select Listing.location, Listing.plot, Listing.ID as listing_id, Expense.* from Expense join Listing on Expense.ListingID = Listing.ID order by Expense.date_recorded desc"
    )
  );

  handle.throw(error);

  return { expenses: expenses };
};
