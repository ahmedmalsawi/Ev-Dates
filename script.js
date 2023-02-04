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

// // Store dates in local storage
// localStorage.setItem("holidays", JSON.stringify(dates));

// // Retrieve dates from local storage
// const storedDates = JSON.parse(localStorage.getItem("holidays"));

// // Check if dates were retrieved successfully
// if (storedDates) {
//   // Add retrieved dates to the existing dates array
//   dates.push(...storedDates);
// }

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
    if (endDate.getDay() !== 5 && !dates.some(d => d.date === formattedDate)) {
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
    datesList.appendChild(li);
  });
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
