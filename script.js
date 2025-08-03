document.addEventListener("DOMContentLoaded", () => {
  /* ==================[ Elements ]================== */
  const calculateBtn = document.querySelector('#calculate-date');
  const calculateDiffBtn = document.querySelector('#calculate-date-diff');
  const startDateInput = document.querySelector('#start-date');
  const numberOfDaysInput = document.querySelector('#number-of-days');
  const endDateInput = document.querySelector('#end-date');
  const startDateDiff = document.querySelector('#start-date-diff');
  const endDateDiff = document.querySelector('#end-date-diff');
  const numberOfDaysDiff = document.querySelector('#number-of-days-diff');
  const exportBtn = document.getElementById("exportExcel");
  const importInput = document.getElementById("importExcel");
  const addHolidayBtn = document.getElementById("add-holiday-btn");
  const holidaysTbody = document.getElementById("holidays-tbody");

  const skippedToastEl = document.getElementById('skippedToast');
  const skippedToastBody = document.getElementById('skippedToastBody');
  const viewSkippedBtn = document.getElementById('viewSkippedBtn');
  const skippedTableBody = document.getElementById('skippedTableBody');

  let skippedDatesGlobal = []; // لتخزين الأيام المتخطاة

  /* ==================[ Initial Data ]================== */
  const defaultDates = [
    { reason: "National Holiday", date: "2023-02-22" },
    { reason: "Eid Alfetr 01", date: "2023-04-22" },
    { reason: "Eid Alfetr 02", date: "2023-04-23" },
    { reason: "Arafat", date: "2023-06-28" },
    { reason: "Eid Aladha 01", date: "2023-06-29" },
    { reason: "Eid Aladha 02", date: "2023-07-01" },
    { reason: "National Day", date: "2023-09-23" },
    { reason: "Eid Alfetr", date: "2024-04-10" },
    { reason: "Eid Alfetr", date: "2024-04-11" },
    { reason:'National Holiday', date: '2023-02-22' },
    { reason:'Eid Alfetr 01', date: '2023-04-22' },
    { reason:'Eid Alfetr 02', date: '2023-04-23' },
    { reason:'Arafat', date: '2023-06-28' },
    { reason:'Eid Aladha 01', date: '2023-06-29' },
    { reason:'Eid Aladha 02', date: '2023-07-01' },
    { reason:'National Day', date: '2023-09-23' },
    { reason:'Eid Alfetr', date: '2024-04-10' },
    { reason:'Eid Alfetr', date: '2024-04-11' },
    { reason:'Eid Alfetr', date: '2024-04-13' },
    { reason:'Arafah Day', date: '2024-06-15' },
    { reason:'Eid Aladha', date: '2024-06-16' },
    { reason:'Eid Aladha', date: '2024-06-17' },
    { reason:'Eid Aladha', date: '2024-06-18' },
    { reason:'National Day', date: '2024-09-23' },
    { reason:'Foundation Day', date: '2025-02-22' },
    { reason:'Eid Al Fetr', date: '2025-03-30' },
    { reason:'Eid Al Fetr', date: '2025-03-31' },
    { reason:'Eid Al Fetr', date: '2025-04-01' },
    { reason:'Eid Al Fetr', date: '2025-04-02' },
    { reason:'Eid Al Aladha', date: '2025-06-05' },
    { reason:'Eid Al Aladha', date: '2025-06-07' },
    { reason:'Eid Al Aladha', date: '2025-06-08' },
    { reason:'Eid Al Aladha', date: '2025-06-09' },
    { reason:'National Day', date: '2025-09-23' },
    { reason: "Eid Alfetr", date: "2024-04-13" }
  ];

  let holidays = JSON.parse(localStorage.getItem("holidays")) || defaultDates;
  localStorage.setItem("holidays", JSON.stringify(holidays));

  /* ==================[ Utils ]================== */
  const saveHolidays = () => localStorage.setItem("holidays", JSON.stringify(holidays));

  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000).toISOString().split('T')[0];
  };

  const showToast = (message, type = 'success') => {
    if (skippedToastEl && skippedToastBody) {
      skippedToastBody.textContent = message;
      skippedToastEl.className = `toast align-items-center text-bg-${type} border-0`;
      new bootstrap.Toast(skippedToastEl).show();
    }
  };
  

  const displayHolidays = () => {
    holidaysTbody.innerHTML = holidays.map((h, i) => `
      <tr>
        <td>${h.reason}</td>
        <td>${h.date}</td>
        <td>
          <button class="btn btn-warning" onclick="editHoliday(${i})">Edit</button>
          <button class="btn btn-danger" onclick="deleteHoliday(${i})">Delete</button>
        </td>
      </tr>`).join('');  
  };



  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getWeekNumber = (dateString) => {
    const date = new Date(dateString);
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // ضبط ليبدأ الأسبوع من السبت
    const offset = (firstDayOfMonth.getDay() + 1) % 7; // السبت = 0
    const dayOfMonth = date.getDate();
    return Math.floor((dayOfMonth + offset - 1) / 7) + 1;
  };
  
  const displayVacationsTree = () => {
    const treeContainer = document.getElementById("vacationsTree");
    if (!treeContainer) return;
  
    // ترتيب الإجازات حسب السنة والشهر والأسبوع
    const grouped = {};
    holidays.forEach(h => {
      const [year, month, day] = h.date.split("-");
      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = {};
      
      const weekNumber = getWeekNumber(h.date);
      if (!grouped[year][month][weekNumber]) grouped[year][month][weekNumber] = [];
      
      grouped[year][month][weekNumber].push({ day, reason: h.reason });
    });
  
    // توليد Accordion للسنة والشهر والأسبوع
    let html = `<div class="accordion" id="vacationAccordion">`;
    Object.keys(grouped).sort().forEach((year, yIndex) => {
      html += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="heading${yIndex}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${yIndex}">
              ${year}
            </button>
          </h2>
          <div id="collapse${yIndex}" class="accordion-collapse collapse">
            <div class="accordion-body">
              <div class="accordion" id="yearAccordion${yIndex}">
      `;
      Object.keys(grouped[year]).sort().forEach((month, mIndex) => {
        const monthNum = parseInt(month, 10) - 1;
        const monthName = monthNames[monthNum] || `Month ${month}`;
        const weeks = Object.keys(grouped[year][month]).length;
  
        html += `
          <div class="accordion-item">
            <h2 class="accordion-header" id="heading${yIndex}-${mIndex}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${yIndex}-${mIndex}">
                ${monthName} (${weeks} weeks)
              </button>
            </h2>
            <div id="collapse${yIndex}-${mIndex}" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="accordion" id="monthAccordion${yIndex}-${mIndex}">
        `;
        Object.keys(grouped[year][month]).sort((a, b) => a - b).forEach((weekNum, wIndex) => {
          const daysCount = grouped[year][month][weekNum].length;
          html += `
            <div class="accordion-item">
              <h2 class="accordion-header" id="heading${yIndex}-${mIndex}-${wIndex}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${yIndex}-${mIndex}-${wIndex}">
                  Week ${weekNum} (${daysCount} days)
                </button>
              </h2>
              <div id="collapse${yIndex}-${mIndex}-${wIndex}" class="accordion-collapse collapse">
                <div class="accordion-body">
                  <ul class="list-group">
          `;
          grouped[year][month][weekNum].sort((a, b) => a.day - b.day).forEach(item => {
            html += `<li class="list-group-item">${item.day} - ${item.reason}</li>`;
          });
          html += `
                  </ul>
                </div>
              </div>
            </div>
          `;
        });
        html += `
                </div>
              </div>
            </div>
          </div>
        `;
      });
      html += `
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  
    treeContainer.innerHTML = html;
  };
  

  /* ==================[ Functions ]================== */
  const calculateEndDate = () => {
    if (!startDateInput.value || !numberOfDaysInput.value) {
      showToast("⚠ Please fill start date and duration!", "danger");
      return;
    }

    let startDate = new Date(startDateInput.value);
    let numberOfDays = parseInt(numberOfDaysInput.value);
    let endDate = new Date(startDate);
    let skippedDates = [];
    numberOfDays--;

    while (numberOfDays > 0) {
      endDate.setDate(endDate.getDate() + 1);
      const formattedDate = endDate.toISOString().split('T')[0];
      if (endDate.getDay() !== 5 && !holidays.some(d => d.date === formattedDate)) {
        numberOfDays--;
      } else {
        skippedDates.push({ date: formattedDate, reason: holidays.find(d => d.date === formattedDate)?.reason || "Friday" });
      }
    }

    endDateInput.value = endDate.toISOString().split('T')[0];

    // حفظ النتائج
    skippedDatesGlobal = skippedDates;

    // تحديث الجدول في المودال
    skippedTableBody.innerHTML = skippedDatesGlobal.length > 0
      ? skippedDatesGlobal.map(d => `<tr><td>${d.date}</td><td>${d.reason}</td></tr>`).join('')
      : `<tr><td colspan="2" class="text-muted">No skipped dates</td></tr>`;

    // إظهار Toast مع زرار View Details
    skippedToastBody.textContent = `✅ Calculation done! Skipped ${skippedDates.length} days.`;
    new bootstrap.Toast(skippedToastEl).show();
  };

  const calculateDateDiff = () => {
    if (!startDateDiff.value || !endDateDiff.value) {
      showToast("⚠ Please fill start and end date!", "success");
      return;
    }
    numberOfDaysDiff.value = Math.floor((new Date(endDateDiff.value) - new Date(startDateDiff.value)) / (1000 * 60 * 60 * 24));
    showToast("✅ Date difference calculated!", "success");
  };

  const addHoliday = () => {
    const reason = document.getElementById("addReason").value.trim();
    const date = document.getElementById("addDate").value.trim();
    if (!reason || !date) {
      showToast("⚠ Please fill both date and reason!", "success");
      return;
    }
    holidays.push({ reason, date });
    saveHolidays();
    displayHolidays();
    showToast("✅ Holiday added successfully!", "succsess");
  };

  window.editHoliday = (index) => {
    const reason = prompt("Enter a new reason", holidays[index].reason);
    const date = prompt("Enter a new date (Year-Month-Day)", holidays[index].date);
    if (reason && date) {
      holidays[index] = { reason, date };
      saveHolidays();
      displayHolidays();
      showToast("✅ Holiday updated!", "success");
    }
  };

  window.deleteHoliday = (index) => {
    holidays.splice(index, 1);
    saveHolidays();
    displayHolidays();
    showToast("✅ Holiday deleted!", "success");
  };

  /* ==================[ Import/Export ]================== */
  exportBtn?.addEventListener("click", () => {
    let ws = XLSX.utils.json_to_sheet(holidays);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vacations");
    XLSX.writeFile(wb, "vacations_list.xlsx");
    showToast("✅ Export completed!", "success");
  });

  importInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !confirm("Are you sure you want to import this file?")) return;
    
    let reader = new FileReader();
    reader.onload = (event) => {
      let workbook = XLSX.read(new Uint8Array(event.target.result), { type: "array" });
      let sheetName = workbook.SheetNames[0];
      let firstSheet = workbook.Sheets[sheetName];
      let importedData = XLSX.utils.sheet_to_json(firstSheet); // بيجيب Array of Objects
      
      let addedCount = 0, skippedCount = 0;

      importedData.forEach(row => {
        let reason = row.reason || row.Reason || row["REASON"] || "";
        let dateVal = row.date || row.Date || row["DATE"] || "";

        let date = isNaN(dateVal) ? dateVal : excelDateToJSDate(dateVal);

        if (reason && date && !holidays.some(h => h.date === date && h.reason === reason)) {
          holidays.push({ reason, date });
          addedCount++;
        } else {
          skippedCount++;
        }
      });

      saveHolidays();
      displayHolidays();
      showToast(`✅ Import completed! Added: ${addedCount} | Skipped: ${skippedCount}`, "success");
    };
    reader.readAsArrayBuffer(file);
  });

  /* ==================[ Event Listeners ]================== */
  calculateBtn?.addEventListener('click', calculateEndDate);
  calculateDiffBtn?.addEventListener('click', calculateDateDiff);
  addHolidayBtn?.addEventListener('click', addHoliday);

  // زرار View Details في التوست
  viewSkippedBtn?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('skippedModal'));
    modal.show();
  });

  /* ==================[ Init ]================== */
  displayHolidays();
  displayVacationsTree();

});
