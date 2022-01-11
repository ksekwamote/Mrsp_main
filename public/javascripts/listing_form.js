var upload_listing = document.getElementById("upload_listing");
var upload_pictures = document.getElementById("upload_pictures");
var picture_container = document.getElementById("picture_container");
var payload = JSON.parse(document.getElementById("payload").innerHTML);

$("#payload").remove();

var pictures = [];
if (payload.listing) {
  fill(payload.listing);
}
//Step 2.1:  Declare your uploadwidget variable
var myUploadWidget;
document.getElementById("upload_pictures").addEventListener(
  "click",
  function () {
    myUploadWidget = cloudinary.openUploadWidget(
      {
        cloudName: " thito-holdings",
        apiKey: "344641454392198",
        uploadPreset: "online-preset",
        multiple: true,
        max_files: 5,
        sources: ["local", "url", "camera"],
      },
      function (error, result) {
        //Step 2.3:  Listen to 'success' event
        if (result.event === "success") {
          if (pictures.length + 1 <= 5) {
            pictures.push({
              thumbnail: result.info.thumbnail_url,
              fullURL: result.info.secure_url,
            });

            for (let i = 0; i < pictures.length; i++) {
              pictures[i]["index"] = i;
            }
            render_picture(pictures[pictures.length - 1]);
          } else if (pictures.length === 5) {
            myUploadWidget.close();
            document.getElementById("toast_message").innerHTML =
              "<b>Upload limit reached.</b>";
          }
          //Step 2.4:  Call the .close() method in order to close the widget
          //myUploadWidget.close();
        }
      }
    );

    if (pictures.length < 5) {
      myUploadWidget.open();
    }
  },
  false
);

//Step 2.2:  Call the .open() method in order to open the widget

upload_listing.onclick = () => {
  if (pictures.length > 0) {
    document.getElementById("pictures").value = JSON.stringify(pictures);
    upload_listing.setAttribute("type", "submit");
    upload_listing.click();
  } else {
    document.getElementById("toast_message").innerHTML =
      "<b>Please upload atleast 1 picture(Max: 5).</b>";
  }
};

function fill(listing) {
  document.getElementById("description").value = listing.description;
  document.getElementById("plot").value = listing.plot;
  document.getElementById("location").value = listing.location;
  document.getElementById("units_available").value = listing.units_available;
  document.getElementById("property_type").value = listing.type;
  document.getElementById("num_bedrooms").value = listing.num_bedrooms;
  // document.getElementById("num_bedrooms").value = listing.num_bedrooms;
  document.getElementById("num_bathrooms").value = listing.num_bathrooms;
  document.getElementById("rental_preset").value = listing.RentalPresetID;
  document.getElementById("screening_preset").value = listing.ScreeningPresetID;
  document.getElementById("property_class").value = listing.class;
  document.getElementById("unit").value = listing.unit;
  document.getElementById("plot").value = listing.plot;
  document.getElementById("listing_id").value = listing.ID;
  upload_listing.innerHTML = "Save";

  pictures = JSON.parse(listing.pictures);
  for (let i = 0; i < pictures.length; i++) {
    render_picture(pictures[i]);
  }
}

function render_picture(picture) {
  var col = document.createElement("div");
  col.className = "col-lg-3 col-md-6 mb-4";

  var img = document.createElement("img");
  img.src = picture.fullURL;
  img.className = "card-img border rounded-0 border-bottom-0 img-pos";

  var hr = document.createElement("hr");
  hr.className = "my-1";

  var remove_button = document.createElement("remove_button");
  remove_button.innerHTML = "Remove";
  remove_button.className =
    "btn btn-secondary btn-block view-property-btn border-0 rounded-0";

  remove_button.onclick = (event) => {
    pictures.splice(picture.index, 1);
    picture_container.removeChild(col);
    document.getElementById("toast_message").innerHTML = "";
  };

  col.appendChild(img);
  col.appendChild(hr);
  col.appendChild(remove_button);

  picture_container.appendChild(col);
}
