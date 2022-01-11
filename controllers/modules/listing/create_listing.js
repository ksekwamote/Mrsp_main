var promise_query = require("../utils/promise_connection");

module.exports = (listing) => {
  return new Promise((resolve, reject) => {
    if (listing.ID != -1) {
      promise_query(
        "update Listing set RentalPresetID = ? , ScreeningPresetID = ?, type = ?, location = ?, plot =?, units_available = ?, num_bedrooms = ? , num_bathrooms =?, pictures = ?, description = ?, visible = ?, block = ?, unit = ?, class = ? where ID = ?",
        [
          listing.RentalPresetID,
          listing.ScreeningPresetID,
          listing.type,
          listing.location,
          listing.plot,
          listing.units_available,
          listing.num_bedrooms,
          listing.num_bathrooms,
          listing.pictures,
          listing.description,
          listing.visible,
          listing.block,
          listing.unit,
          listing.class,
          listing.ID,
        ]
      )
        .then((result) =>
          resolve({ url: "/listings/view_listing?id=" + listing.ID })
        )
        .catch((error) => reject(error));
    } else {
      delete listing["ID"];
      promise_query("insert into Listing set ?", listing)
        .then((result) =>
          resolve({ url: "/listings/view_listing?id=" + result.insertId })
        )
        .catch((error) => reject(error));
    }
  });
};
