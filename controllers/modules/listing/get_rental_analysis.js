var promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  var cache = {};
  var payload = {};
  return new Promise((resolve, reject) => {
    promise_query("select * from Expense where ListingID = ?", [
      params.listing_id,
    ])
      .then((expenses) => {
        cache["expenses"] = expenses;
        payload["expenses"] = expenses;

        return promise_query(
          "select ActiveTenant.ID, Tenant.first_name, RentalPreset.monthly_rent, RentalPreset.other_monthly_fees from ActiveTenant join Tenant on ActiveTenant.TenantID = Tenant.ID join RentalPreset on ActiveTenant.RentalPresetID = RentalPreset.ID where ActiveTenant.ListingID = ? and ActiveTenant.status = ?",
          [params.listing_id, "active"]
        );
      })
      .then((income) => {
        cache["income"] = income;
        for (var i = 0; i < income.length; i++) {
          income[i].other_monthly_fees = JSON.parse(
            income[i].other_monthly_fees
          );
        }

        return promise_query(
          "select Listing.units_available, Listing.potential_credit_loss, RentalPreset.monthly_rent from Listing join RentalPreset on Listing.RentalPresetID = RentalPreset.ID where Listing.ID = ?",
          [params.listing_id]
        );
      })
      .then((listing_defaults) => {
        cache["listing_defaults"] = listing_defaults[0];
        payload["potential_credit_loss_percentage"] =
          cache.listing_defaults.potential_credit_loss;

        return promise_query(
          "select count(*) as occupied_units from ActiveTenant where ListingID = ?",
          [params.listing_id]
        );
      })
      .then((occupied_count) => {
        cache.listing_defaults["occupied_units"] =
          occupied_count[0].occupied_units;

        return promise_query(
          "select ActiveTenant.ID, concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Payment.ID as payment_id, Payment.description, Payment.amount, Payment.status, Payment.due_date from Payment join ActiveTenant on Payment.ActiveTenantID = ActiveTenant.ID join Tenant on ActiveTenant.TenantID = Tenant.ID where ActiveTenant.ListingID = ?",
          [params.listing_id]
        );
      })
      .then((payment_data) => {
        cache["payments"] = payment_data;
        payload["payments"] = payment_data;
        //vacancy rate
        payload["units_available"] =
          cache.listing_defaults.units_available -
          cache.listing_defaults.occupied_units;
        payload["occupied_units"] = cache.listing_defaults.occupied_units;
        payload["vacancy_rate"] =
          (cache.listing_defaults.occupied_units /
            cache.listing_defaults.units_available) *
          100;
        //gross monthly operating other_income
        var total_rent = 0.0;
        var total_other_income = 0.0;

        for (var i = 0; i < cache.income.length; i++) {
          total_rent += cache.income[i].monthly_rent;

          for (var j = 0; j < cache.income[i].other_monthly_fees.length; j++) {
            total_other_income += parseFloat(
              cache.income[i].other_monthly_fees[j].fee_amount
            );
          }
        }

        var loss_allowance =
          (cache.listing_defaults.potential_credit_loss / 100) * total_rent;

        payload["total_rent"] = total_rent;
        payload["total_other_income"] = total_other_income;
        payload["gross_monthly_operating_income"] = total_rent - loss_allowance;
        payload["potential_credit_loss"] = loss_allowance;

        var total_monthly_expenses = 0;
        var total_once_off_expenses = 0;

        for (var i = 0; i < cache.expenses.length; i++) {
          if (cache.expenses[i].type === "monthly") {
            total_monthly_expenses += cache.expenses[i].amount;
          } else {
            total_once_off_expenses += cache.expenses[i].amount;
          }
        }

        payload["monthly_operating_expenses"] = total_monthly_expenses;
        payload["total_once_off_expenses"] = total_once_off_expenses;

        payload["annual_operating_income"] =
          payload.gross_monthly_operating_income * 12;
        payload["annual_operating_expenses"] =
          payload.monthly_operating_expenses * 12;
        payload["annual_net_operating_income"] =
          payload.annual_operating_income - payload.annual_operating_expenses;
        payload["gross_potential_income"] =
          cache.listing_defaults.monthly_rent *
          cache.listing_defaults.units_available *
          12;

        var available =
          cache.listing_defaults.units_available -
          cache.listing_defaults.occupied_units;

        var vacant_rent = cache.listing_defaults.monthly_rent * available * 12;

        var total_late_payments = 0.0;

        for (var i = 0; i < cache.payments.length; i++) {
          if (cache.payments[i].status === "late") {
            total_late_payments += cache.payments[i].amount;
          }
        }

        var total_loss = vacant_rent + total_late_payments;

        if (payload.annual_net_operating_income > 0) {
          payload["actual_credit_loss_percentage"] =
            (total_loss / payload.gross_potential_income) * 100;
        } else {
          payload["actual_credit_loss_percentage"] = 0;
        }

        payload["actual_credit_loss"] = total_loss;
        return resolve(payload);
      })
      .catch((error) => {
        console.log(error);
        return reject({ message: error.message });
      });
  });
};
