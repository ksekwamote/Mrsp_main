const promise_query = require("../utils/promise_connection");
const messenger = require("../utils/messenger");
const handle = require("../utils/handle");
const datefns_tz = require("date-fns-tz");
const datefns = require("date-fns");
const numeral = require("numeral");
const HummusRecipe = require("hummus-recipe");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { rejects } = require("assert");
var today;
var today_arr;
var _today;
var outgoing_mail = [];
var processing_window = 5;
var invoiceFile;
//var invoice = require("../../../invoice_1642065546436.pdf")

//configuaration details for cloud storage.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = async (params) => {
  var cache = {};

  today = datefns_tz.utcToZonedTime(new Date(), "Africa/Johannesburg");
  today_arr = today.toISOString().split("T")[0].split("-");
  _today = today.toISOString().split("T")[0];

  console.log(
    "\n\n******running inspection for: " + today.toDateString() + "\n\n"
  );

  //get the landlord information
  let [landlords, landlord_error] = await handle(
    promise_query(
      "select ID, concat(first_name,' ', last_name) as fullname, email_address, accounting_email_address from LandLord;"
    )
  );
  if (landlord_error) throw Error(landlord_error.toString());
  cache["landlords"] = landlords;

  //gets the information for all active tenants by their landlord id
  let [active_tenants, tenant_error] = await handle(
    promise_query(
      "select ActiveTenant.*, Tenant.email_address, Tenant.first_name, Tenant.last_name, LandLord.ID as LandLordID from ActiveTenant join Listing on ActiveTenant.ListingID = Listing.ID join LandLord on Listing.LandLordID = LandLord.ID join Tenant on ActiveTenant.TenantID = Tenant.ID where ActiveTenant.status = ?;",
      ["active"]
    )
  );
  if (tenant_error) throw Error(tenant_error.toString());
  cache["active_tenants"] = active_tenants;

  //getting a list of all payment entries that have been declared as paid
  let [payments, payments_error] = await handle(
    promise_query("select * from Payment where status = ?", ["paid"]) // changed the = sign to <>
  );
  if (payments_error) throw Error(payments_error.toString());
  cache["payments"] = payments;

  //gets all the rental presets added to the system
  let [rental_presets, preset_error] = await handle(
    promise_query("select * from RentalPreset;")
  );
  if (preset_error) throw Error(preset_error.toString());
  cache["rental_presets"] = rental_presets;

  //sort the tenants by their LandLord
  var sorted = sort_by_landlord(cache);

  //collect outgoing mails & send as batch. Watch out for throttled mails.
  for (var i = 0; i < sorted.length; i++) {
    var landlord = sorted[i];
    //inspect all tenant payment profiles
    for (var j = 0; j < landlord.active_tenants.length; j++) {
      //determing this tenants billing date & the difference between today and then.
      var tenant = landlord.active_tenants[j];
      console.log("inspecting: " + tenant.first_name + " - " + tenant.ID);

      // check the lease lapse date of the tenant and notify the landlord and tenant when it's been lapsed
      if (_today === tenant.lapse_date) {
        await handle(
          promise_query("update ActiveTenant set status = ? where ID = ?", [
            "lapsed",
            tenant.ID,
          ])
        );

        queue_notif(
          tenant.email_address,
          "Lease lapse notice for " + tenant.first_name + " " + tenant.last_name
        );

        queue_notif(
          landlord.accounting_email_address,
          "Lease lapse notice for " + tenant.first_name + " " + tenant.last_name
        );

        console.log("lapsed lease: ");
        console.log(tenant);
        continue;
      }

      //check if the tenant has a rent escalation that has not been effected
      var [escalations, error] = await handle(
        promise_query(
          "select * from ScheduledEscalation where ActiveTenantID = ? and effected = ?",
          [tenant.ID, "false"]
        )
      );
      if (error) {
        console.log(error);
        throw Error("error querying scheduled escalations");
      }

      for (var i = 0; i < escalations.length; i++) {
        //checking if the current date is the date when the escalation is due to set in
        if (escalations[i].effective_date === _today) {
          var [update, error] = await handle(
            promise_query(
              "update RentalPreset set monthly_rent = ? where ID = ?",
              [escalations[i].escalated_rent, tenant.rental_preset.ID]
            )
          );
          tenant.rental_preset.monthly_rent = escalations[i].escalated_rent;
          if (error) {
            console.log(error);
            throw Error("error escalating rent:" + error.toString());
          }

          //added the true value to the query, to change the status of the escalation
          var [update, error] = await handle(
            promise_query(
              "update ScheduledEscalation set effected = ? where ID = ?",
              ["true", escalations[i].ID]
            )
          );
          if (error) {
            console.log(error);
            throw Error("error escalating rent:" + error.toString());
          }

          //notify the landlord and tenant on the new escalation of rent via email
          queue_notif(
            tenant.email_address,
            "Escalation notice for " +
              tenant.first_name +
              " " +
              tenant.last_name
          );
          queue_notif(
            landlord.accounting_email_address,
            "Escalation notice" + tenant.first_name + " " + tenant.last_name
          );

          console.log("escalated:");
          console.log(tenant);
          console.log(escalations[i]);
        }
      }

      //inspect tenants payment data for late payments and account delinquency
      var [result, error] = await handle(inspect_payments(landlord, tenant));
      if (error) {
        console.log(error);
        throw Error("error inspecting payments: " + error.toString());
      }

      var billing_date = get_billing_date(tenant);

      if (billing_date) {
        console.log("due for monthly billing: " + billing_date);
        if (!has_been_billed(tenant, billing_date)) {
          //if(true){
          var [invoice, error] = await handle(
            bill_tenant(tenant, billing_date)
          );
          if (error) throw Error("error billing client: " + error.toString());
          console.log("invoice");

          console.log(invoice);

          queue_notif(
            tenant.email_address,
            "Your latest invoice has been prepared for you. Here is a secured link to your copy:\n" +
              invoice
          );

          queue_notif(
            tenant.email_address,
            "Your latest invoice has been prepared for you. Here is a secured link to your copy:\n" +
              invoice
          );
          console.log("tenant billed");
        } else {
          console.log("tenant already billed for this month");
        }
      } else {
        console.log("tenant not due for billing");
      }
    }
  }

  console.log(
    "\n\n******************inspection complete: out-going mail:********************\n\n"
  );

  for (var i = 0; i < outgoing_mail.length; i++) {
    await messenger.mail(outgoing_mail[i]);
  }
  console.log("\n\n******************mail sent********************\n\n");

  return outgoing_mail;
};

//FUNCTIONS THAT PERFORM THE BILLING INSPECTOR FUNCTIONALITY

//function gets the date that the tenant has to be billed on.
function get_billing_date(tenant) {
  console.log("-----> get billing date");
  var due = 34
  var due_day = pad(tenant.rental_preset.due_day);
  var str = today_arr[0] + "-" + today_arr[1] + "-" + due_day;
  var this_month = validate(str);
  console.log(str);
  console.log(this_month);
  var d = as_date(this_month);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);

  str =
    d.toISOString().split("T")[0].split("-")[0] +
    "-" +
    d.toISOString().split("T")[0].split("-")[1] +
    "-" +
    due_day;

  var next_month = validate(str);

  var days_from_this_month = datefns.differenceInCalendarDays(
    as_date(this_month),
    as_date(_today)
  );
  var days_from_next_month = datefns.differenceInCalendarDays(
    as_date(next_month),
    as_date(_today)
  );

  if (days_from_this_month <= processing_window && days_from_this_month >= 0) {
    return this_month;
  } else if (
    days_from_next_month <= processing_window &&
    days_from_next_month >= 0
  ) {
    return next_month;
  }
  console.log(
    "next billing date: " +
      this_month +
      "/" +
      as_date(this_month).toDateString()
  );
  return null;
}

//group the tenants by their landlord
function sort_by_landlord(cache) {
  var sorted = [];
  for (var i = 0; i < cache.landlords.length; i++) {
    var landlord = cache.landlords[i];
    landlord["active_tenants"] = [];

    for (var j = 0; j < cache.active_tenants.length; j++) {
      var tenant = cache.active_tenants[j];

      if (landlord.ID === tenant.LandLordID) {
        for (var o = 0; o < cache.rental_presets.length; o++) {
          if (tenant.RentalPresetID === cache.rental_presets[o].ID) {
            tenant["rental_preset"] = cache.rental_presets[o];
          }
        }

        tenant["payments"] = [];
        for (var e = 0; e < cache.payments.length; e++) {
          if (tenant.ID === cache.payments[e].ActiveTenantID) {
            tenant.payments.push(cache.payments[e]);
          }
        }

        landlord.active_tenants.push(tenant);
      }
    }

    sorted.push(landlord);
  }

  return sorted;
}

// check if the tenant has been billed, look through the payments the tenant has made
function has_been_billed(tenant, billing_date) {
  for (var i = 0; i < tenant.payments.length; i++) {
    var payment = tenant.payments[i];
    if (payment.description === "Rent" && payment.due_date === billing_date) {
      return true;
    }
  }
  return false;
}

async function bill_tenant(tenant, billing_date) {
  var [result, error] = await handle(
    promise_query("insert into Invoice(date) values (?)", [billing_date])
  );
  handle.throw(error);

  var invoice_id = result.insertId;
  var rent = parseFloat(tenant.rental_preset.monthly_rent);
  var other_monthly_fees;
  var payments = [];
  var total = 0.0;

  try {
    other_monthly_fees = JSON.parse(tenant.rental_preset.other_monthly_fees);
  } catch (e) {
    other_monthly_fees = [];
  }

  payments.push([tenant.ID, invoice_id, "Rent", "due", rent, billing_date]);

  total = total + rent;

  for (var i = 0; i < other_monthly_fees.length; i++) {
    payments.push([
      tenant.ID,
      invoice_id,
      other_monthly_fees[i].fee_name,
      "due",
      parseFloat(other_monthly_fees[i].fee_amount),
      billing_date,
    ]);

    total = total + parseFloat(other_monthly_fees[i].fee_amount);
  }

  //gets the payments that the tenant is still back on
  var [arrears, error] = await handle(
    promise_query(
      "select sum(amount) as total_arrears from Payment where ActiveTenantID = ? and (status = ? or status = ?) ",
      [tenant.ID, "due", "late"]
    )
  );
  handle.throw(error);

  console.log("billing total monthly rent:" + total);
  var [result, error] = await handle(
    promise_query(
      "insert into Payment(ActiveTenantID,InvoiceID, description, status, amount, due_date) values ?",
      [payments]
    )
  );
  handle.throw(error);

  if (arrears.length > 0) {
    payments.push([
      tenant.ID,
      invoice_id,
      "Arrears",
      "due",
      parseFloat(arrears[0].total_arrears),
      billing_date,
    ]);
    total += parseFloat(arrears[0].total_arrears);
  } else {
    arrears = 0.0;
  }
  //
  email_invoice(tenant, payments, total, billing_date, invoice_id);

  return print_invoice(tenant, payments, total, billing_date, invoice_id);
}

//method for directly sending an invoice as part of an email in html format

const createInvoice=(tenant, payments, total, billing_dates, invoice_id) => {

  return new Promise((resolve, reject) => {

    const file_name = `invoice_${Date.now().toString()}.pdf`;
    const file_path = process.env.BASE_PATH + file_name;
    const invoice = new HummusRecipe("new", file_path);
    var left_center = { align: "left center", fontSize: 11, color: "#000000" };
    var center = { align: "center center", fontSize: 11, color: "#000000" };

    const d  = new Date()
    const month = d.getMonth()+2 % 12
    const year  = d.getFullYear()
    const billing_date = "01"+"/"+month+"/"+year



    var arrears = findArears(payments)
  
    invoice.createPage("a4");
    invoice.image("./invoice_template/invoice2.pdf", 0, 0);

  
    invoice.text(
      tenant.first_name + " " + tenant.last_name,
      23.322,
      129.478,
      left_center
    );
  
    invoice.text(
      tenant.ID + tenant.first_name.substring(0, 3).toUpperCase(),
      79.484,
      228.478,
      center
    );
    invoice.text(billing_date, 184.151, 228.479, center);
    invoice.text("INV" + invoice_id, 517.484, 228.479, center);
  
    var y = 272.812;
    for (var i = 0; i < payments.length; i++) {
      if(payments[i][2]=='Arrears' ) continue
      invoice.text(i + 1, 22.322, y, left_center); //itemcode
      invoice.text(payments[i][2], 100.988, y, left_center); //desc
      invoice.text("P 0.00", 227.988, y, left_center);
      invoice.text("P 0.00", 279.988, y, left_center);
      invoice.text("1", 317.321, y, left_center);
      invoice.text("P " + payments[i][4], 390.655, y, left_center); //price
      invoice.text("P " + payments[i][4], 527.655, y, left_center); //line total
      y = y + 13;
    }
  
    if(arrears){
      invoice.text("P " + total, 528.322, 455.978, left_center);
    }
    else{
      invoice.text("P0.00", 528.322, 455.978, left_center);
    }
    invoice.text("P 0.00", 528.322, 470.978, left_center);
    invoice.text("P " + total, 528.322, 484.311, left_center);
  
    // invoice.text("P 0.00", 528.322, 497.645, left_center);
  
    invoice.text("P " + total, 528.322, 522.312, left_center);
  
    invoice.endPage();
    invoice.endPDF();
  
    console.log("===== After endPDF");

    resolve({file_path , file_name})

  })
}

 
function findArears(arr){

  var arrears=null;
  arr.forEach(item =>{
    if (item[2] =='Arrears'){
      arrears = item[4]
    }
  })

  return arrears

}

function uploadToCloudinary(file_path ,file_name){

 return new Promise((resolve, reject) => {

  var  opts = {
    overwrite: true,
    invalidate: true,
    public_id: 'online',
    resource_type: "auto"
  };
  
  cloudinary.uploader.upload(file_path, opts ,function (error, result) {
    if(result && result.secure_url){
     console.log("URL "+result.secure_url)
     invoiceFile = result.secure_url 
     return resolve(result.secure_url);
    }else{
      console.log(error);
      return reject({message: error.message});
    }
 });
  })
}


//EMAIL
const email_invoice = (tenant, payments, total, billing_date, invoice_id) => {

  let file_path;
 
 createInvoice(tenant , payments , total ,billing_date , invoice_id)
 .then(res => {
   file_path = res.file_path
      uploadToCloudinary(res.file_path , res.file_name).then(res=> console.log("This link "+res))
  })
 .then(res => console.log('Suppose to be the link: '+res))
 .then(res =>{

  var [result, error] = handle(
    messenger.mail({
      from: "sycamon.bw@gmail.com",
      to: `${tenant.email_address}`,
      subject: "Sycamon [Accounts] ",
      html: html_invoice,
    })
  );

  if (error) {
    console.log(error);
    throw Error("error sending invoice ");
  }

 })
 .then(() => fs.unlink(file_path, (err) => console.log("invoice deleted")))
 .catch(err => console.log("Error: "+err))
 
  const html_invoice = `
  <div>
  <div style="text-align: center; font-weight: bold; font-size: 2rem">
    Tax Invoice
  </div>
  <span>
    <div style="display: inline-block">
      <ul style="list-style: none; float: left">
        <li><span style="font-weight: bold">Sycamon</span></li>
        <li>P O Box 404515</li>
        <li>Gaborone</li>
        <br />
        <li><span style="font-weight: bold">To:</span></li>
        <li>${tenant.first_name + " " + tenant.last_name}</li>
      </ul>
    </div>

    <div style="display: inline-block; float: right">
      <ul style="list-style: none">
        <li>
          Tax Registration: <span style="font-weight: bold">C11315201111</span>
        </li>
        <li>Telphone: <span style="font-weight: bold">00267-3999800</span></li>
        <li>Fax: <span style="font-weight: bold">00267-3902025</span></li>
      </ul>
    </div>
  </span>

  <div align="center">
    <table>
      <tr>
        <th style="padding: 20px">Account</th>
        <th style="padding: 20px">Date</th>
        <th style="padding: 20px">Order No</th>
        <th style="padding: 20px">Delivery Note</th>
        <th style="padding: 20px">Our Reference</th>
      </tr>
      <tr>
        <td
          style="
            border-radius: 10px;
            padding: 20px;
            border-width: 1px;
            text-align: center;
          "
        >
          ${tenant.ID + tenant.first_name.substring(0, 3).toUpperCase()}
        </td>
        <td
          style="
            border-radius: 10px;
            padding: 20px;
            border-width: 1px;
            text-align: center;
          "
        >
          ${billing_date}
        </td>
        <td
          style="
            border-radius: 10px;
            padding: 20px;
            border-width: 1px;
            text-align: center;
          "
        >
          &nbsp;
        </td>
        <td
          style="
            border-radius: 10px;
            padding: 20px;
            border-width: 1px;
            text-align: center;
          "
        ></td>
        <td
          style="
            border-radius: 10px;
            padding: 20px;
            border-width: 1px;
            text-align: center;
          "
        >
          INV${invoice_id}
        </td>
      </tr>
    </table>
  </div>
  <div style="display: flex; justify-content: center; margin-top: 30px">
    <table style="width: 100%; border-spacing: 8px 0">
      <tr>
        <th style="border-bottom: 2px solid black">Item Code</th>
        <th style="border-bottom: 2px solid black">Item Description</th>
        <th style="border-bottom: 2px solid black">Ordered</th>
        <th style="border-bottom: 2px solid black">Prev Quality</th>
        <th style="border-bottom: 2px solid black">Unit</th>
        <th style="border-bottom: 2px solid black">Price (ln)</th>
        <th style="border-bottom: 2px solid black">Disc %</th>
        <th style="border-bottom: 2px solid black">Tax</th>
        <th style="border-bottom: 2px solid black">Total</th>
      </tr>

      ${payments.map((element, index) => {
        return `
      <tr>
        <td style="text-align: left">${index + 1}</td>
        <td style="text-align: left">${element[2]}</td>
        <td style="text-align: left">P 0.00</td>
        <td style="text-align: left">P 0.00</td>
        <td style="text-align: left">1</td>
        <td style="text-align: left">P ${element[4]}</td>
        <td style="text-align: left"></td>
        <td style="text-align: left"></td>
        <td style="text-align: left">P ${element[4]}</td>
      </tr>
      `;
      })} ;
    </table>
  </div>

  <div>
    <ul style="list-style: none; float: right">
      <li>Total (Excl) <span> P ${total}</span></li>
      <li>Tax <span>P 0.00</span></li>
      <li><span style="font-weight: bold">Total </span> P ${total}</li>
      <li>Discount <span>P 0 .00</span></li>

      <hr />
      <li><span style="font-weight: bold">Total (Incl)</span> P ${total}</li>
    </ul>

    <ul style="list-style: none; float: left">
      <li>Recieved By _________________</li>
      <li>Date ________________________</li>
      <li>Signed ______________________</li>
    </ul>
  </div>
</div>

`;

  
  
};



async function print_invoice(
  tenant,
  payments,
  total,
  billing_dates,
  invoice_id
) {
  console.log("printing invoice");

  try {
    const file_name = `invoice_${Date.now().toString()}.pdf`;
    const file_path = process.env.BASE_PATH + file_name;
    const invoice = new HummusRecipe("new", file_path);
    var left_center = { align: "left center", fontSize: 11, color: "#000000" };
    var center = { align: "center center", fontSize: 11, color: "#000000" };

    const d  = new Date()
    const month = d.getMonth()+2 % 12
    const year  = d.getFullYear()
    const billing_date = "01"+"/"+month+"/"+year

    var arrears = findArears(payments)
  
    invoice.createPage("a4");
    invoice.image("./invoice_template/invoice2.pdf", 0, 0);

  
    invoice.text(
      tenant.first_name + " " + tenant.last_name,
      23.322,
      129.478,
      left_center
    );
  
    invoice.text(
      tenant.ID + tenant.first_name.substring(0, 3).toUpperCase(),
      79.484,
      228.478,
      center
    );
    invoice.text(billing_date, 184.151, 228.479, center);
    invoice.text("INV" + invoice_id, 517.484, 228.479, center);
  
    var y = 272.812;
    for (var i = 0; i < payments.length; i++) {
      if(payments[i][2]=='Arrears' ) continue
      invoice.text(i + 1, 22.322, y, left_center); //itemcode
      invoice.text(payments[i][2], 100.988, y, left_center); //desc
      invoice.text("P 0.00", 227.988, y, left_center);
      invoice.text("P 0.00", 279.988, y, left_center);
      invoice.text("1", 317.321, y, left_center);
      invoice.text("P " + payments[i][4], 390.655, y, left_center); //price
      invoice.text("P " + payments[i][4], 527.655, y, left_center); //line total
      y = y + 13;
    }
  
    if(arrears){
      invoice.text("P " + total, 528.322, 455.978, left_center);
    }
    else{
      invoice.text("P0.00", 528.322, 455.978, left_center);
    }
    invoice.text("P 0.00", 528.322, 470.978, left_center);
    invoice.text("P " + total, 528.322, 484.311, left_center);
  
    // invoice.text("P 0.00", 528.322, 497.645, left_center);
  
    invoice.text("P " + total, 528.322, 522.312, left_center);
  
    invoice.endPage();
    invoice.endPDF();

    console.log("===== After endPDF");

    html_invoice = `
      <body style="padding: 50px">

      <div style="text-align: center; font-weight: bold; font-size: 2rem">
        Tax Invoice
      </div>

      <div style="display: flex; justify-content: space-between">
        <ul style="list-style: none">
          <li><span style="font-weight: bold">Sycamon</span></li>
          <li>P O Box 404515</li>
          <li>Gaborone</li>
          <br />
          <li><span style="font-weight: bold">To:</span></li>
          <li>${tenant.first_name + " " + tenant.last_name}</li>
        </ul>

        <ul style="list-style: none; width: 40%">
          <li style="display: flex; justify-content: space-between">
            Tax Registration <span style="font-weight: bold">C11315201111</span>
          </li>
          <li style="display: flex; justify-content: space-between">
            Telphone <span style="font-weight: bold">00267-3999800</span>
          </li>
          <li style="display: flex; justify-content: space-between">
            Fax <span style="font-weight: bold">00267-3902025</span>
          </li>
        </ul>
      </div>

      <div style="display: flex; justify-content: space-around">
        <div style="width: 19%; text-align: center">
          Account
          <div style="border: 2px solid black; border-radius: 5px">${
            tenant.ID + tenant.first_name.substring(0, 3).toUpperCase()
          }</div>
        </div>
        <div style="width: 19%; text-align: center">
          Date
          <div style="border: 2px solid black; border-radius: 5px">${billing_date}</div>
        </div>
        <div style="width: 19%; text-align: center">
          Order No
          <div style="border: 2px solid black; border-radius: 5px">20REN</div>
        </div>
        <div style="width: 19%; text-align: center">
          Delivery Note
          <div style="border: 2px solid black; border-radius: 5px">&nbsp;</div>
        </div>
        <div style="width: 19%; text-align: center">
          Our Reference
          <div style="border: 2px solid black; border-radius: 5px">
            INV${invoice_id}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: center; margin-top: 30px">
        <table style="width: 100%; border-spacing: 8px 0">
          <tr>
            <th style="border-bottom: 2px solid black">Item Code</th>
            <th style="border-bottom: 2px solid black">Item Description</th>
            <th style="border-bottom: 2px solid black">Ordered</th>
            <th style="border-bottom: 2px solid black">Prev Quality</th>
            <th style="border-bottom: 2px solid black">Unit</th>
            <th style="border-bottom: 2px solid black">Price (ln)</th>
            <th style="border-bottom: 2px solid black">Disc %</th>
            <th style="border-bottom: 2px solid black">Tax</th>
            <th style="border-bottom: 2px solid black">Total</th>
          </tr>
        
          ${payments.map((element, index) => {
            return ` <tr>
              <td style="text-align: left">${index + 1}</td>
              <td style="text-align: left">${element[2]}</td>
              <td style="text-align: left">P 0.00</td>
              <td style="text-align: left">P 0.00</td>
              <td style="text-align: left">1</td>
              <td style="text-align: left">P ${element[4]}</td>
              <td style="text-align: left"></td>
              <td style="text-align: left"></td>
              <td style="text-align: left">P ${element[4]}</td>
            </tr>`;
          })} 
        </table>
      </div>

      <div style="display: flex; justify-content: space-between">
        <ul style="list-style: none; width: 40%">
          <li style="display: flex; justify-content: space-between">
            Recieved by<span style="font-weight: bold"
              >________________________</span
            >
          </li>
          <li style="display: flex; justify-content: space-between">
            Date<span style="font-weight: bold">________________________</span>
          </li>
          <li style="display: flex; justify-content: space-between">
            Signed <span style="font-weight: bold">________________________</span>
          </li>
        </ul>

        <ul style="list-style: none; width: 35%">
          <li style="display: flex; justify-content: space-between">
            Total (Excl) <span> P ${total}</span>
          </li>
          <li style="display: flex; justify-content: space-between">
            Tax <span>P 0.00</span>
          </li>
          <li style="display: flex; justify-content: space-between">
            <span style="font-weight: bold">Total </span> P ${total}
          </li>
          <li style="display: flex; justify-content: space-between">
            Discount <span>P 0 .00</span>
          </li>

          <hr />

          <li style="display: flex; justify-content: space-between">
            <span style="font-weight: bold">Total (Incl)</span> P ${total}
          </li>
        </ul>
      </div>
    </body>
`;
    //queue_notif(tenant.email_address, html_invoice);


    console.log(
      "path =================================================>",
      file_path
    );

    var [upload_url, error] = await handle(
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file_path,
          {
            overwrite: true,
            invalidate: true,
            public_id: "online",
            // public_id: "/online/",
          },
          function (error, result) {
            if (result && result.secure_url) {
              console.log(result.secure_url)
              return resolve(result.secure_url);
            } else {
              return reject({ message: error.toString() });
            }
          }
        );
      })
    );

    fs.unlink(file_path, (err) => console.log("invoice deleted"));

    // fake_url = `www.invoice.com`;
    var [update, error] = await handle(
      promise_query("update Invoice set file = ? where ID = ? ", [
        upload_url,
        invoice_id,
      ])
    );
    handle.throw(error);

    console.log("starting a invoice upload =========>");
    return upload_url;
    // return `www.invoice.com`;
  } catch (e) {
    console.log(e);
  }
}

async function inspect_payments(landlord, tenant) {
  //should return inspection report;
  for (var i = 0; i < tenant.payments.length; i++) {
    var payment = tenant.payments[i];

    if (payment.status === "due") {
      var is_late = datefns.isAfter(as_date(_today), as_date(payment.due_date));

      if (is_late && !payment.description.includes("Late Fee")) {
        // mark payment as late if its not a Late Fee on rent.
        await promise_query("update Payment set status = ? where ID = ?", [
          "late",
          payment.ID,
        ]);
        payment.status = "late";
        console.log("overdue payment found and marked as late:");
        console.log(payment);
      } else {
        var difference = datefns.differenceInCalendarDays(
          as_date(payment.due_date),
          as_date(_today)
        );
        if (difference >= 0 && difference <= processing_window) {
          console.log("payment due within processing window (5 days) found:");
          console.log(payment);
          queue_notif(
            tenant.email_address,
            "Your charge for '" +
              payment.description +
              "' - " +
              money_format(payment.amount) +
              " is due on " +
              date_format(payment.due_date) +
              ". Login to your Tenant Portal and pay early for peace of mind. \n\n" +
              process.env.DOMAIN +
              "/lease/view_lease?id=" +
              tenant.ID
          );
        }
      }
    }

    if (payment.status === "late") {
      if (
        payment.description === "Rent" &&
        tenant.rental_preset.charge_late_fee === "true"
      ) {
        console.log("late rent payment found:");
        console.log(payment);
        //determine exactly how many days late the payment is
        var days_late = Math.abs(
          datefns.differenceInCalendarDays(
            as_date(payment.due_date),
            as_date(_today)
          )
        );
        console.log(
          "days late: " +
            days_late +
            " - grace period: " +
            tenant.rental_preset.grace_period
        );
        //if the grace period has lapsed.
        if (days_late >= parseInt(tenant.rental_preset.grace_period)) {
          //if late fees are a flat rate and has already been charged for this particular late rent payment, dont calculate.
          console.log("grace period lapsed");
          var late_fee =
            tenant.rental_preset.charge_flat === "true" &&
            late_fee_charged(tenant, payment)
              ? null
              : calculate_late_fee(tenant, payment);
          //if a late fee has been calculated.
          if (late_fee) {
            //charge the late fee
            let [result, error] = await handle(
              promise_query(
                "insert into Payment(ActiveTenantID, description, status, amount, due_date)values(?,?,?,?,?)",
                [
                  late_fee.ActiveTenantID,
                  late_fee.description,
                  late_fee.status,
                  late_fee.amount,
                  late_fee.due_date,
                ]
              )
            );
            if (error) throw Error(error.toString());

            //update cache with payment ID
            late_fee["ID"] = result.insertId;
            tenant.payments.push(late_fee);
            console.log("charged late fee: ");
            console.log(late_fee);

            //if this tenant has reached the Late Fee limit
            if (is_delinquent(tenant)) {
              console.log("tenant delinquent. Freeze account and notify all.");
              //freeze account. Account can be unfrozen by tenant making full account payment(record these instances).
              let [result, error] = await handle(
                promise_query(
                  "update ActiveTenant set status = ? where ID = ?",
                  ["frozen", tenant.ID]
                )
              );
              if (error) throw Error(message.error);

              queue_notif(
                landlord.accounting_email_address,
                "The tenant account for " +
                  Tenant.first_name +
                  " has been frozen and marked as delinquet due to excessive late fees. This account can only be reactivated when full payment has been received. Log in to review the account. \n\n " +
                  process.env.DOMAIN +
                  "/tenants/view_tenant?id=" +
                  tenant.ID
              );

              queue_notif(
                tenant.email_address,
                "Your account has been frozen and marked as delinquent due to excessive late fees. Please make full payment to restore your account to good standing. \n\n" +
                  process.env.TENANT_DOMAIN +
                  "/lease/view_lease?id=" +
                  tenant.ID
              );
            } else {
              queue_notif(
                tenant.email_address,
                "You have incurred a " +
                  late_fee.description +
                  " on your account of " +
                  money_format(late_fee.amount) +
                  ". All late fees are due immediately and will continue to accrue if account is not settled. \n\n" +
                  process.env.TENANT_DOMAIN +
                  "/lease/view_lease?id=" +
                  tenant.ID
              );
            }
          }
        }
      } else {
        queue_notif(
          tenant.email_address,
          "Your charge for '" +
            payment.description +
            "' - " +
            money_format(payment.amount) +
            " billed on   " +
            date_format(payment.due_date) +
            ". is overdue. Please settle payment to avoid incurring late fees. \n\n" +
            process.env.TENANT_DOMAIN +
            "/lease/view_lease?id=" +
            tenant.ID
        );
      }
    }
  }

  return {};
}

function is_delinquent(tenant) {
  var total = 0.0;

  for (var i = 0; i < tenant.payments.length; i++) {
    var payment = tenant.payments[i];

    if (payment.description.includes("Late Fee") && payment.status === "due") {
      total = total + parseFloat(payment.amount);
    }
  }

  if (total >= tenant.rental_preset.max_cumulative_late_fee) {
    return true;
  }

  return false;
}

function late_fee_charged(tenant, payment) {
  //late fee desc: Late Fee - (Rent @ date)
  for (var i = 0; i < tenant.payments.length; i++) {
    if (
      tenant.payments[i].description ===
        "Late Fee - (Rent @ " + payment.due_date + ")" &&
      tenant.payments[i].status != "paid"
    ) {
      return true;
    }
  }

  return false;
}

function calculate_late_fee(tenant, payment) {
  var amount;
  var desc;

  if (tenant.rental_preset.charge_flat === "true") {
    amount = tenant.rental_preset.flat_late_fee;
    desc = "Late Fee - (Rent @ " + payment.due_date + ")";
  } else {
    amount =
      (tenant.rental_preset.daily_rate / 100) *
      tenant.rental_preset.monthly_rent;
    desc = "Late Fee - (Rent @ " + payment.due_date + ")";
  }

  return {
    ActiveTenantID: tenant.ID,
    description: desc,
    status: "due",
    amount: amount,
    due_date: _today,
  };
}

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

function isLeapYear(year) {
  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}

function as_date(str) {
  return datefns.parseISO(str + "T01:00:00.000Z");
}

function date_format(date) {
  return as_date(date).toDateString();
}

function money_format(amount) {
  return "P " + numeral(amount).format("P0,0.00");
}

function pad(num) {
  return num < 10 ? "0" + num : num.toString();
}

function queue_notif(recipient, message) {
  outgoing_mail.push({
    from: process.env.MAILER_ADDRESS,
    to: recipient,
    subject: "Sycamon [Accounts]",
    text: message,
  });
}
