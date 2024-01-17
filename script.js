const calculateBtn = document.querySelector('#calculate-date');
const startDateInput = document.querySelector('#start-date');
const numberOfDaysInput = document.querySelector('#number-of-days');
const endDateInput = document.querySelector('#end-date');
const resultTitle = document.querySelector('#result-title');
const datesList = document.querySelector('#dates-list');

const dates = [
  {
    reason: "National Holiday",
    date: "2023-02-22",
  },
  {
    reason: "Eid Alfetr 01",
    date: "2023-04-22",
  },
  {
    reason: "Eid Alfetr 02",
    date: "2023-04-23",
  },
  {
    reason: "Arafat",
    date: "2023-06-28",
  },
  {
    reason: "Eid Aladha 01",
    date: "2023-06-29",
  },
  {
    reason: "Eid Aladha 02",
    date: "2023-07-01",
  },
  {
    reason: "National Day",
    date: "2023-09-23",
  },
  {
    reason: "National Day",
    date: "2024-09-23",
  },
];

// Store dates in local storage
if (!localStorage.getItem("holidays")) {
  localStorage.setItem("holidays", JSON.stringify(dates));
}
// Retrieve dates from local storage
const storedDates = JSON.parse(localStorage.getItem("holidays"));

// Check if dates were retrieved successfully
if (storedDates) {
  // Add retrieved dates to the existing dates array
  dates.push(...storedDates);
}

calculateBtn.addEventListener('click', function() {
  const startDate = new Date(startDateInput.value);
  let numberOfDays = parseInt(numberOfDaysInput.value);
  let endDate = new Date(startDate);
  let skippedDates = [];
  let count = 0;
  numberOfDays--;
  while (numberOfDays > 0) {
    endDate.setDate(endDate.getDate() + 1);

    const formattedDate = endDate.toISOString().split('T')[0];
    // if (endDate.getDay() !== 5 && !dates.some(d => d.date === formattedDate)) {
      if (endDate.getDay() !== 5 && !holidays.some(d => d.date === formattedDate)) {

      numberOfDays--;
    } else {
      skippedDates.push({ date: formattedDate, reason: getReason(formattedDate) });
      count++;
    }
  }

  function getReason(date) {
    const found = dates.find(d => d.date === date);
    return found ? found.reason : "Friday";
  }

  endDateInput.value = endDate.toISOString().split('T')[0];
  resultTitle.textContent = `Skipped Dates (${count}):`;
  datesList.innerHTML = '';
  skippedDates.forEach(function(date) {
    const li = document.createElement('li');
    li.textContent = `${date.date} - ${date.reason}`;
    li.classList = "list-group-item list-group-item-action list-group-item-light";
    datesList.appendChild(li);
  });
});


document.getElementById('calculate-date-diff').addEventListener('click', function () {
  // Get the values of the start and end date inputs
  var startDate = document.getElementById('start-date-diff').value;
  var endDate = document.getElementById('end-date-diff').value;

  // Convert the date strings to Date objects
  var startDateObj = new Date(startDate);
  var endDateObj = new Date(endDate);

  // Calculate the difference in milliseconds
  var timeDiff = endDateObj - startDateObj;

  // Calculate the difference in days
  var daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // Update the duration input with the calculated difference
  document.getElementById('number-of-days-diff').value = daysDiff;
});


//////////////////////


// $(document).ready(function() {
//   let holidays = JSON.parse(localStorage.getItem("holidays")) || [];
//   console.log(holidays);
//   let tableBody = $("#holidays-tbody");
//   holidays.forEach(function(holiday) {
//     let row = $(
//       "<tr><td>" +
//         holiday.reason +
//         "</td><td>" +
//         holiday.date +
//         "</td><td><button class='edit-btn'>Edit</button><button class='delete-btn'>Delete</button></td></tr>"
//     );
//     tableBody.append(row);
//   });
//   $("#add-holiday-btn").click(function() {
//     let reason = prompt("Enter reason for the holiday:");
//     let date = prompt("Enter date of the holiday (YYYY-MM-DD):");
//     holidays.push({ reason: reason, date: date });
//     localStorage.setItem("holidays", JSON.stringify(holidays));
//     let row = $(
//       "<tr><td>" +
//         reason +
//         "</td><td>" +
//         date +
//         "</td><td><button class='edit-btn'>Edit</button><button class='delete-btn'>Delete</button></td></tr>"
//     );
//     tableBody.append(row);
//   });
  // $(document).on("click", ".edit-btn", function() {
  //   let row = $(this).closest("tr");
  //   let reason = row.find("td:first").text();
  //   let date = row.find("td:nth-child(2)").text();
  //   let newReason = prompt("Enter new reason:", reason);
  //   let newDate = prompt("Enter new date (YYYY-MM-DD):", date);
  //   row.find("td:first").text(newReason);
  //   row.find("td:nth-child(2)").text(newDate);
  //   let index = holidays.findIndex(function(holiday) {
  //     return holiday.reason === reason && holiday.date === date;
  //   });
  //   holidays[index] = { reason: newReason, date: newDate };
  //   localStorage.setItem("holidays", JSON.stringify(holidays));
  // });
//   $(document).on("click", ".delete-btn", function() {
//     let row = $(this).closest("tr");
//     let reason = row.find("td:first").text();
// // Add holiday
// function addHoliday() {
//   const reason = document.getElementById("reason").value;
//   const date = document.getElementById("date").value;
//   const holiday = { reason, date };
  
//   let holidays = JSON.parse(localStorage.getItem("holidays")) || [];
//   holidays.push(holiday);
//   localStorage.setItem("holidays", JSON.stringify(holidays));
//   displayHolidays();
//   }
  
//   // Edit holiday
//   function editHoliday(index) {
//   const reason = document.getElementById("reason").value;
//   const date = document.getElementById("date").value;
//   let holidays = JSON.parse(localStorage.getItem("holidays")) || [];
//   holidays[index] = { reason, date };
//   localStorage.setItem("holidays", JSON.stringify(holidays));
//   displayHolidays();
//   }
  
//   // Delete holiday
//   function deleteHoliday(index) {
//   let holidays = JSON.parse(localStorage.getItem("holidays")) || [];
//   holidays.splice(index, 1);
//   localStorage.setItem("holidays", JSON.stringify(holidays));
//   displayHolidays();
//   }
  
//   // Display holidays
//   function displayHolidays() {
//   let holidays = JSON.parse(localStorage.getItem("holidays")) || [];
//   let holidayList = document.getElementById("holiday-list");
//   holidayList.innerHTML = "";
  
//   for (let i = 0; i < holidays.length; i++) {
//   holidayList.innerHTML += <li> ${holidays[i].reason} - ${holidays[i].date} <button onclick="editHoliday(${i})">Edit</button> <button onclick="deleteHoliday(${i})">Delete</button> </li> ;
//   }
//   }
  
//   // Initial display of holidays on page load
//   displayHolidays();


/////////////////////////////////////////////////////////////////////////////
// $(document).ready(function() {
  let holidays = JSON.parse(localStorage.getItem("holidays")) || [];

  function addHoliday() {
    const reason = document.getElementById("addReason").value;
    const date = document.getElementById("addDate").value;
    holidays.push({ reason, date });
    localStorage.setItem("holidays", JSON.stringify(holidays));
    displayHolidays();
  }

  function editHoliday(index) {
    const reason = prompt("Enter a new reason");
    const date = prompt("Enter a new date (Year-Month-Day)");
    holidays[index] = { reason, date };
    localStorage.setItem("holidays", JSON.stringify(holidays));
    displayHolidays();
  }

  function deleteHoliday(index) {
    holidays.splice(index, 1);
    localStorage.setItem("holidays", JSON.stringify(holidays));
    displayHolidays();
  }

  function displayHolidays() {
    let tbody = document.getElementById("holidays-tbody");
    tbody.innerHTML = "";

    for (let i = 0; i < holidays.length; i++) {
      tbody.innerHTML += `
        <tr>
          <td>${holidays[i].reason}</td>
          <td>${holidays[i].date}</td>
          <td>
          <button class="btn btn-warning edit-btn" onclick="editHoliday(${i})">Edit</button> 
          <button class="btn btn-danger delete-btn" onclick="deleteHoliday(${i})">Delete</button>
            </td>
        </tr>
      `;
    }
  }

  displayHolidays();

  document.getElementById("add-holiday-btn").addEventListener("click", addHoliday);
// });



document.getElementById("vacation-list").addEventListener("click", function() {
  let table = document.getElementById("holidays-table-div");
  if (table.style.display === "none") {
  table.style.display = "flex";
  } else {
  table.style.display = "none";
  }
  });






//////////////////////////////////////////////////////////////////////////////////////////////////////
// const calculateBtn = document.querySelector('#calculate-date');
// const startDateInput = document.querySelector('#start-date');
// const numberOfDaysInput = document.querySelector('#number-of-days');
// const endDateInput = document.querySelector('#end-date');
// const resultTitle = document.querySelector('#result-title');
// const datesList = document.querySelector('#dates-list');


// calculateBtn.addEventListener('click', function() {
//   const startDate = new Date(startDateInput.value);
//   let numberOfDays = parseInt(numberOfDaysInput.value);
//   let endDate = new Date(startDate);
//   let skippedDates = [];
//   let count = 0;

//   while (numberOfDays > 0) {
//     endDate.setDate(endDate.getDate() + 1);

//     const formattedDate = endDate.toISOString().split('T')[0];
//     if (endDate.getDay() !== 5 && !dates.some(d => d.date === formattedDate)) {
//       numberOfDays--;
//     } else {
//       skippedDates.push({ date: formattedDate, reason: getReason(formattedDate) });
//       count++;
//     }
//   }

//   function getReason(date) {
//     const found = dates.find(d => d.date === date);
//     return found ? found.reason : "Friday";
//   }

//   endDateInput.value = endDate.toISOString().split('T')[0];
//   resultTitle.textContent = `Skipped Dates (${count}):`;
//   datesList.innerHTML = '';
//   skippedDates.forEach(function(date) {
//     const li = document.createElement('li');
//     li.textContent = `${date.date} - ${date.reason}`;
//     datesList.appendChild(li);
//   });
// });

// // Store datesToSkip array in session storage
// var datesToSkip = [
//     {
//       reason: "National Holiday",
//       date: "2023-02-20",
//     },
//     {
//       reason: "Eid Alfetr 01",
//       date: "2023-03-27",
//     },
//     {
//       reason: "Eid Alfetr 02",
//       date: "2023-03-28",
//     },
//     {
//       reason: "Eid Alfetr 03",
//       date: "2023-03-29",
//     },
//   ];
//   sessionStorage.setItem("datesToSkip", JSON.stringify(datesToSkip));
  
//   // Retrieve datesToSkip array from session storage and display in div
//   var datesToSkipHTML = "";
//   var retrievedDatesToSkip = JSON.parse(sessionStorage.getItem("datesToSkip"));
//   for (var i = 0; i < retrievedDatesToSkip.length; i++) {
//     datesToSkipHTML += "<p><input type='text' id='reason_" + i + "' value='" + retrievedDatesToSkip[i].reason + "'>" +
//                        "<input type='text' id='date_" + i + "' value='" + retrievedDatesToSkip[i].date +
//                        "'><button id='save_" + i + "'>Save</button></p>";
//   }
//   document.getElementById("datesToSkip").innerHTML = datesToSkipHTML;
  
//   // Function to save changes to datesToSkip
//   function saveChanges(index) {
//     retrievedDatesToSkip[index].reason = document.getElementById("reason_" + index).value;
//     retrievedDatesToSkip[index].date = document.getElementById("date_" + index).value;
//     sessionStorage.setItem("datesToSkip", JSON.stringify(retrievedDatesToSkip));
//   }
  
//   // Attach saveChanges function to save buttons
//   var saveButtons = document.getElementsByTagName("button");
//   for (var i = 0; i < saveButtons.length; i++) {
//     saveButtons[i].addEventListener("click", function() {
//       var index = this.id.split("_")[1];
//       saveChanges(index);
//     });
//   }


/////////////////////////////////////////////////////////////////////////////////////////////////
// Store datesToSkip array in session storage
// var datesToSkip = [
//     {
//       reason: "National Holiday",
//       date: "2023-02-20",
//     },
//     {
//       reason: "Eid Alfetr 01",
//       date: "2023-03-27",
//     },
//     {
//       reason: "Eid Alfetr 02",
//       date: "2023-03-28",
//     },
//     {
//       reason: "Eid Alfetr 03",
//       date: "2023-03-29",
//     },
//   ];
//   sessionStorage.setItem("datesToSkip", JSON.stringify(datesToSkip));
  
//   // Retrieve datesToSkip array from session storage and display in div
//   var datesToSkipHTML = "";
//   var retrievedDatesToSkip = JSON.parse(sessionStorage.getItem("datesToSkip"));
//   for (var i = 0; i < retrievedDatesToSkip.length; i++) {
//     datesToSkipHTML += "<div class='form-group row'>" + 
//                        "<label class='col-sm-2 col-form-label'>" + retrievedDatesToSkip[i].reason + "</label>" +
//                        "<div class='col-sm-3'>" + 
//                        "<input type='text' class='form-control-plaintext' id='reason_" + i + "' value='" + retrievedDatesToSkip[i].reason + "' disabled>" +
//                        "</div>" +
//                        "<label class='col-sm-2 col-form-label'>" + retrievedDatesToSkip[i].date + "</label>" +
//                        "<div class='col-sm-3'>" +
//                        "<input type='text' class='form-control-plaintext' id='date_" + i + "' value='" + retrievedDatesToSkip[i].date + 
//                        "' disabled>" +
//                        "</div>" +
//                        "<div class='col-sm-2'>" +
//                        "<button type='button' class='btn btn-primary' id='edit_" + i + "'>Edit</button>" + 
//                        "<button type='button' class='btn btn-success d-none' id='save_" + i + "'>Save</button>" +
//                        "</div>" +
//                        "</div>";
//   }
//   document.getElementById("datesToSkip").innerHTML = datesToSkipHTML;
  
//   // Function to enable editing of datesToSkip
//   function enableEditing(index) {
//     document.getElementById("reason_" + index).disabled = false;
//     document.getElementById("date_" + index).disabled = false;
//     document.getElementById("edit_" + index).classList.add("d-none");
//     document.getElementById("save_" + index).classList.remove("d-none");
//   }
  

  
//   // Function to save changes to datesToSkip
//   function saveChanges(index) {
//     retrievedDatesToSkip[index].reason = document.getElementById("reason_" + index).value;
//     retrievedDatesToSkip[index].date = document.getElementById("date_" + index).value;
//     sessionStorage.setItem("datesToSkip", JSON.stringify(retrievedDatesToSkip));
// //   }
  
// // Save changes to session storage
// sessionStorage.setItem("datesToSkip", JSON.stringify(retrievedDatesToSkip));

// // Disable editing and switch back to Edit button
// document.getElementById("reason_" + index).disabled = true;
// document.getElementById("date_" + index).disabled = true;
// document.getElementById("edit_" + index).classList.remove("d-none");
// document.getElementById("save_" + index).classList.add("d-none");
// }

// // Add event listeners for Edit buttons
// for (var i = 0; i < retrievedDatesToSkip.length; i++) {
//   document.getElementById("edit_" + i).addEventListener("click", function() {
//     enableEditing(this.id.split("_")[1]);
//   });
//   document.getElementById("save_" + i).addEventListener("click", function() {
//     saveChanges(this.id.split("_")[1]);
//   });
// }
