const datefns = require("date-fns");
const shortid = require("shortid");
const edit_button = document.getElementById("edit_button");
const hide_button = document.getElementById("hide_button");
const delete_button = document.getElementById("delete_button");
const create_rental_preset_button = document.getElementById(
  "create_rental_preset_button"
);
const create_screening_preset_button = document.getElementById(
  "create_screening_preset_button"
);
const rental_presets_container = document.getElementById(
  "rental_preset_container"
);
const screening_presets_container = document.getElementById(
  "screening_preset_container"
);
const save_rental_preset_button = document.getElementById(
  "save_rental_preset_button"
);
const save_screening_preset_button = document.getElementById(
  "save_screening_preset_button"
);
//Modals
const add_fee_button = document.getElementById("add_fee_button");
const add_question = document.getElementById("add_question");
const add_required_doc = document.getElementById("add_required_doc");
const add_viewing_slot = document.getElementById("add_viewing_slot");

var rental_presets;
var screening_presets;
var update = false;
var other_monthly_fees = [];
var fee_count = 0;
var required_docs = [];
var required_docs_count;
var viewing_slots = [];
var viewing_slots_count = 0;
var questions = [];
var question_count = 0;
var financial_data = {};

function showConfirmation(message) {
  document.getElementById("myModalLabel").innerHTML = message;
  $("#mi-modal").modal("show");
  $("#modal-btn-no").on("click", function () {
    $("#mi-modal").modal("hide");
  });
}

$("#modal-btn-delete").on("click", function () {
  document.getElementById("delete_form").submit();
});

$("#modal-btn-cancel").on("click", function () {
  $("#delete-modal").modal("hide");
});
function hide_listing(visible, listing_id) {
  $.ajax({
    method: "post",
    url: "/listings/toggle_listing_visibility",
    data: {
      visible: visible,
      listing_id: listing_id,
    },
    success: function (result) {
      if (visible === "true") {
        document.getElementById("visibility").innerHTML = "Hide Listing";
        document.getElementById("hide_button").onclick = (event) => {
          hide_listing("false", listing_id);
        };
      } else {
        document.getElementById("visibility").innerHTML = "Unhide Listing";
        document.getElementById("hide_button").onclick = (event) => {
          hide_listing("true", listing_id);
        };
      }
    },

    error: function (error) {
      console.log(error);
    },
  });
}

function toggle_offer_visibility(visible, listing_id) {
  $.ajax({
    method: "post",
    url: "/listings/toggle_offer_visibility",
    data: {
      visible: visible,
      listing_id: listing_id,
    },
    success: function (result) {
      if (visible === "true") {
        document.getElementById("offers").innerHTML = "Hide Offers";
        document.getElementById("offers_button").onclick = (event) => {
          toggle_offer_visibility("false", listing_id);
        };
      } else {
        document.getElementById("offers").innerHTML = "Show Offers";
        document.getElementById("offers_button").onclick = (event) => {
          toggle_offer_visibility("true", listing_id);
        };
      }
    },

    error: function (error) {
      console.log(error);
    },
  });
}

function delete_listing(listing_id) {
  ///duplucate odal
  confirmDelete();
}

function set_as_default(which, preset_id, preset_name, listing_id) {
  $.ajax({
    method: "post",
    url: "/listings/update_default_preset",
    data: {
      which: which,
      preset_id: parseInt(preset_id),
      listing_id: parseInt(listing_id),
    },
    success: function (result) {
      document.getElementById(preset_name + " " + preset_id).style =
        "display: none;";

      if (which === "rental_preset") {
        document.getElementById("rental_default_label").style =
          "display: none;";
      } else {
        document.getElementById("screening_default_label").style =
          "display: none;";
      }
    },

    error: function (error) {},
  });
}

add_fee_button.onclick = (event) => {
  var fee = {
    index: fee_count,
    fee_name: document.getElementById("fee_name").value,
    fee_amount: document.getElementById("fee_amount").value,
  };

  other_monthly_fees.push(fee);

  update_fee_list(fee);

  fee_count = fee_name + 1;

  document.getElementById("fee_name").value = "";
  document.getElementById("fee_amount").value = "";
};

save_rental_preset_button.onclick = (event) => {
  if (
    document.getElementById("charge_late_fee-0").checked === true &&
    document.getElementById("charge_flat").checked === false &&
    document.getElementById("charge_daily").checked === false
  ) {
    document.getElementById("toast_message").innerHTML =
      "<b>Please select Late Fee calculation configuration.</b>";
  } else {
    document.getElementById("other_monthly_fees").value =
      JSON.stringify(other_monthly_fees);
    document.getElementById("update_rental").value = update;
    save_rental_preset_button.setAttribute("type", "submit");
    save_rental_preset_button.click();
  }
};
//rental preset
$("#exampleModalLong").on("show.bs.modal", function (event) {
  var button = $(event.relatedTarget); // Button that triggered the modal
  if (button.data("rental_preset")) {
    var preset = button.data("rental_preset");

    document.getElementById("preset_name").value = preset.name;
    document.getElementById("monthly_rent").value = preset.monthly_rent;
    document.getElementById("security_deposit").value = preset.security_deposit;
    document.getElementById("due_day").value = preset.due_day;
    document.getElementById("escalation_rate").value = preset.escalation_rate;
    document.getElementById("escalation_type").value = preset.escalation_type;
    document.getElementById('purchase_order').value = preset.purchase_order
    document.getElementById("escalation_interval").value =
      preset.escalation_interval;

    if (preset.pro_rate_method === "m")
      document
        .getElementById("pro_rate_method-0")
        .setAttribute("checked", "checked");
    if (preset.pro_rate_method === "y")
      document
        .getElementById("pro_rate_method-1")
        .setAttribute("checked", "checked");
    if (preset.pro_rate_method === "h")
      document
        .getElementById("pro_rate_method-2")
        .setAttribute("checked", "checked");
    if (preset.pro_rate_method === "l")
      document
        .getElementById("pro_rate_method-3")
        .setAttribute("checked", "checked");

    if (preset.allow_partial_rent === "true") {
      document
        .getElementById("allow_partial_rent-0")
        .setAttribute("checked", "checked");
    } else {
      document
        .getElementById("allow_partial_rent-1")
        .setAttribute("checked", "checked");
    }

    if (preset.allow_partial_misc === "true") {
      document
        .getElementById("allow_partial_misc-0")
        .setAttribute("checked", "checked");
    } else {
      document
        .getElementById("allow_partial_misc-1")
        .setAttribute("checked", "checked");
    }

    if (preset.charge_late_fee === "true") {
      document
        .getElementById("charge_late_fee-0")
        .setAttribute("checked", "checked");
    } else {
      document
        .getElementById("charge_late_fee-1")
        .setAttribute("checked", "checked");
    }

    document.getElementById("grace_period").value = preset.grace_period;

    if (preset.charge_flat === "true")
      document.getElementById("charge_flat").setAttribute("checked", "checked");
    document.getElementById("flat_late_fee").value = preset.flat_late_fee;

    if (preset.charge_daily === "true") {
      document.getElementById("charge_daily").checked = true;
    }

    document.getElementById("daily_rate").value = preset.daily_rate;

    document.getElementById("max_cumulative_late_fee").value =
      preset.max_cumulative_late_fee;

    document.getElementById("other_monthly_fees").value =
      preset.other_monthly_fees;
    if (preset.other_monthly_fees) {
      var fees = JSON.parse(preset.other_monthly_fees);
      other_monthly_fees = fees;
      fees.forEach((fee) => {
        update_fee_list(fee);
      });
    }

    update = true;
    document.getElementById("rental_preset_id").value = preset.ID;
  }
});
//screening presets
$("#exampleModalLong2").on("show.bs.modal", function (event) {
  var button = $(event.relatedTarget); // Button that triggered the modal
  if (button.data("screening_preset")) {
    var preset = button.data("screening_preset");
    document.getElementById("preset_name_modal").value = preset.name;

    try {
      JSON.parse(preset.questions).forEach((_question) =>
        update_question_list(_question)
      );
      questions = JSON.parse(preset.questions);
    } catch (e) {}

    try {
      JSON.parse(preset.viewing_slots).forEach((_viewing_slot) =>
        update_viewing_slots_list(_viewing_slot)
      );
      viewing_slots = JSON.parse(preset.viewing_slots);
    } catch (e) {}

    try {
      JSON.parse(preset.required_documents).forEach((_required_doc, index) =>
        update_required_docs_list({
          index: index,
          document: _required_doc.document,
        })
      );
      required_docs = JSON.parse(preset.required_documents);
    } catch (e) {}

    update = true;
    document.getElementById("screening_preset_id").value = preset.ID;
  }
});

$("#exampleModalLong").on("hidden.bs.modal", () => {
  document.getElementById("preset_name").value = "";
  document.getElementById("monthly_rent").value = "";
  document.getElementById("security_deposit").value = "";
  document.getElementById("due_day").value = "";

  document.getElementById("grace_period").value = "";
  document.getElementById("flat_late_fee").value = "";
  document.getElementById("daily_rate").value = "";
  document.getElementById("max_cumulative_late_fee").value = "";
  document.getElementById("other_fees_container").innerHTML = "";

  update = false;
  other_monthly_fees = [];
});

$("#exampleModalLong2").on("hidden.bs.modal", function () {
  document.getElementById("preset_name_modal").value = "";
  document.getElementById("question").value = "";
  document.getElementById("required_doc").value = "";
  document.getElementById("from_time").value = "";
  document.getElementById("to_time").value = "";
  document.getElementById("question_list").innerHTML = "";
  document.getElementById("required_doc_list").innerHTML = "";
  document.getElementById("viewing_slot_list").innerHTML = "";
  required_docs = [];
  viewing_slots = [];
  questions = [];
  update = false;
});

$("#rental_preset_form input[type=radio]").click((event) => {
  if (event.target.id === "charge_late_fee-0") {
    document.getElementById("grace_period").disabled = false;
    document.getElementById("grace_period").setAttribute("required", "true");
    document.getElementById("charge_daily").disabled = false;
    document.getElementById("daily_rate").disabled = false;
    document.getElementById("max_cumulative_late_fee").disabled = false;
    document.getElementById("charge_flat").disabled = false;
    document.getElementById("flat_late_fee").disabled = false;
    return;
  }

  if (event.target.id === "charge_late_fee-1") {
    document.getElementById("grace_period").disabled = true;
    document.getElementById("charge_daily").disabled = true;
    document.getElementById("daily_rate").disabled = true;
    document.getElementById("max_cumulative_late_fee").disabled = true;
    document.getElementById("charge_flat").disabled = true;
    document.getElementById("flat_late_fee").disabled = true;
    return;
  }
});

$("input[type=radio]").click(function () {
  if (this.id == "payment_filter") {
    apply_filter(this.value);
  }
});

add_question.onclick = (event) => {
  var q = {
    index: question_count,
    short_id: shortid.generate(),
    question: document.getElementById("question").value,
    answer_data_type: document.getElementById("answer_data_type").value,
  };

  questions.push(q);

  update_question_list(q);

  question_count = question_count + 1;

  document.getElementById("question").value = "";
  document.getElementById("answer_data_type").value = "";
};

add_required_doc.onclick = (event) => {
  var doc = {
    index: required_docs_count,
    document: document.getElementById("required_doc").value,
  };

  required_docs.push(doc);

  update_required_docs_list(doc);

  required_docs_count = required_docs_count + 1;

  document.getElementById("required_doc").value = "";
};

add_viewing_slot.onclick = (event) => {
  var slot = {
    index: viewing_slots_count,
    day: document.getElementById("viewing_day").value,
    from_time: document.getElementById("from_time").value,
    to_time: document.getElementById("to_time").value,
  };

  viewing_slots.push(slot);

  update_viewing_slots_list(slot);

  viewing_slots_count = viewing_slots_count + 1;

  day: document.getElementById("viewing_day").value = "";
  from_time: document.getElementById("from_time").value = "";
  to_time: document.getElementById("to_time").value = "";
};

save_screening_preset_button.onclick = (event) => {
  if (document.getElementById("preset_name_modal").value === "") {
    document.getElementById("toast_message_s").innerHTML =
      "<b>     * Preset name required</b>";
    return;
  }

  if (questions.length === 0) {
    document.getElementById("toast_message_s").innerHTML =
      "<b>     * Please specify atleast 1 Question to be answered in Rental Applications</b>";
    return;
  }

  if (required_docs.length === 0) {
    document.getElementById("toast_message_s").innerHTML =
      "<b>     * Please specify atleast 1 Required Document to be submitted with Rental Applications</b>";
    return;
  }

  if (viewing_slots.length === 0) {
    document.getElementById("toast_message_s").innerHTML =
      "<b>     * Please specify atleast 1 Viewing Slot when this Listing is generally available for Viewing.</b>";
    return;
  }
  document.getElementById("required_docs_string").value =
    JSON.stringify(required_docs);
  document.getElementById("viewing_slots_string").value =
    JSON.stringify(viewing_slots);
  document.getElementById("questions_string").value = JSON.stringify(questions);
  document.getElementById("update_screening").value = update;
  update = false;
  document.getElementById("screening_preset_form").submit();
};

function update_question_list(details) {
  var question_list = document.getElementById("question_list");

  var li = document.createElement("div");
  li.className = "p-2";
  var row = document.createElement("div");
  row.setAttribute("class", "row");

  var p = document.createElement("label");
  p.innerHTML = details.question;

  row.appendChild(p);
  row.appendChild(document.createElement("hr"));

  li.appendChild(row);

  li.onclick = (event) => {
    question_list.removeChild(li);
    questions.splice(details.index, 1);

    for (var i = 0; i < questions.length; i++) {
      questions[i].index = i;
    }

    question_count = question_count - 1;
  };

  question_list.appendChild(li);
}

function update_required_docs_list(details) {
  var required_doc_list = document.getElementById("required_doc_list");
  var li = document.createElement("div");
  li.className = "p-2";
  var row = document.createElement("div");
  row.setAttribute("class", "row");

  var p = document.createElement("label");
  p.innerHTML = details.document;

  row.appendChild(p);
  row.appendChild(document.createElement("hr"));

  li.onclick = (event) => {
    required_doc_list.removeChild(li);

    required_docs.splice(details.index, 1);

    for (var i = 0; i < required_docs.length; i++) {
      required_docs[i].index = i;
    }

    required_docs_count = required_docs_count - 1;
  };

  li.appendChild(row);

  required_doc_list.appendChild(li);
}

function update_viewing_slots_list(details) {
  var viewing_slot_list = document.getElementById("viewing_slot_list");
  var li = document.createElement("div");
  li.className = "p-2";
  var row = document.createElement("div");
  row.setAttribute("class", "row");

  var p = document.createElement("label");
  p.innerHTML =
    details.day + ", " + details.from_time + " - " + details.to_time;

  row.appendChild(p);
  row.appendChild(document.createElement("hr"));

  li.appendChild(row);

  li.onclick = (event) => {
    viewing_slot_list.removeChild(li);
    viewing_slots.splice(details.index, 1);

    for (var i = 0; i < viewing_slots.length; i++) {
      viewing_slots[i].index = i;
    }

    viewing_slots_count = viewing_slots_count - 1;
  };

  viewing_slot_list.appendChild(li);
}

function update_fee_list(details) {
  var li = document.createElement("div");
  li.className = "p-2";

  var row = document.createElement("div");
  row.setAttribute("class", "row");

  var p = document.createElement("label");
  p.innerHTML = details.fee_name + ": P " + details.fee_amount;

  row.appendChild(p);
  row.appendChild(document.createElement("hr"));

  li.onclick = (event) => {
    document.getElementById("other_fees_container").removeChild(li);

    other_monthly_fees.splice(details.index, 1);

    for (var i = 0; i < other_monthly_fees.length; i++) {
      other_monthly_fees[i].index = i;
    }

    fee_count = fee_count - 1;
  };

  li.appendChild(row);

  document.getElementById("other_fees_container").appendChild(li);
}

document.getElementById("charge_flat").addEventListener("change", (event) => {
  if (event.target.checked) {
    document.getElementById("charge_daily").checked = false;
    document.getElementById("charge_daily").disabled = true;
    document.getElementById("daily_rate").disabled = true;
    //document.getElementById('max_cumulative_late_fee').disabled = true;
  } else {
    document.getElementById("charge_daily").disabled = false;
    document.getElementById("daily_rate").disabled = false;
    //document.getElementById('max_cumulative_late_fee').disabled = false;
  }
});

document.getElementById("charge_daily").addEventListener("change", (event) => {
  if (event.target.checked) {
    document.getElementById("charge_flat").disabled = true;
    document.getElementById("charge_flat").checked = false;
    document.getElementById("flat_late_fee").disabled = true;
  } else {
    document.getElementById("charge_flat").disabled = false;
    document.getElementById("flat_late_fee").disabled = false;
  }
});

function get_financial_data() {
  $.ajax({
    method: "post",
    url: "/listings/rental_analysis",
    data: {
      listing_id: document.getElementById("listing_id").value,
    },
    success: function (result) {
      financial_data = result;
      render_financial_data();
    },

    error: function (error) {
      console.log(error);
      showConfirmation("Failed to fetch financial data. ");
    },
  });
}

function render_financial_data() {
  var ctx = document.getElementById("vacancy_chart").getContext("2d");

  var myDoughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          label: "Vacancy Rate -" + financial_data.vacancy_rate,
          data: [financial_data.units_available, financial_data.occupied_units],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 0,
        },
      ],

      // These labels appear in the legend and in the tooltips when hovering different arcs
      labels: ["Vacant", "Occupied"],
    },
    options: {
      animateRotate: true,
    },
  });

  financial_data.annual_net_operating_income
    ? (document.getElementById("net_operating_income").innerHTML = money_format(
        financial_data.annual_net_operating_income
      ))
    : (document.getElementById("net_operating_income").innerHTML = "-");

  financial_data.gross_potential_income
    ? (document.getElementById("gross_potential_income").innerHTML =
        money_format(financial_data.gross_potential_income))
    : (document.getElementById("gross_potential_income").innerHTML = "-");

  financial_data.potential_credit_loss
    ? (document.getElementById("potential_credit_loss").innerHTML =
        money_format(financial_data.potential_credit_loss))
    : (document.getElementById("potential_credit_loss").innerHTML = "-");

  financial_data.potential_credit_loss_percentage
    ? (document.getElementById("credit_loss_label").innerHTML =
        "Potential Credit Loss(Current: " +
        financial_data.potential_credit_loss_percentage +
        " %)")
    : (document.getElementById("credit_loss_label").innerHTML =
        "Potential Credit Loss(Default: 6 %)");

  financial_data.actual_credit_loss
    ? (document.getElementById("actual_credit_loss").innerHTML = money_format(
        financial_data.actual_credit_loss
      ))
    : (document.getElementById("actual_credit_loss").innerHTML = "-");

  financial_data.total_rent
    ? (document.getElementById("expected_monthly_rental").innerHTML =
        money_format(financial_data.total_rent))
    : (document.getElementById("expected_monthly_rental").innerHTML = "-");

  financial_data.total_other_income
    ? (document.getElementById("expected_monthly_other").innerHTML =
        money_format(financial_data.total_other_income))
    : (document.getElementById("expected_monthly_other").innerHTML = "-");

  var total = financial_data.total_rent + financial_data.total_other_income;

  total
    ? (document.getElementById("expected_monthly_total").innerHTML =
        money_format(total))
    : (document.getElementById("expected_monthly_total").innerHTML = "-");
  financial_data.total_once_off_expenses
    ? (document.getElementById("once_off_label").innerHTML = money_format(
        financial_data.total_once_off_expenses
      ))
    : (document.getElementById("once_off_label").innerHTML = "-");
  financial_data.monthly_operating_expenses
    ? (document.getElementById("monthly_label").innerHTML = money_format(
        financial_data.monthly_operating_expenses
      ))
    : (document.getElementById("monthly_label").innerHTML = "-");

  total =
    financial_data.total_once_off_expenses +
    financial_data.monthly_operating_expenses;

  total
    ? (document.getElementById("total_expense_label").innerHTML =
        money_format(total))
    : (document.getElementById("total_expense_label").innerHTML = "-");

  var table = document.getElementById("expense_table");
  table.innerHTML = "";
  var rows = "";

  for (var i = 0; i < financial_data.expenses.length; i++) {
    var expense = financial_data.expenses[i];

    var row =
      "<tr>" +
      "<td class='column1'>" +
      "<p>" +
      "" +
      expense.description +
      "" +
      "</p>" +
      "</td>" +
      "<td class='column2 text-lg-center text-md-center text-center'>" +
      "<p>" +
      money_format(expense.amount) +
      "</p>" +
      "</td>" +
      "<td class='column3 text-lg-center text-md-center text-center'>" +
      "<p>" +
      "" +
      expense.type +
      "" +
      "</p>" +
      "</td>" +
      "<td class='column4 text-lg-center text-md-center text-center'>" +
      "<p>" +
      "<a class='override' href='#' onclick='event.preventDefault(); edit_expense(" +
      JSON.stringify(expense) +
      ");'>" +
      "Edit</a>" +
      "</p>" +
      "</td>" +
      "<td class='column5 text-lg-center text-md-center text-center'>" +
      "<p>" +
      "<a class='override' href='#' onclick='event.preventDefault(); delete_expense(" +
      expense.ID +
      ")'>Delete</a>" +
      "</p>" +
      "</td>" +
      "</tr>";

    rows += row;
  }

  table.innerHTML = rows;
}

function money_format(amount) {
  return "P " + numeral(amount).format("P0,0.00");
}
function update_credit_loss() {
  var new_value = document.getElementById("potential_credit_loss_input").value;

  if (new_value && new_value > 0) {
    $.ajax({
      method: "post",
      url: "/listings/update_potential_credit_loss",
      data: {
        listing_id: document.getElementById("listing_id").value,
        potential_credit_loss: new_value,
      },
      success: function (result) {
        showConfirmation("Changes saved.");
        get_financial_data();
      },

      error: function (error) {
        showConfirmation(error);
      },
    });
  } else {
    showConfirmation("Invalid Credit Loss Value");
  }
}

var expense_id = -1;
function add_expense() {
  if (
    document.getElementById("expense_name").value != "" &&
    document.getElementById("expense_amount").value != ""
  ) {
    let expenses = [
      {
        ListingID: document.getElementById("listing_id").value,
        description: document.getElementById("expense_name").value,
        amount: document.getElementById("expense_amount").value,
        type: $("input[name=expense_type]:checked").val(),
        date_recorded: new Date().toISOString().split("T")[0],
      },
    ];
    document.getElementById("electricity_amount").value = "";
    document.getElementById("water_amount").value = "";
    var payload = {
      action: expense_id === -1 ? "add" : "edit",
      expense_id: expense_id,
      expenses: expenses,
    };
    $.ajax({
      method: "post",
      url: "/listings/manage_expenses",
      data: payload,
      success: function (result) {
        expense_id = -1;
        showConfirmation("Changes saved.");
        get_financial_data();
      },

      error: function (error) {
        document.getElementById("expense_name").value = expenses.description;
        document.getElementById("expense_amount").value = expenses.amount;
        //document.getElementById('expense_type').value = expense.type;
        showConfirmation(error);
      },
    });
  } else {
    showConfirmation("Expense name or Amount missing");
  }
}

function add_utilityBills() {
  if (
    document.getElementById("water_amount").value != "" ||
    document.getElementById("electricity_amount").value != ""
  ) {
    let expenses = [
      {
        ListingID: document.getElementById("listing_id").value,
        description: "Water",
        amount: document.getElementById("water_amount").value,
        type: "once-off",
        date_recorded: new Date().toISOString().split("T")[0],
      },
      {
        ListingID: document.getElementById("listing_id").value,
        description: "Electricity",
        amount: document.getElementById("electricity_amount").value,
        type: "once-off",
        date_recorded: new Date().toISOString().split("T")[0],
      },
    ];

    document.getElementById("water_amount").value = "";
    document.getElementById("electricity_amount").value = "";
    var payload = {
      action: expense_id === -1 ? "add" : "edit",
      expense_id: expense_id,
      expenses: expenses,
    };
    $.ajax({
      method: "post",
      url: "/listings/manage_expenses",
      data: payload,
      success: function (result) {
        expense_id = -1;
        showConfirmation("Changes saved.");
        get_financial_data();
      },

      error: function (error) {
        document.getElementById("expense_name").value = expenses[0].description;
        document.getElementById("expense_amount").value =
          expenses[1].description;
        //document.getElementById('expense_type').value = expense.type;
        showConfirmation(error);
      },
    });
  } else {
    showConfirmation(" Amounts missing");
  }
}

function edit_expense(expense) {
  expense_id = expense.ID;
  document.getElementById("expense_name").value = expense.description;
  document.getElementById("expense_amount").value = expense.amount;
  //document.getElementById('expense_type').value = expense.type;
}

function delete_expense(id) {
  $.ajax({
    method: "post",
    url: "/listings/manage_expenses",
    data: {
      action: "delete",
      expense_id: id,
    },
    success: function (result) {
      showConfirmation("Deleted successfully.");
      get_financial_data();
    },

    error: function (error) {
      console.log(error);
      showConfirmation(error);
    },
  });
}

var filtered_payments = [];

function filter_payments() {
  var from = document.getElementById("report_from_date").value;
  var to = document.getElementById("report_to_date").value;
  filtered_payments = [];
  if (from != "" && to != "") {
    for (var i = 0; i < financial_data.payments.length; i++) {
      var payment = financial_data.payments[i];
      if (datefns.isWithinRange(payment.due_date, from, to)) {
        filtered_payments.push(payment);
      }
    }
  } else {
    showConfirmation("Please select From and To date range.");
  }

  compute_filtered_totals();
}

function compute_filtered_totals() {
  var outstanding = 0.0;
  var paid = 0.0;
  var late = 0.0;

  for (var i = 0; i < filtered_payments.length; i++) {
    var payment = filtered_payments[i];
    payment.amount = parseFloat(payment.amount);
    console.log(payment.status);
    switch (payment.status) {
      case "due":
        outstanding += payment.amount;
        break;

      case "paid":
        paid += payment.amount;
        break;

      case "late":
        late += payment.amount;
        break;
    }
  }

  var total = outstanding + paid + late;

  document.getElementById("outstanding_label").innerHTML =
    "<h5><b>" + money_format(outstanding) + "</b></h5>";
  document.getElementById("paid_label").innerHTML =
    "<h5><b>" + money_format(paid) + "</b></h5>";
  document.getElementById("late_label").innerHTML =
    "<h5><b>" + money_format(late) + "</b></h5>";
  document.getElementById("all_label").innerHTML =
    "<h5><b>" + money_format(total) + "</b></h5>";
}

function apply_filter(which) {
  console.log(which);
  $("#income_report_table").DataTable().rows().remove().draw();

  for (var i = 0; i < filtered_payments.length; i++) {
    var payment = filtered_payments[i];
    if (payment.status === which || which === "all") {
      var row =
        "<tr>" +
        "<td>" +
        "<a target='_blank' href='/tenants/view_tenant?id=" +
        payment.ID +
        "'>" +
        "" +
        payment.fullname +
        "" +
        "</a>" +
        "</td>" +
        "<td>" +
        "<p>" +
        "" +
        payment.description +
        "" +
        "</p>" +
        "</td>" +
        "<td>  " +
        money_format(payment.amount) +
        "</td>" +
        "<td>" +
        "    <p>" +
        "<b>(" +
        payment.due_date +
        ")</b>" +
        "</p>" +
        "</td>" +
        "</tr>";

      $("#income_report_table").DataTable().rows.add($(row)).draw();
    }
  }

  //$('#income_report_table').DataTable().draw();
}
