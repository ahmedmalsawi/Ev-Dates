document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'holidays_v2';
  const LEGACY_KEY = 'holidays';
  const YEAR_START = 2020;
  const YEAR_END = 2035;

  /* ==================[ Elements ]================== */
  const yearSelect = document.getElementById('year-select');
  const exportYearLabel = document.getElementById('export-year-label');
  const calendarYearLabel = document.getElementById('calendar-year-label');
  const headerSubtitle = document.getElementById('header-subtitle');
  const tabHolidays = document.getElementById('tab-holidays');
  const tabDelays = document.getElementById('tab-delays');
  const holidayCalendarList = document.getElementById('holiday-calendar-list');
  const upcomingHolidaysEl = document.getElementById('upcoming-holidays');
  const appToastEl = document.getElementById('appToast');
  const appToastBody = document.getElementById('appToastBody');

  const contractDateInput = document.getElementById('contract-date');
  const contractDurationInput = document.getElementById('contract-duration');
  const actualWorkOrderInput = document.getElementById('actual-work-order-date');
  const actualPaymentInput = document.getElementById('actual-payment-date');
  const calculateContractDelayBtn = document.getElementById('calculate-contract-delay');
  const repGraceValueEl = document.getElementById('rep-grace-value');
  const payGraceValueEl = document.getElementById('pay-grace-value');
  const payGraceModeLabelEl = document.getElementById('pay-grace-mode-label');
  const payGraceChoiceEl = document.getElementById('pay-grace-choice');
  const shortContractWarning = document.getElementById('short-contract-warning');
  const contractDelayResultsEl = document.getElementById('contract-delay-results');
  const installSuggestionCard = document.getElementById('install-suggestion-card');
  const readyMessageEl = document.getElementById('ready-message');

  let holidays = [];
  let selectedYear = new Date().getFullYear();
  if (selectedYear < YEAR_START || selectedYear > YEAR_END) selectedYear = 2026;
  let dateCalcMode = 'working';
  let holidayModal = null;
  let dateCalcModal = null;
  let lastReadyMessage = '';

  /* ==================[ Seed data: approximate Islamic + national ]================== */
  // Eid Al-Fitr start (approx), Eid Al-Adha start (approx) — editable via UI
  const EID_FITR = {
    2020: '2020-05-24', 2021: '2021-05-13', 2022: '2022-05-02', 2023: '2023-04-21',
    2024: '2024-04-10', 2025: '2025-03-30', 2026: '2026-03-20', 2027: '2027-03-10',
    2028: '2028-02-27', 2029: '2029-02-15', 2030: '2030-02-05', 2031: '2031-01-25',
    2032: '2032-01-15', 2033: '2033-01-03', 2034: '2034-12-12', 2035: '2035-12-01'
  };
  const EID_ADHA = {
    2020: '2020-07-31', 2021: '2021-07-20', 2022: '2022-07-09', 2023: '2023-06-28',
    2024: '2024-06-16', 2025: '2025-06-06', 2026: '2026-05-27', 2027: '2027-05-17',
    2028: '2028-05-05', 2029: '2029-04-24', 2030: '2030-04-14', 2031: '2031-04-03',
    2032: '2032-03-22', 2033: '2033-03-12', 2034: '2034-02-28', 2035: '2035-02-18'
  };

  const TYPE_LABEL = { religious: 'ديني', national: 'وطني', international: 'دولي' };
  const MONTH_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  /* ==================[ Utils ]================== */
  const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const showToast = (message, type = 'dark') => {
    if (!appToastEl || !appToastBody) return;
    appToastBody.textContent = message;
    appToastEl.className = `toast align-items-center text-bg-${type} border-0 shadow`;
    bootstrap.Toast.getOrCreateInstance(appToastEl).show();
  };

  const parseLocalDate = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const addCalendarDays = (date, days) => {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + days);
    return result;
  };

  const calendarDaysBetween = (fromDate, toDate) => {
    const a = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const b = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return Math.round((b - a) / 86400000);
  };

  /** Arabic day grammar: 1 يوم واحد, 2 يومين, 3–10 أيام, 11+ يوم */
  const arabicDays = (n) => {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs === 0) return '0 يوم';
    if (abs === 1) return `${sign}يوم واحد`;
    if (abs === 2) return `${sign}يومين`;
    if (abs >= 3 && abs <= 10) return `${sign}${abs} أيام`;
    return `${sign}${abs} يوم`;
  };

  /** Compact result display matching screenshot style: "29 يوم" / "-174 يوم" */
  const formatElapsedLabel = (n) => `${n} يوم`;

  const formatDateAr = (iso) => {
    const d = parseLocalDate(iso);
    return `${d.getDate()} ${MONTH_AR[d.getMonth()]} ${d.getFullYear()}`;
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const rangeKey = (h) => `${h.name}|${h.startDate}|${h.endDate}`;

  const expandHolidayDates = (h) => {
    const dates = [];
    let cur = parseLocalDate(h.startDate);
    const end = parseLocalDate(h.endDate || h.startDate);
    while (cur <= end) {
      dates.push(formatLocalDate(cur));
      cur = addCalendarDays(cur, 1);
    }
    return dates;
  };

  const allHolidayDateSet = () => {
    const set = new Set();
    holidays.forEach(h => expandHolidayDates(h).forEach(d => set.add(d)));
    return set;
  };

  const isNonWorkingDay = (date, holidaySet) => {
    const formatted = formatLocalDate(date);
    return date.getDay() === 5 || holidaySet.has(formatted);
  };

  const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    return new Date(utc_days * 86400 * 1000).toISOString().split('T')[0];
  };

  const normalizeDateValue = (val) => {
    if (val == null || val === '') return '';
    if (typeof val === 'number') return excelDateToJSDate(val);
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return formatLocalDate(d);
    return s;
  };

  const mapType = (raw) => {
    const t = String(raw || '').toLowerCase();
    if (t.includes('relig') || t.includes('دين')) return 'religious';
    if (t.includes('inter') || t.includes('دول')) return 'international';
    return 'national';
  };

  /* ==================[ Official seed ]================== */
  const makeHoliday = (name, start, end, type, notes, official = true) => ({
    id: uid(),
    name,
    startDate: start,
    endDate: end || start,
    type,
    notes: notes || '',
    official: !!official,
    manual: false
  });

  const eidRange = (startIso, workingDays = 3) => {
    // Expand calendar days covering ~workingDays non-Friday days
    let start = parseLocalDate(startIso);
    let end = new Date(start);
    let counted = 0;
    while (counted < workingDays) {
      if (end.getDay() !== 5) counted++;
      if (counted < workingDays) end = addCalendarDays(end, 1);
    }
    return { start: formatLocalDate(start), end: formatLocalDate(end) };
  };

  const buildOfficialHolidays = () => {
    const list = [];
    for (let y = YEAR_START; y <= YEAR_END; y++) {
      list.push(makeHoliday(
        'Founding Day',
        `${y}-02-22`,
        `${y}-02-22`,
        'national',
        'Saudi Founding Day, commemorating the founding of the first Saudi state.'
      ));
      list.push(makeHoliday(
        'Saudi National Day',
        `${y}-09-23`,
        `${y}-09-23`,
        'national',
        'Saudi National Day.'
      ));

      if (EID_FITR[y]) {
        const r = eidRange(EID_FITR[y], 3);
        list.push(makeHoliday(
          'Eid Al-Fitr',
          r.start,
          r.end,
          'religious',
          '⚠️ تاريخ تقريبي حسب الرؤية الشرعية — 3 أيام عمل (الجمعة مستثناة).'
        ));
      }
      if (EID_ADHA[y]) {
        const r = eidRange(EID_ADHA[y], 4);
        list.push(makeHoliday(
          'Eid Al-Adha',
          r.start,
          r.end,
          'religious',
          '⚠️ تاريخ تقريبي حسب الرؤية الشرعية — يشمل يوم عرفة وأيام العيد.'
        ));
      }
    }
    return list;
  };

  const migrateLegacy = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      if (item.startDate && item.name) {
        return {
          id: item.id || uid(),
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate || item.startDate,
          type: item.type || 'national',
          notes: item.notes || '',
          official: !!item.official,
          manual: !!item.manual
        };
      }
      // legacy { reason, date }
      return {
        id: uid(),
        name: item.reason || 'إجازة',
        startDate: item.date,
        endDate: item.date,
        type: 'national',
        notes: '',
        official: false,
        manual: true
      };
    }).filter(h => h.startDate);
  };

  const saveHolidays = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));

  const loadHolidays = () => {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      holidays = migrateLegacy(JSON.parse(v2));
      return;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      holidays = migrateLegacy(JSON.parse(legacy));
      saveHolidays();
      return;
    }
    holidays = buildOfficialHolidays();
    saveHolidays();
  };

  /* ==================[ KPI / Views ]================== */
  const holidaysForYear = (year) =>
    holidays
      .filter(h => parseLocalDate(h.startDate).getFullYear() === year || parseLocalDate(h.endDate).getFullYear() === year)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const countFridaysInYear = (year) => {
    let count = 0;
    let d = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    while (d <= end) {
      if (d.getDay() === 5) count++;
      d = addCalendarDays(d, 1);
    }
    return count;
  };

  const countWorkingDaysInYear = (year) => {
    const holidaySet = new Set();
    holidaysForYear(year).forEach(h => {
      expandHolidayDates(h).forEach(iso => {
        if (parseLocalDate(iso).getFullYear() === year) holidaySet.add(iso);
      });
    });
    let working = 0;
    let d = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    while (d <= end) {
      if (!isNonWorkingDay(d, holidaySet)) working++;
      d = addCalendarDays(d, 1);
    }
    return working;
  };

  const updateKPIs = () => {
    const list = holidaysForYear(selectedYear);
    document.getElementById('kpi-total').textContent = list.length;
    document.getElementById('kpi-religious').textContent = list.filter(h => h.type === 'religious').length;
    document.getElementById('kpi-national').textContent = list.filter(h => h.type === 'national').length;
    document.getElementById('kpi-fridays').textContent = countFridaysInYear(selectedYear);
    document.getElementById('kpi-working').textContent = countWorkingDaysInYear(selectedYear);
  };

  const renderEidAlert = () => {
    const alertEl = document.getElementById('eid-alert');
    if (!alertEl) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = holidays
      .filter(h => h.type === 'religious')
      .map(h => ({ h, days: calendarDaysBetween(today, parseLocalDate(h.startDate)) }))
      .filter(x => x.days >= 0 && x.days <= 7)
      .sort((a, b) => a.days - b.days);

    if (!soon.length) {
      alertEl.classList.add('d-none');
      alertEl.innerHTML = '';
      return;
    }

    const items = soon.map(x =>
      `<strong>${escapeHtml(x.h.name)}</strong> خلال ${arabicDays(x.days)} (${formatDateAr(x.h.startDate)})`
    ).join(' — ');
    alertEl.classList.remove('d-none');
    alertEl.innerHTML = `<i class="fa-solid fa-moon"></i><div>تنبيه عيد قريب (تحقق من الإعلان الرسمي): ${items}</div>`;
  };

  const renderHolidayCalendar = () => {
    const list = holidaysForYear(selectedYear);
    const countEl = document.getElementById('calendar-count');
    if (countEl) countEl.textContent = String(list.length);

    if (!list.length) {
      holidayCalendarList.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-xmark"></i>
          <p>لا توجد إجازات لهذه السنة.</p>
          <button type="button" class="btn btn-sm btn-fill-years" id="btn-fill-years-empty">ملء السنوات الرسمية</button>
        </div>`;
      document.getElementById('btn-fill-years-empty')?.addEventListener('click', fillAllYears);
      return;
    }
    holidayCalendarList.innerHTML = list.map(h => {
      const same = h.startDate === h.endDate;
      const dateLabel = same
        ? formatDateAr(h.startDate)
        : `${formatDateAr(h.startDate)} — ${formatDateAr(h.endDate)}`;
      const manualBadge = h.manual ? '<span class="type-pill" style="background:#ffedd5;color:#9a3412">يدوي</span>' : '';
      return `
        <div class="holiday-item">
          <span class="dot dot-${h.type}"></span>
          <div class="holiday-meta">
            <div class="holiday-name">${escapeHtml(h.name)}</div>
            <div class="holiday-dates">${dateLabel}</div>
            ${h.notes ? `<div class="holiday-notes">${escapeHtml(h.notes)}</div>` : ''}
          </div>
          <div>
            <span class="type-pill">${TYPE_LABEL[h.type] || h.type}</span>
            ${manualBadge}
          </div>
          <div class="holiday-actions">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-edit="${h.id}" title="تعديل" aria-label="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${h.id}" title="حذف" aria-label="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  };

  const renderUpcoming = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = holidays
      .map(h => ({ h, start: parseLocalDate(h.startDate) }))
      .filter(x => x.start >= today)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);

    if (!upcoming.length) {
      upcomingHolidaysEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-hourglass-half"></i>
          <p>لا توجد إجازات قادمة.</p>
        </div>`;
      return;
    }

    upcomingHolidaysEl.innerHTML = upcoming.map(({ h, start }) => {
      const days = calendarDaysBetween(today, start);
      const soonClass = days <= 7 ? 'is-soon' : '';
      return `
        <div class="upcoming-card type-${h.type}">
          <span class="days-badge ${soonClass}">${arabicDays(days)}</span>
          <div class="holiday-name">${escapeHtml(h.name)}</div>
          <div class="holiday-dates">${formatDateAr(h.startDate)}</div>
          ${h.notes ? `<div class="holiday-notes">${escapeHtml(h.notes)}</div>` : ''}
        </div>`;
    }).join('');
  };

  const refreshHolidayViews = () => {
    if (calendarYearLabel) calendarYearLabel.textContent = String(selectedYear);
    if (exportYearLabel) exportYearLabel.textContent = String(selectedYear);
    updateKPIs();
    renderHolidayCalendar();
    renderUpcoming();
    renderEidAlert();
  };

  /* ==================[ Holiday CRUD / ops ]================== */
  const openHolidayModal = (holiday = null) => {
    document.getElementById('holidayModalTitle').textContent = holiday ? 'تعديل إجازة' : 'إضافة إجازة';
    document.getElementById('holiday-edit-id').value = holiday?.id || '';
    document.getElementById('holiday-name').value = holiday?.name || '';
    document.getElementById('holiday-start').value = holiday?.startDate || '';
    document.getElementById('holiday-end').value = holiday?.endDate || holiday?.startDate || '';
    document.getElementById('holiday-type').value = holiday?.type || 'national';
    document.getElementById('holiday-notes').value = holiday?.notes || '';
    holidayModal.show();
  };

  const saveHolidayFromModal = () => {
    const id = document.getElementById('holiday-edit-id').value;
    const name = document.getElementById('holiday-name').value.trim();
    const startDate = document.getElementById('holiday-start').value;
    let endDate = document.getElementById('holiday-end').value || startDate;
    const type = document.getElementById('holiday-type').value;
    const notes = document.getElementById('holiday-notes').value.trim();

    if (!name || !startDate) {
      showToast('⚠ يرجى تعبئة الاسم وتاريخ البداية', 'danger');
      return;
    }
    if (endDate < startDate) endDate = startDate;

    const duplicate = holidays.some(h =>
      h.id !== id && h.name === name && h.startDate === startDate && h.endDate === endDate
    );
    if (duplicate) {
      showToast('⚠ هذه الإجازة موجودة مسبقاً', 'danger');
      return;
    }

    if (id) {
      const idx = holidays.findIndex(h => h.id === id);
      if (idx >= 0) {
        holidays[idx] = { ...holidays[idx], name, startDate, endDate, type, notes, manual: true };
      }
    } else {
      holidays.push({ id: uid(), name, startDate, endDate, type, notes, official: false, manual: true });
    }
    saveHolidays();
    refreshHolidayViews();
    holidayModal.hide();
    showToast('✅ تم حفظ الإجازة', 'success');
  };

  const deleteHoliday = (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة؟')) return;
    holidays = holidays.filter(h => h.id !== id);
    saveHolidays();
    refreshHolidayViews();
    showToast('✅ تم الحذف', 'success');
  };

  const fillAllYears = () => {
    const official = buildOfficialHolidays();
    const manuals = holidays.filter(h => h.manual);
    const officialKeys = new Set(official.map(rangeKey));
    // Keep manuals that aren't exact duplicates of fresh official
    const keptManual = manuals.filter(h => !officialKeys.has(rangeKey(h)));
    holidays = [...official, ...keptManual];
    saveHolidays();
    refreshHolidayViews();
    showToast('✅ تم ملء الإجازات الرسمية 2020–2035', 'success');
  };

  const refreshOfficialDetails = () => {
    const manuals = holidays.filter(h => h.manual);
    const official = buildOfficialHolidays();
    // Drop previous non-manual official, keep manuals
    holidays = [...official, ...manuals];
    // Dedupe manuals against official
    const seen = new Set();
    holidays = holidays.filter(h => {
      const k = rangeKey(h);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    saveHolidays();
    refreshHolidayViews();
    showToast('✅ تم تحديث التفاصيل الرسمية (مع الإبقاء على التعديلات اليدوية)', 'success');
  };

  const dedupeHolidays = () => {
    const seen = new Set();
    const before = holidays.length;
    holidays = holidays.filter(h => {
      const k = rangeKey(h);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    saveHolidays();
    refreshHolidayViews();
    showToast(`✅ تم حذف ${before - holidays.length} تكرار`, 'success');
  };

  const exportHolidays = (yearFilter = null) => {
    const rows = (yearFilter == null ? holidays : holidaysForYear(yearFilter)).map(h => ({
      Name: h.name,
      'Start Date': h.startDate,
      'End Date': h.endDate,
      Type: h.type,
      Notes: h.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Holidays');
    const name = yearFilter == null ? 'holidays_2020_2035.xlsx' : `holidays_${yearFilter}.xlsx`;
    XLSX.writeFile(wb, name);
    showToast('✅ تم التصدير', 'success');
  };

  const importHolidays = (file) => {
    if (!file || !confirm('استيراد الملف؟ سيتم دمج الإجازات الجديدة.')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      let added = 0;
      let skipped = 0;
      const existing = new Set(holidays.map(rangeKey));
      data.forEach(row => {
        const name = row.Name || row.name || row['الاسم'] || '';
        const startDate = normalizeDateValue(row['Start Date'] || row.startDate || row.Date || row.date);
        const endDate = normalizeDateValue(row['End Date'] || row.endDate || startDate) || startDate;
        const type = mapType(row.Type || row.type || row['النوع']);
        const notes = row.Notes || row.notes || row['ملاحظات'] || '';
        if (!name || !startDate) { skipped++; return; }
        const item = { id: uid(), name: String(name).trim(), startDate, endDate, type, notes: String(notes), official: false, manual: true };
        const k = rangeKey(item);
        if (existing.has(k)) { skipped++; return; }
        existing.add(k);
        holidays.push(item);
        added++;
      });
      saveHolidays();
      refreshHolidayViews();
      showToast(`✅ استيراد: أُضيف ${added} | تُخطي ${skipped}`, 'success');
    };
    reader.readAsArrayBuffer(file);
  };

  /* ==================[ Grace + Delay ]================== */
  const getRepGrace = (duration) => {
    if (duration >= 60) return 5;
    if (duration >= 50) return 4;
    if (duration >= 35) return 3;
    return 0;
  };

  const getPaymentGraceMode = (duration) => {
    if (duration >= 45) return { mode: 'fixed', value: 21, label: 'تلقائي' };
    if (duration >= 31) return { mode: 'choice', options: [21, 3], label: 'اختيار' };
    return { mode: 'fixed', value: 0, label: 'إجباري — قاعدة خاصة' };
  };

  const getSelectedPayGrace = (duration) => {
    const mode = getPaymentGraceMode(duration);
    if (mode.mode === 'fixed') return mode.value;
    const selected = document.querySelector('input[name="pay-grace-option"]:checked');
    return selected ? parseInt(selected.value, 10) : 21;
  };

  const getRepRuleKey = (duration) => {
    if (duration <= 30) return 'le30';
    if (duration <= 34) return '31-34';
    if (duration <= 49) return '35-49';
    if (duration <= 59) return '50-59';
    return 'ge60';
  };

  const getPayRuleKey = (duration) => {
    if (duration <= 30) return 'le30';
    if (duration <= 44) return '31-44';
    return 'ge45';
  };

  const highlightRules = (duration) => {
    const valid = !isNaN(duration) && duration >= 1;
    document.querySelectorAll('#rep-rules-list li').forEach(li => {
      li.classList.toggle('is-active', valid && li.dataset.repRule === getRepRuleKey(duration));
    });
    document.querySelectorAll('#pay-rules-list li').forEach(li => {
      li.classList.toggle('is-active', valid && li.dataset.payRule === getPayRuleKey(duration));
    });
  };

  const updateGraceUI = () => {
    const raw = contractDurationInput?.value;
    const duration = parseInt(raw, 10);
    if (!raw || isNaN(duration) || duration < 1) {
      if (repGraceValueEl) repGraceValueEl.textContent = '—';
      if (payGraceValueEl) payGraceValueEl.textContent = '—';
      if (payGraceModeLabelEl) {
        payGraceModeLabelEl.textContent = '—';
        payGraceModeLabelEl.className = 'badge bg-secondary';
      }
      payGraceChoiceEl?.classList.add('d-none');
      shortContractWarning?.classList.add('d-none');
      highlightRules(NaN);
      return;
    }

    shortContractWarning?.classList.toggle('d-none', duration > 30);

    const repGrace = getRepGrace(duration);
    const payMode = getPaymentGraceMode(duration);
    if (repGraceValueEl) repGraceValueEl.textContent = arabicDays(repGrace);

    if (payMode.mode === 'choice') {
      payGraceChoiceEl?.classList.remove('d-none');
      const selected = getSelectedPayGrace(duration);
      if (payGraceValueEl) payGraceValueEl.textContent = arabicDays(selected);
      if (payGraceModeLabelEl) {
        payGraceModeLabelEl.textContent = payMode.label;
        payGraceModeLabelEl.className = 'badge bg-warning text-dark';
      }
    } else {
      payGraceChoiceEl?.classList.add('d-none');
      if (payGraceValueEl) payGraceValueEl.textContent = arabicDays(payMode.value);
      if (payGraceModeLabelEl) {
        payGraceModeLabelEl.textContent = payMode.label;
        payGraceModeLabelEl.className = payMode.value === 0 ? 'badge bg-danger' : 'badge bg-success';
      }
    }
    highlightRules(duration);
  };

  const fillResultCard = (cardEl, elapsedEl, subEl, elapsed, grace) => {
    const penalty = Math.max(0, elapsed - grace);
    const onTime = elapsed <= grace;
    elapsedEl.textContent = formatElapsedLabel(elapsed);
    if (onTime) {
      subEl.textContent = `ضمن فترة السماح (${arabicDays(grace)}) ✅`;
      cardEl.classList.add('is-ok');
      cardEl.classList.remove('is-late');
    } else {
      subEl.textContent = `التأخير: ${arabicDays(penalty)} (بعد خصم ${arabicDays(grace)} السماح)`;
      cardEl.classList.add('is-late');
      cardEl.classList.remove('is-ok');
    }
    return { penalty, onTime };
  };

  const suggestInstallation = (duration, workOrderDate, paymentDate) => {
    if (duration < 35) return null;
    const later = workOrderDate > paymentDate ? workOrderDate : paymentDate;
    const laterIso = formatLocalDate(later);
    if (duration >= 45) {
      const offset = duration - 21;
      return {
        offset,
        date: addCalendarDays(later, offset),
        laterIso,
        note: `(التاريخ الأخير ${laterIso} + ${offset} يوم — عقد ≥ 45 يوم)`
      };
    }
    return {
      offset: duration,
      date: addCalendarDays(later, duration),
      laterIso,
      note: `(التاريخ الأخير ${laterIso} + ${duration} يوم — عقد أقل من 45 يوم)`
    };
  };

  const buildReadyMessage = ({
    contractDate, duration, payElapsed, payPenalty, payGrace, paymentIso,
    woElapsed, woPenalty, repGrace, woIso
  }) => {
    const contractIso = formatLocalDate(contractDate);
    const sep = '====================================================';

    const woDelayLine = woPenalty > 0
      ? `التأخير ${formatElapsedLabel(woPenalty)} (بعد خصم ${arabicDays(repGrace)} السماح) للاعتماد النهائي`
      : `لا تأخير (ضمن فترة السماح ${arabicDays(repGrace)}) للاعتماد النهائي`;

    const payDelayLine = payPenalty > 0
      ? `${formatElapsedLabel(payPenalty)} (بعد خصم ${arabicDays(payGrace)} السماح) للسداد الكامل ، مدة العقد ${duration} يوم`
      : `لا تأخير (ضمن فترة السماح ${arabicDays(payGrace)}) للسداد الكامل ، مدة العقد ${duration} يوم`;

    return [
      `يوجد فرق ${formatElapsedLabel(woElapsed)} لرفع امر الشغل واعتماد المقاسات النهائية من تاريخ العقد`,
      '',
      `من ${contractIso} الى ${woIso}`,
      '',
      sep,
      '',
      `يوجد فرق ${formatElapsedLabel(payElapsed)} لسداد الدفعة النهائية من تاريخ العقد`,
      '',
      `من ${contractIso} الى ${paymentIso}`,
      '',
      sep,
      '',
      woDelayLine,
      '',
      payDelayLine,
      '',
      'لم يتم احتساب كامل التأخيرات على العميل'
    ].join('\n');
  };

  const clearFieldErrors = () => {
    [contractDateInput, contractDurationInput, actualWorkOrderInput, actualPaymentInput]
      .forEach(el => el?.classList.remove('is-invalid'));
  };

  const markInvalid = (el) => el?.classList.add('is-invalid');

  const calculateContractDelays = () => {
    clearFieldErrors();
    const contractDateVal = contractDateInput?.value;
    const durationVal = contractDurationInput?.value;
    const actualWOVal = actualWorkOrderInput?.value;
    const actualPayVal = actualPaymentInput?.value;

    let hasError = false;
    if (!contractDateVal) { markInvalid(contractDateInput); hasError = true; }
    if (!durationVal) { markInvalid(contractDurationInput); hasError = true; }
    if (!actualWOVal) { markInvalid(actualWorkOrderInput); hasError = true; }
    if (!actualPayVal) { markInvalid(actualPaymentInput); hasError = true; }
    if (hasError) {
      showToast('⚠ يرجى تعبئة جميع بيانات العقد!', 'danger');
      return;
    }

    const duration = parseInt(durationVal, 10);
    if (isNaN(duration) || duration < 1) {
      markInvalid(contractDurationInput);
      showToast('⚠ مدة العقد يجب أن تكون رقماً صحيحاً أكبر من صفر!', 'danger');
      return;
    }

    const contractDate = parseLocalDate(contractDateVal);
    const actualWO = parseLocalDate(actualWOVal);
    const actualPay = parseLocalDate(actualPayVal);
    const repGrace = getRepGrace(duration);
    const payGrace = getSelectedPayGrace(duration);

    const woElapsed = calendarDaysBetween(contractDate, actualWO);
    const payElapsed = calendarDaysBetween(contractDate, actualPay);

    const wo = fillResultCard(
      document.getElementById('result-wo-card'),
      document.getElementById('result-wo-elapsed'),
      document.getElementById('result-wo-sub'),
      woElapsed,
      repGrace
    );
    const pay = fillResultCard(
      document.getElementById('result-pay-card'),
      document.getElementById('result-pay-elapsed'),
      document.getElementById('result-pay-sub'),
      payElapsed,
      payGrace
    );

    const install = suggestInstallation(duration, actualWO, actualPay);
    if (install) {
      installSuggestionCard.classList.remove('d-none');
      document.getElementById('result-install-offset').textContent = `${install.offset} يوم عادي`;
      document.getElementById('result-install-date').textContent = `(${formatLocalDate(install.date)})`;
      document.getElementById('result-install-note').textContent = install.note;
    } else {
      installSuggestionCard.classList.add('d-none');
    }

    lastReadyMessage = buildReadyMessage({
      contractDate,
      duration,
      payElapsed,
      payPenalty: pay.penalty,
      payGrace,
      paymentIso: formatLocalDate(actualPay),
      woElapsed,
      woPenalty: wo.penalty,
      repGrace,
      woIso: formatLocalDate(actualWO)
    });
    readyMessageEl.textContent = lastReadyMessage;

    contractDelayResultsEl.classList.remove('d-none');
    updateGraceUI();
    showToast('✅ تم حساب التأخيرات بنجاح!', 'success');
    contractDelayResultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyReadyMessage = async () => {
    if (!lastReadyMessage) {
      showToast('⚠ لا توجد رسالة للنسخ', 'danger');
      return;
    }
    const btn = document.getElementById('btn-copy-message');
    try {
      await navigator.clipboard.writeText(lastReadyMessage);
      btn?.classList.add('copied');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ';
      showToast('✅ تم نسخ الرسالة', 'success');
      setTimeout(() => {
        btn?.classList.remove('copied');
        if (btn) btn.innerHTML = '<i class="fa-regular fa-copy"></i> نسخ';
      }, 1800);
    } catch {
      showToast('⚠ تعذر النسخ', 'danger');
    }
  };

  /* ==================[ Date calculator modal ]================== */
  const setDateCalcMode = (mode) => {
    dateCalcMode = mode;
    document.querySelectorAll('.date-calc-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    document.getElementById('calc-duration-label').textContent =
      mode === 'working' ? 'عدد أيام العمل' : 'عدد الأيام التقويمية';
  };

  const runDateCalc = () => {
    const startVal = document.getElementById('calc-start-date').value;
    const durationVal = document.getElementById('calc-duration').value;
    if (!startVal || !durationVal) {
      showToast('⚠ يرجى تعبئة تاريخ البداية والمدة', 'danger');
      return;
    }
    let remaining = parseInt(durationVal, 10);
    if (isNaN(remaining) || remaining < 1) {
      showToast('⚠ المدة غير صحيحة', 'danger');
      return;
    }

    const start = parseLocalDate(startVal);
    let end = new Date(start);
    const skipped = [];
    const holidaySet = allHolidayDateSet();

    if (dateCalcMode === 'calendar') {
      end = addCalendarDays(start, remaining - 1);
    } else {
      remaining--; // start counts as day 1
      while (remaining > 0) {
        end = addCalendarDays(end, 1);
        const iso = formatLocalDate(end);
        if (end.getDay() === 5) {
          skipped.push({ date: iso, reason: 'جمعة' });
        } else if (holidaySet.has(iso)) {
          const h = holidays.find(x => expandHolidayDates(x).includes(iso));
          skipped.push({ date: iso, reason: h?.name || 'إجازة' });
        } else {
          remaining--;
        }
      }
    }

    document.getElementById('calc-result').classList.remove('d-none');
    document.getElementById('calc-end-date').textContent = formatLocalDate(end);
    const skippedCountEl = document.getElementById('calc-skipped-count');
    const wrap = document.getElementById('calc-skipped-wrap');
    const list = document.getElementById('calc-skipped-list');
    if (dateCalcMode === 'working') {
      if (skippedCountEl) skippedCountEl.textContent = `تم استثناء ${arabicDays(skipped.length)}`;
      if (skipped.length) {
        wrap.classList.remove('d-none');
        list.innerHTML = skipped.map(s => `<li class="list-group-item">${s.date} — ${escapeHtml(s.reason)}</li>`).join('');
      } else {
        wrap.classList.add('d-none');
        list.innerHTML = '';
      }
    } else {
      if (skippedCountEl) skippedCountEl.textContent = 'حساب تقويمي (بدون استثناءات)';
      wrap.classList.add('d-none');
      list.innerHTML = '';
    }
  };

  /* ==================[ Tabs / Year ]================== */
  const switchTab = (tab) => {
    document.querySelectorAll('.app-tab').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabHolidays.classList.toggle('d-none', tab !== 'holidays');
    tabDelays.classList.toggle('d-none', tab !== 'delays');
    document.getElementById('toolbar-holidays')?.classList.toggle('d-none', tab !== 'holidays');
    if (headerSubtitle) {
      headerSubtitle.textContent = tab === 'holidays'
        ? 'الإجازات الرسمية — إدارة العطل وحساب أيام العمل'
        : 'حساب تأخيرات العقود — السماح والعقوبات وموعد التركيب';
    }
  };

  const initYearSelect = () => {
    yearSelect.innerHTML = '';
    for (let y = YEAR_START; y <= YEAR_END; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      if (y === selectedYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  };

  /* ==================[ Events ]================== */
  document.querySelectorAll('.app-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  yearSelect?.addEventListener('change', () => {
    selectedYear = parseInt(yearSelect.value, 10);
    refreshHolidayViews();
  });

  document.getElementById('btn-fill-years')?.addEventListener('click', fillAllYears);
  document.getElementById('btn-export-year')?.addEventListener('click', () => exportHolidays(selectedYear));
  document.getElementById('btn-export-all')?.addEventListener('click', () => exportHolidays(null));
  document.getElementById('btn-refresh-official')?.addEventListener('click', refreshOfficialDetails);
  document.getElementById('btn-dedupe')?.addEventListener('click', dedupeHolidays);
  document.getElementById('btn-add-holiday')?.addEventListener('click', () => openHolidayModal());
  document.getElementById('btn-save-holiday')?.addEventListener('click', saveHolidayFromModal);
  document.getElementById('importExcel')?.addEventListener('change', (e) => {
    importHolidays(e.target.files[0]);
    e.target.value = '';
  });

  holidayCalendarList?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) {
      const h = holidays.find(x => x.id === editBtn.dataset.edit);
      if (h) openHolidayModal(h);
    }
    if (delBtn) deleteHoliday(delBtn.dataset.delete);
  });

  document.getElementById('btn-open-date-calc')?.addEventListener('click', () => {
    document.getElementById('calc-result').classList.add('d-none');
    dateCalcModal.show();
  });
  document.querySelectorAll('.date-calc-mode').forEach(btn => {
    btn.addEventListener('click', () => setDateCalcMode(btn.dataset.mode));
  });
  document.getElementById('btn-run-date-calc')?.addEventListener('click', runDateCalc);

  calculateContractDelayBtn?.addEventListener('click', calculateContractDelays);
  contractDurationInput?.addEventListener('input', updateGraceUI);
  [contractDateInput, contractDurationInput, actualWorkOrderInput, actualPaymentInput].forEach(el => {
    el?.addEventListener('input', () => el.classList.remove('is-invalid'));
  });
  document.querySelectorAll('input[name="pay-grace-option"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateGraceUI();
      if (!contractDelayResultsEl?.classList.contains('d-none')) {
        calculateContractDelays();
      }
    });
  });
  document.getElementById('btn-copy-message')?.addEventListener('click', copyReadyMessage);

  // Enter key submits delay form
  document.getElementById('tab-delays')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault();
      calculateContractDelays();
    }
  });

  /* ==================[ Init ]================== */
  holidayModal = new bootstrap.Modal(document.getElementById('holidayModal'));
  dateCalcModal = new bootstrap.Modal(document.getElementById('dateCalcModal'));
  loadHolidays();
  initYearSelect();
  refreshHolidayViews();
  updateGraceUI();
  setDateCalcMode('working');
});
