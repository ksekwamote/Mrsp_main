// var cryptojs = require("crypto-js");
const promise_query = require("../utils/promise_connection");
// var xlsx = require("xlsx");
// var fs = require("fs");
const datefns_tz = require("date-fns-tz");
const datefns = require("date-fns");
const { url } = require("inspector");
const create_listing = require("../listing/create_listing");
const onboard_tenant = require("./onboard_tenant");
const { error } = require("console");

// this method will read data from the excel that has been fomratted into JSON
// then use helper functions to create a new propert and add a tenant from the
// information provided
module.exports = (data, landlordId) => {
  let today = datefns_tz.utcToZonedTime(new Date(), "Africa/Johannesburg");
  // console.log(data);
  return new Promise((resolve, reject) => {
    for (var i = 0; i < data.length; i++) {
      //formatting the date when the user was created, this gets rid of extra quotes addded
      let onboardDate = data[i].date.replace(/D/g, "");
      onboardDate = onboardDate.replace("'", "");

      // this creates an tenant object to store information that is to be
      // passed into the onboardTenant function
      let tenantInformation = {
        rental_preset_id: data[i].RentalPresetID,
        first_name: data[i].first_name,
        last_name: data[i].last_name === "null" ? null : data[i].last_name,
        email_address: data[i].email_address,
        phone_number: data[i].phone_number,
        listing_id: data[i].listingID,
        tenancy_period: data[i].tenancy_period,
        date: onboardDate,
        landlord_name: data[i].landlord_name,
      };

      create_listing({
        LandLordID: landlordId,
        RentalPresetID: data[i].RentalPresetID
          ? parseInt(data[i].RentalPresetID)
          : 0,
        ScreeningPresetID: data[i].ScreeningPresetID
          ? parseInt(data[i].ScreeningPresetID)
          : 0,
        type: data[i].type,
        plot: data[i].plot,
        location: data[i].location,
        units_available: 1,
        num_bedrooms: data[i].num_beds === "null" ? null : data[i].num_beds,
        num_bathrooms:
          data[i].num_bathrooms === "null" ? null : data[i].num_bathrooms,
        description: data[i].description,
        pictures: data[i].pictures,
        date_created: new Date().toDateString(),
        visible: "true",
        block: data[i].block === "null" ? null : data[i].block,
        unit: data[i].unit === "null" ? null : data[i].unit,
        class: data[i].class,
        ID: -1,
      })
        .then((result) => {
          let resultId = result.url.slice(26);
          tenantInformation.listing_id = resultId;
          onboard_tenant(tenantInformation);
        })
        .then(() => {
          console.log(`user ${i} uploaded`);
        })
        .catch((err) => {
          // reject(err);
          console.log(err);
        });
      // resolve;
    }
  });
};

function as_date(str) {
  return datefns.parseISO(str + "T01:00:00.000Z");
}
