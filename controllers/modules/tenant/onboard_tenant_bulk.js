const promise_query = require("../utils/promise_connection");
const messenger = require("../utils/messenger");
const handle = require("../utils/handle");
const shortid = require("shortid");
const datefns = require("date-fns");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    var rental_code = shortid.generate();
    var tenant;
    var preset;
    var tenantID

    promise_query("select ID from PendingTenant where email_address = ?", [
      params.email_address,
    ])
      .then((result) => {
        if (result.length > 0)
          return reject({
            message:
              "Account already added.There's a pending tenant for this property",
          });

        return promise_query("select * from RentalPreset where ID = ?", [
          params.rental_preset_id,
        ]);
      })
      .then((rental_preset) => {
       preset = rental_preset[0];
        delete preset["ID"];
        preset['LandLordID']   = 3
        preset["name"] = "(pending) - " + params.email_address;
        preset["presetdefault"] = "true";
        preset["monthly_rent"] = params.monthly_rent,
        preset['security_deposit'] =params.security_deposit,
        preset['due_day'] = params.due_day
        preset['pro_rate_method']=params.pro_rate_method
        preset['allow_partial_rent']=params.allow_partial_rent
        preset['allow_partial_misc']=params.allow_partial_misc
        preset['charge_late_fee']=params.charge_late_fee
        preset['grace_period']=params.grace_period
        preset['charge_flat']=params.charge_flat
        preset['charge_daily']=params.charge_daily
        preset['flat_late_fee']=params.flat_late_fee
        preset['daily_rate'] = params.daily_rate
        preset['max_cumulative_late_fee'] = params.max_cumulative_late_fee
        preset['other_monthly_fees'] = params.other_monthly_fees
        preset['escalation_type'] = params.escalation_type
        preset['escalation_rate'] = params.escalation_rate
        preset['escalation_interval'] = params.escalation_interval
        
        console.log('The Preset')
        console.log(preset)
        // TODO add rental preset details to rentalagreemnts
        return promise_query("INSERT into RentalPreset set ?", preset);
      })
      .then((result) => {
        preset["ID"] = result.insertId;

        var lapse_date = as_date(params.date);

        lapse_date.setMonth(lapse_date.getMonth() + params.tenancy_period);
        tenant = {
          TenantID: 0,
          ListingID: 3,
          RentalPresetID: preset.ID,
          move_in_date: params.date,
          tenancy_period: params.tenancy_period,
          rental_code: rental_code,
          lapse_date: lapse_date.toISOString().split("T")[0],
          status: "pending",
        };
        return promise_query("insert into ActiveTenant set ?", tenant);
      })
      .then((result) => {
        tenant["ID"] = result.insertId;

        if (preset.escalation_type !== "none") {
          var num_escalations = Math.floor(
            tenant.tenancy_period / preset.escalation_interval
          );
          var scheduled_escalations = [];

          for (var i = 0; i < num_escalations; i++) {
            var base_rent, new_rent, effective_date;

            if (i === 0) {
              base_rent = preset.monthly_rent;
              effective_date = as_date(tenant.move_in_date);
            } else {
              base_rent = scheduled_escalations[i - 1].escalated_rent;
              effective_date = as_date(
                scheduled_escalations[i - 1].effective_date
              );
            }

            if (preset.escalation_type === "flat_fee") {
              new_rent = base_rent + preset.escalation_rate;
            } else if (preset.escalation_type === "percentage") {
              new_rent = (preset.escalation_rate / 100) * base_rent + base_rent;
            }

            effective_date.setMonth(
              effective_date.getMonth() + preset.escalation_interval
            );

            if (
              effective_date.toISOString().split("T")[0] !== tenant.lapse_date
            ) {
              var scheduled_escalation = {
                ActiveTenantID: tenant.ID,
                RentalPresetID: preset.ID,
                effective_date: effective_date.toISOString().split("T")[0],
                base_rent: parseFloat(base_rent.toFixed(2)),
                escalated_rent: parseFloat(new_rent.toFixed(2)),
                effected: "false",
              };

              console.log(scheduled_escalation);
              scheduled_escalations.push(scheduled_escalation);
            }
          }

          if (scheduled_escalations.length > 0) {
            (async () => {
              var [error, result] = await handle(
                promise_query(
                  "insert into ScheduledEscalation(ActiveTenantID, RentalPresetID, effective_date, base_rent, escalated_rent, effected) values ?",
                  [scheduled_escalations.map((e) => Object.values(e))]
                )
              );

              handle.throw(error);
              console.log(result);
            })();
          }
        }

        return promise_query("insert into PendingTenant set ?", {
          ActiveTenantID: tenant.ID,
          email_address: params.email_address,
          phone_number: params.phone_number,
          first_name: params.first_name,
          last_name: params.last_name,
        });
      })
      .then(()=>{
        return promise_query("update Listing set RentalPresetID = ? where ID = ? ",[preset["ID"] , params.listing_id])
        })
      .then((result) =>
        messenger.mail({
          from: process.env.MAILER_ADDRESS,
          to: params.email_address,
          subject: "MRSP Property Management System - Tenant Onboarding",
          text:
            "Dear Sir/Madam,\n\n" +
            "Your Land Lord " +
            params.landlord_name +
            " now uses Mrs. P – a Property Management Solution provided by Sycamon to manage their portfolio.\n\n" +
            "Access your dedicated Tenant Portal. Your account has been fully configured and requires activation. Account Activation steps are as follows:\n" +
            "\n1.	Go to " +
            process.env.TENANT_DOMAIN +
            "\n2.	In the top Navigation, click ‘Activate Lease’ (Top Right) " +
            "\n3.	Enter the following code: " +
            rental_code +
            "\n4.	Done.",
        })
      )
      .then((result) =>
        resolve({ url: "/listings/view_listing?id=" + params.listing_id })
      )
      .catch((error) => {
        console.log(error);
        return reject(error);
      });
  });
};

function validate(str) {
  var date = str.split("-");
  var year = parseInt(date[0]);
  var month = parseInt(date[1]);
  var day = parseInt(date[2]);

  var is_30_day_month = false;
  if (month < 8) {
    is_30_day_month = month % 2 === 0; //month less than 8
  } else {
    is_30_day_month = month === 9 || month === 11; //
  }

  if (day >= 28 && day <= 31) {
    if (month === 2 && day >= 28) {
      date = isLeapYear(year) ? 29 : 28;
    }

    if (is_30_day_month && day > 30) {
      day = 30;
    }
  }

  return year + "-" + pad(month) + "-" + pad(day);
}

function as_date(str) {
  return datefns.parseISO(str + "T01:00:00.000Z");
}

function pad(num) {
  return num < 10 ? "0" + num : num.toString();
}
