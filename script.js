document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'holidays_v2';
  const LEGACY_KEY = 'holidays';
  const HISTORY_KEY = 'calc_history_v1';
  const BRANDING_KEY = 'branding_v1';
  const YEAR_START = 2020;
  const YEAR_END = 2035;
  const HISTORY_LIMIT = 20;
  const DEFAULT_BRANDING = {
    companyName: 'فنون حواء للمطابخ',
    footer: 'قسم ادارة المواعيد',
    logoPath: 'assets/eves-arts-logo.png'
  };

  /* ==================[ Elements ]================== */
  const yearSelect = document.getElementById('year-select');
  const exportYearLabel = document.getElementById('export-year-label');
  const calendarYearLabel = document.getElementById('calendar-year-label');
  const headerSubtitle = document.getElementById('header-subtitle');
  const tabHolidays = document.getElementById('tab-holidays');
  const tabDelays = document.getElementById('tab-delays');
  const tabSettings = document.getElementById('tab-settings');
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
  let calcHistory = [];
  let branding = {
    companyName: DEFAULT_BRANDING.companyName,
    footer: DEFAULT_BRANDING.footer,
    logoDataUrl: ''
  };

  const defaultLogoSrc = () => {
    try {
      return new URL(DEFAULT_BRANDING.logoPath, window.location.href).href;
    } catch {
      return DEFAULT_BRANDING.logoPath;
    }
  };

  const getLogoSrc = () => branding.logoDataUrl || defaultLogoSrc();

  const applyLogoPreview = () => {
    const preview = document.getElementById('company-logo-preview');
    const img = document.getElementById('company-logo-img');
    if (!img || !preview) return;
    img.src = getLogoSrc();
    preview.classList.remove('d-none');
  };
  let selectedYear = new Date().getFullYear();
  if (selectedYear < YEAR_START || selectedYear > YEAR_END) selectedYear = 2026;
  let dateCalcMode = 'calendar';
  let dateCalcOp = 'count'; // count | end
  let holidayModal = null;
  let dateCalcModal = null;
  let lastReadyMessage = '';
  let lastCalcSnapshot = null;

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

  /** Always ensure official holidays exist for 2020–2035; keep manual entries. */
  const ensureOfficialPrefill = () => {
    const official = buildOfficialHolidays();
    const manuals = holidays.filter(h => h.manual);
    const officialKeys = new Set(official.map(rangeKey));
    const keptManual = manuals.filter(h => !officialKeys.has(rangeKey(h)));
    holidays = [...official, ...keptManual];
    saveHolidays();
  };

  const loadHolidays = () => {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      holidays = migrateLegacy(JSON.parse(v2));
    } else {
      const legacy = localStorage.getItem(LEGACY_KEY);
      holidays = legacy ? migrateLegacy(JSON.parse(legacy)) : [];
    }
    // Prefill / backfill official calendar through 2035 on every load
    ensureOfficialPrefill();
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

  const holidayItemHtml = (h) => {
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
  };

  const renderHolidayCalendar = () => {
    const search = (document.getElementById('holiday-search')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('holiday-type-filter')?.value || 'all';
    let list = holidaysForYear(selectedYear);
    if (typeFilter !== 'all') list = list.filter(h => h.type === typeFilter);
    if (search) list = list.filter(h => h.name.toLowerCase().includes(search) || (h.notes || '').toLowerCase().includes(search));

    const countEl = document.getElementById('calendar-count');
    if (countEl) countEl.textContent = String(list.length);

    if (!holidaysForYear(selectedYear).length) {
      holidayCalendarList.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-xmark"></i>
          <p>لا توجد إجازات لهذه السنة.</p>
          <button type="button" class="btn btn-sm btn-fill-years" id="btn-fill-years-empty">الذهاب للإعدادات</button>
        </div>`;
      document.getElementById('btn-fill-years-empty')?.addEventListener('click', () => switchTab('settings'));
      return;
    }

    if (!list.length) {
      holidayCalendarList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-filter"></i><p>لا نتائج مطابقة للبحث/التصفية.</p></div>`;
      return;
    }

    const byMonth = {};
    list.forEach(h => {
      const m = parseLocalDate(h.startDate).getMonth();
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(h);
    });

    holidayCalendarList.innerHTML = Object.keys(byMonth)
      .sort((a, b) => Number(a) - Number(b))
      .map(m => `
        <div class="month-group">
          <div class="month-group-title">${MONTH_AR[Number(m)]}</div>
          ${byMonth[m].map(holidayItemHtml).join('')}
        </div>`)
      .join('');
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
    ensureOfficialPrefill();
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

  const loadBranding = () => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(BRANDING_KEY) || '{}') || {};
    } catch {
      stored = {};
    }
    branding = {
      companyName: (stored.companyName || '').trim() || DEFAULT_BRANDING.companyName,
      footer: (stored.footer || '').trim() || DEFAULT_BRANDING.footer,
      logoDataUrl: stored.logoDataUrl || ''
    };
    // Seed defaults once if nothing was saved yet
    if (!localStorage.getItem(BRANDING_KEY)) {
      localStorage.setItem(BRANDING_KEY, JSON.stringify({
        companyName: branding.companyName,
        footer: branding.footer,
        logoDataUrl: ''
      }));
    }
    const nameEl = document.getElementById('company-name');
    const footerEl = document.getElementById('company-footer');
    if (nameEl) nameEl.value = branding.companyName;
    if (footerEl) footerEl.value = branding.footer;
    applyLogoPreview();
  };

  const saveBranding = () => {
    branding = {
      companyName: (document.getElementById('company-name')?.value || '').trim() || DEFAULT_BRANDING.companyName,
      footer: (document.getElementById('company-footer')?.value || '').trim() || DEFAULT_BRANDING.footer,
      logoDataUrl: branding.logoDataUrl || ''
    };
    localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
    const nameEl = document.getElementById('company-name');
    const footerEl = document.getElementById('company-footer');
    if (nameEl) nameEl.value = branding.companyName;
    if (footerEl) footerEl.value = branding.footer;
    applyLogoPreview();
    showToast('✅ تم حفظ هوية الشركة', 'success');
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

    const lines = [];
    if (branding.companyName) {
      lines.push(branding.companyName, '');
    }
    lines.push(
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
    );
    if (branding.footer) {
      lines.push('', branding.footer);
    }
    return lines.join('\n');
  };

  const loadHistory = () => {
    try {
      calcHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(calcHistory)) calcHistory = [];
    } catch {
      calcHistory = [];
    }
  };

  const saveHistoryStore = () => localStorage.setItem(HISTORY_KEY, JSON.stringify(calcHistory));

  const renderHistory = () => {
    const listEl = document.getElementById('calc-history-list');
    const emptyEl = document.getElementById('calc-history-empty');
    if (!listEl) return;
    if (!calcHistory.length) {
      listEl.innerHTML = '<p class="text-muted small mb-0" id="calc-history-empty">لا يوجد سجل بعد. نفّذ حساباً ليظهر هنا.</p>';
      return;
    }
    listEl.innerHTML = calcHistory.map(item => `
      <div class="history-item" data-history-id="${item.id}">
        <div class="history-meta">
          <div class="fw-bold">${escapeHtml(item.contractDate)} · مدة ${item.duration} يوم</div>
          <div class="small text-muted">أمر شغل: ${formatElapsedLabel(item.woElapsed)} | سداد: ${formatElapsedLabel(item.payElapsed)} · ${new Date(item.savedAt).toLocaleString('ar-SA')}</div>
        </div>
        <div class="history-actions">
          <button type="button" class="btn btn-sm btn-outline-primary" data-history-load="${item.id}" title="إعادة فتح">فتح</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-history-copy="${item.id}" title="نسخ">نسخ</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-history-delete="${item.id}" title="حذف">حذف</button>
        </div>
      </div>`).join('');
  };

  const pushHistory = (entry) => {
    calcHistory.unshift(entry);
    if (calcHistory.length > HISTORY_LIMIT) calcHistory = calcHistory.slice(0, HISTORY_LIMIT);
    saveHistoryStore();
    renderHistory();
  };

  const loadHistoryEntry = (id) => {
    const item = calcHistory.find(x => x.id === id);
    if (!item) return;
    if (contractDateInput) contractDateInput.value = item.contractDate;
    if (contractDurationInput) contractDurationInput.value = String(item.duration);
    if (actualWorkOrderInput) actualWorkOrderInput.value = item.woDate;
    if (actualPaymentInput) actualPaymentInput.value = item.payDate;
    if (item.payGraceChoice === 3 || item.payGraceChoice === 21) {
      const radio = document.querySelector(`input[name="pay-grace-option"][value="${item.payGraceChoice}"]`);
      if (radio) radio.checked = true;
    }
    updateGraceUI();
    calculateContractDelays(false);
    showToast('✅ تم تحميل الحساب من السجل', 'success');
  };

  const clearFieldErrors = () => {
    [contractDateInput, contractDurationInput, actualWorkOrderInput, actualPaymentInput]
      .forEach(el => el?.classList.remove('is-invalid'));
  };

  const markInvalid = (el) => el?.classList.add('is-invalid');

  const calculateContractDelays = (saveToHistory = true) => {
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

    lastCalcSnapshot = {
      contractDate: contractDateVal,
      duration,
      woDate: actualWOVal,
      payDate: actualPayVal,
      woElapsed,
      payElapsed,
      woPenalty: wo.penalty,
      payPenalty: pay.penalty,
      repGrace,
      payGrace,
      installDate: install ? formatLocalDate(install.date) : null,
      message: lastReadyMessage
    };

    if (saveToHistory) {
      pushHistory({
        id: uid(),
        savedAt: Date.now(),
        contractDate: contractDateVal,
        duration,
        woDate: actualWOVal,
        payDate: actualPayVal,
        woElapsed,
        payElapsed,
        payGraceChoice: payGrace,
        message: lastReadyMessage
      });
    }

    contractDelayResultsEl.classList.remove('d-none');
    updateGraceUI();
    showToast('✅ تم حساب التأخيرات بنجاح!', 'success');
    contractDelayResultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportDelayPdf = () => {
    if (!lastReadyMessage || !lastCalcSnapshot) {
      showToast('⚠ احسب التأخيرات أولاً', 'danger');
      return;
    }
    const s = lastCalcSnapshot;
    const company = branding.companyName || DEFAULT_BRANDING.companyName;
    const dept = branding.footer || DEFAULT_BRANDING.footer;
    const woOk = s.woPenalty <= 0;
    const payOk = s.payPenalty <= 0;
    const logoSrc = getLogoSrc();
    const logoHtml = logoSrc
      ? `<img class="logo" src="${logoSrc}" alt="${escapeHtml(company)}">`
      : `<div class="logo-fallback"><span>EA</span></div>`;

    const statusBadge = (ok) => ok
      ? '<span class="badge ok">ضمن السماح</span>'
      : '<span class="badge late">يوجد تأخير</span>';

    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(company)} — تقرير التأخيرات</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page{ size:A4 portrait; margin:8mm; }
    :root{
      --ink:#1f2937; --muted:#6b7280; --line:#e5e7eb; --bg:#f3f4f6;
      --brand:#243028; --accent:#ea580c; --ok:#166534; --late:#9f1239;
    }
    *{box-sizing:border-box}
    html,body{margin:0; padding:0; height:100%}
    body{
      font-family:Cairo,Tahoma,sans-serif; color:var(--ink);
      background:var(--bg); -webkit-print-color-adjust:exact; print-color-adjust:exact;
      padding:12px;
    }
    .sheet{
      width:100%; max-width:190mm;
      margin:0 auto; background:#fff;
      border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.08);
      border:1px solid #e7e7e7; overflow:hidden;
      display:flex; flex-direction:column;
      transform-origin: top center;
      page-break-inside:avoid; break-inside:avoid;
    }
    .topbar{height:5px; flex:0 0 auto; background:linear-gradient(90deg,var(--brand),var(--accent));}
    .header{
      display:flex; justify-content:space-between; align-items:center; gap:12px;
      padding:10px 16px; border-bottom:1px solid var(--line); flex:0 0 auto;
    }
    .header-text h1{margin:0; font-size:18px; font-weight:800; line-height:1.25}
    .header-text p{margin:2px 0 0; color:var(--muted); font-size:11px; font-weight:600}
    .logo{max-height:46px; max-width:120px; object-fit:contain}
    .logo-fallback{
      width:42px; height:42px; border-radius:10px; background:var(--brand); color:#fff;
      display:grid; place-items:center; font-weight:800; font-size:13px;
    }
    .content{
      padding:10px 16px 6px; flex:1 1 auto; min-height:0;
      display:flex; flex-direction:column; gap:8px;
    }
    .section-title{
      margin:0; font-size:12px; font-weight:800; color:var(--brand);
      display:flex; align-items:center; gap:6px;
    }
    .section-title::before{
      content:""; width:6px; height:6px; border-radius:50%; background:var(--accent);
    }
    .meta-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:6px}
    .meta-card{
      background:#fafafa; border:1px solid var(--line); border-radius:10px; padding:7px 9px;
    }
    .meta-card .lbl{font-size:10px; color:var(--muted); font-weight:700; margin-bottom:2px}
    .meta-card .val{font-size:13px; font-weight:800; line-height:1.2}
    .status-grid{display:grid; grid-template-columns:1fr 1fr; gap:6px}
    .status-card{
      border-radius:10px; padding:9px 11px; border:1px solid transparent;
    }
    .status-card.ok{background:linear-gradient(180deg,#ecfdf5,#dcfce7); border-color:#86efac; color:var(--ok)}
    .status-card.late{background:linear-gradient(180deg,#fff1f2,#ffe4e6); border-color:#fda4af; color:var(--late)}
    .status-card h3{margin:0 0 4px; font-size:11px; font-weight:800; opacity:.95; line-height:1.35}
    .status-card .big{font-size:20px; font-weight:800; line-height:1.1; margin:2px 0 4px}
    .status-card .sub{font-size:11px; font-weight:600; line-height:1.35}
    .badge{
      display:inline-block; border-radius:999px; padding:1px 7px; font-size:9px; font-weight:800;
      vertical-align:middle;
    }
    .badge.ok{background:#bbf7d0; color:#14532d}
    .badge.late{background:#fecdd3; color:#881337}
    .install{
      background:linear-gradient(135deg,#eff6ff,#dbeafe); border:1px solid #93c5fd;
      border-radius:10px; padding:8px 12px;
      display:flex; justify-content:space-between; align-items:center; gap:10px;
    }
    .install .lbl{font-size:11px; font-weight:800; color:#1d4ed8}
    .install .date{font-size:16px; font-weight:800; color:#1e3a8a}
    .install .note{font-size:10px; color:#1e40af; font-weight:600; margin-top:1px}
    .message-box{
      border:1px solid var(--line); border-radius:10px; overflow:hidden;
      flex:1 1 auto; min-height:0; display:flex; flex-direction:column;
    }
    .message-box .mh{
      background:#f8fafc; padding:6px 10px; border-bottom:1px solid var(--line);
      font-size:11px; font-weight:800; color:var(--brand); flex:0 0 auto;
    }
    .message-box .mb{
      padding:8px 10px; white-space:pre-wrap; font-size:11px; line-height:1.55; font-weight:600;
      overflow:hidden; flex:1 1 auto;
    }
    .note-line{margin:0; color:var(--muted); font-size:10px; font-weight:700}
    .footer{
      padding:7px 16px 10px; display:flex; justify-content:space-between; align-items:center;
      color:var(--muted); font-size:10px; font-weight:700; border-top:1px solid var(--line);
      flex:0 0 auto;
    }
    @media print{
      html,body{height:auto; background:#fff; padding:0}
      .sheet{
        max-width:none; width:100%;
        box-shadow:none; border:none; border-radius:0;
        page-break-after:avoid; page-break-inside:avoid;
        break-inside:avoid;
      }
      .message-box .mb{font-size:10.5px; line-height:1.45}
    }
  </style>
</head>
<body>
  <div class="sheet" id="sheet">
    <div class="topbar"></div>
    <header class="header">
      <div class="header-text">
        <h1>${escapeHtml(company)}</h1>
        <p>تقرير تأخيرات العقود · ${escapeHtml(dept)}</p>
      </div>
      ${logoHtml}
    </header>

    <div class="content">
      <h2 class="section-title">ملخص العقد</h2>
      <div class="meta-grid">
        <div class="meta-card"><div class="lbl">تاريخ العقد</div><div class="val">${escapeHtml(s.contractDate)}</div></div>
        <div class="meta-card"><div class="lbl">مدة العقد</div><div class="val">${s.duration} يوم</div></div>
        <div class="meta-card"><div class="lbl">تاريخ أمر الشغل</div><div class="val">${escapeHtml(s.woDate)}</div></div>
        <div class="meta-card"><div class="lbl">تاريخ السداد</div><div class="val">${escapeHtml(s.payDate)}</div></div>
      </div>

      <h2 class="section-title">نتائج التأخير</h2>
      <div class="status-grid">
        <div class="status-card ${woOk ? 'ok' : 'late'}">
          <h3>أمر الشغل واعتماد المقاسات ${statusBadge(woOk)}</h3>
          <div class="big">${formatElapsedLabel(s.woElapsed)}</div>
          <div class="sub">${woOk
            ? `ضمن فترة السماح (${arabicDays(s.repGrace)})`
            : `التأخير: ${formatElapsedLabel(s.woPenalty)} بعد خصم ${arabicDays(s.repGrace)} السماح`}</div>
        </div>
        <div class="status-card ${payOk ? 'ok' : 'late'}">
          <h3>السداد النهائي ${statusBadge(payOk)}</h3>
          <div class="big">${formatElapsedLabel(s.payElapsed)}</div>
          <div class="sub">${payOk
            ? `ضمن فترة السماح (${arabicDays(s.payGrace)})`
            : `التأخير: ${formatElapsedLabel(s.payPenalty)} بعد خصم ${arabicDays(s.payGrace)} السماح`}</div>
        </div>
      </div>

      ${s.installDate ? `
      <div class="install">
        <div>
          <div class="lbl">موعد التركيب المقترح</div>
          <div class="note">محسوب حسب قواعد مدة العقد</div>
        </div>
        <div class="date">${escapeHtml(s.installDate)}</div>
      </div>` : ''}

      <div class="message-box">
        <div class="mh">نص الرسالة الجاهزة</div>
        <div class="mb">${escapeHtml(lastReadyMessage)}</div>
      </div>
      <p class="note-line">لم يتم احتساب كامل التأخيرات على العميل</p>
    </div>

    <footer class="footer">
      <span>${escapeHtml(dept)}</span>
      <span>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</span>
    </footer>
  </div>
  <script>
    (function () {
      function fitOnePage() {
        var sheet = document.getElementById('sheet');
        if (!sheet) return;
        sheet.style.transform = 'none';
        // Usable A4 height with 8mm margins (~281mm)
        var maxH = Math.round((281 / 25.4) * 96);
        var h = sheet.scrollHeight;
        if (h > maxH) {
          var scale = Math.max(0.72, maxH / h);
          sheet.style.transform = 'scale(' + scale + ')';
        }
      }
      fitOnePage();
      window.addEventListener('beforeprint', fitOnePage);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fitOnePage).catch(function () {});
      }
    })();
  </script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      showToast('⚠ تعذر فتح نافذة الطباعة/PDF', 'danger');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try { win.focus(); win.print(); } catch { /* ignore */ }
    }, 450);
    showToast('✅ جاهز للطباعة أو حفظ PDF — صفحة واحدةحدة', 'success');
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
  const updateDateCalcLabels = () => {
    const label = document.getElementById('calc-result-label');
    const submit = document.getElementById('calc-submit-label');
    const durationLabel = document.getElementById('calc-duration-label');
    if (dateCalcOp === 'count') {
      if (label) label.textContent = dateCalcMode === 'working' ? 'عدد أيام العمل' : 'عدد الأيام التقويمية';
      if (submit) submit.textContent = 'احسب عدد الأيام';
    } else {
      if (label) label.textContent = 'تاريخ الانتهاء';
      if (submit) submit.textContent = 'احسب التاريخ';
      if (durationLabel) {
        durationLabel.textContent = dateCalcMode === 'working' ? 'عدد أيام العمل' : 'عدد الأيام التقويمية';
      }
    }
  };

  const setDateCalcOp = (op) => {
    dateCalcOp = op;
    document.querySelectorAll('.date-calc-op').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });
    document.getElementById('calc-fields-count')?.classList.toggle('d-none', op !== 'count');
    document.getElementById('calc-fields-end')?.classList.toggle('d-none', op !== 'end');
    document.getElementById('calc-result')?.classList.add('d-none');
    updateDateCalcLabels();
  };

  const setDateCalcMode = (mode) => {
    dateCalcMode = mode;
    document.querySelectorAll('.date-calc-mode').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    updateDateCalcLabels();
    const ready = dateCalcOp === 'count'
      ? (document.getElementById('calc-from-date')?.value && document.getElementById('calc-to-date')?.value)
      : (document.getElementById('calc-start-date')?.value && document.getElementById('calc-duration')?.value);
    if (ready) runDateCalc();
  };

  /** Count working days after `from` through `to` inclusive; collect skipped Fridays/holidays. */
  const countWorkingDaysInRange = (fromDate, toDate) => {
    const holidaySet = allHolidayDateSet();
    const skipped = [];
    let working = 0;
    if (toDate <= fromDate) return { working: 0, skipped };
    const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    while (cursor < toDate) {
      cursor.setDate(cursor.getDate() + 1);
      const iso = formatLocalDate(cursor);
      if (cursor.getDay() === 5) {
        skipped.push({ date: iso, reason: 'جمعة' });
      } else if (holidaySet.has(iso)) {
        const h = holidays.find(x => expandHolidayDates(x).includes(iso));
        skipped.push({ date: iso, reason: h?.name || 'إجازة' });
      } else {
        working++;
      }
    }
    return { working, skipped };
  };

  const addWorkingDays = (startDate, days) => {
    const holidaySet = allHolidayDateSet();
    const skipped = [];
    let remaining = days - 1;
    let end = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
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
    return { end, skipped };
  };

  const showSkippedList = (skipped) => {
    const skippedCountEl = document.getElementById('calc-skipped-count');
    const wrap = document.getElementById('calc-skipped-wrap');
    const list = document.getElementById('calc-skipped-list');
    if (dateCalcMode === 'working') {
      if (skippedCountEl) skippedCountEl.textContent = `تم استثناء ${arabicDays(skipped.length)}`;
      if (skipped.length) {
        wrap?.classList.remove('d-none');
        if (list) {
          list.innerHTML = skipped
            .map(s => `<li class="list-group-item">${s.date} — ${escapeHtml(s.reason)}</li>`)
            .join('');
        }
      } else {
        wrap?.classList.add('d-none');
        if (list) list.innerHTML = '';
      }
    } else {
      if (skippedCountEl) skippedCountEl.textContent = 'حساب تقويمي (يشمل الجمع والإجازات)';
      wrap?.classList.add('d-none');
      if (list) list.innerHTML = '';
    }
  };

  const runDateCalc = () => {
    document.getElementById('calc-result')?.classList.remove('d-none');
    const resultEl = document.getElementById('calc-days-result');

    if (dateCalcOp === 'count') {
      const fromVal = document.getElementById('calc-from-date').value;
      const toVal = document.getElementById('calc-to-date').value;
      if (!fromVal || !toVal) {
        showToast('⚠ يرجى تعبئة من تاريخ وإلى تاريخ', 'danger');
        return;
      }
      const fromDate = parseLocalDate(fromVal);
      const toDate = parseLocalDate(toVal);
      if (toDate < fromDate) {
        showToast('⚠ تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو يساويه', 'danger');
        return;
      }
      if (dateCalcMode === 'calendar') {
        if (resultEl) resultEl.textContent = arabicDays(calendarDaysBetween(fromDate, toDate));
        showSkippedList([]);
      } else {
        const { working, skipped } = countWorkingDaysInRange(fromDate, toDate);
        if (resultEl) resultEl.textContent = arabicDays(working);
        showSkippedList(skipped);
      }
      return;
    }

    const startVal = document.getElementById('calc-start-date').value;
    const durationVal = document.getElementById('calc-duration').value;
    if (!startVal || !durationVal) {
      showToast('⚠ يرجى تعبئة تاريخ البداية والمدة', 'danger');
      return;
    }
    const duration = parseInt(durationVal, 10);
    if (isNaN(duration) || duration < 1) {
      showToast('⚠ المدة غير صحيحة', 'danger');
      return;
    }
    const start = parseLocalDate(startVal);
    if (dateCalcMode === 'calendar') {
      const end = addCalendarDays(start, duration - 1);
      if (resultEl) resultEl.textContent = formatLocalDate(end);
      showSkippedList([]);
    } else {
      const { end, skipped } = addWorkingDays(start, duration);
      if (resultEl) resultEl.textContent = formatLocalDate(end);
      showSkippedList(skipped);
    }
  };

  /* ==================[ Tabs / Year ]================== */
  const switchTab = (tab) => {
    document.querySelectorAll('.app-tab').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabHolidays?.classList.toggle('d-none', tab !== 'holidays');
    tabDelays?.classList.toggle('d-none', tab !== 'delays');
    tabSettings?.classList.toggle('d-none', tab !== 'settings');
    document.querySelectorAll('.toolbar-holidays-only').forEach(el => {
      el.classList.toggle('d-none', tab !== 'holidays');
    });
    if (headerSubtitle) {
      const subtitles = {
        holidays: 'عرض الإجازات ومؤشرات أيام العمل حسب السنة',
        delays: 'أدخل بيانات العقد ثم احسب التأخير والرسالة الجاهزة',
        settings: 'إدارة البيانات والاستيراد والتصدير والقواعد'
      };
      headerSubtitle.textContent = subtitles[tab] || '';
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
  document.querySelectorAll('.date-calc-op').forEach(btn => {
    btn.addEventListener('click', () => setDateCalcOp(btn.dataset.op));
  });
  document.getElementById('btn-run-date-calc')?.addEventListener('click', runDateCalc);

  calculateContractDelayBtn?.addEventListener('click', () => calculateContractDelays(true));
  contractDurationInput?.addEventListener('input', updateGraceUI);
  [contractDateInput, contractDurationInput, actualWorkOrderInput, actualPaymentInput].forEach(el => {
    el?.addEventListener('input', () => el.classList.remove('is-invalid'));
  });
  document.querySelectorAll('input[name="pay-grace-option"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateGraceUI();
      if (!contractDelayResultsEl?.classList.contains('d-none')) {
        calculateContractDelays(false);
      }
    });
  });
  document.getElementById('btn-copy-message')?.addEventListener('click', copyReadyMessage);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportDelayPdf);

  document.getElementById('holiday-search')?.addEventListener('input', renderHolidayCalendar);
  document.getElementById('holiday-type-filter')?.addEventListener('change', renderHolidayCalendar);

  document.getElementById('calc-history-list')?.addEventListener('click', async (e) => {
    const loadId = e.target.closest('[data-history-load]')?.dataset.historyLoad;
    const copyId = e.target.closest('[data-history-copy]')?.dataset.historyCopy;
    const delId = e.target.closest('[data-history-delete]')?.dataset.historyDelete;
    if (loadId) loadHistoryEntry(loadId);
    if (copyId) {
      const item = calcHistory.find(x => x.id === copyId);
      if (item?.message) {
        try {
          await navigator.clipboard.writeText(item.message);
          showToast('✅ تم نسخ رسالة السجل', 'success');
        } catch {
          showToast('⚠ تعذر النسخ', 'danger');
        }
      }
    }
    if (delId) {
      calcHistory = calcHistory.filter(x => x.id !== delId);
      saveHistoryStore();
      renderHistory();
      showToast('✅ تم حذف العنصر من السجل', 'success');
    }
  });
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (!calcHistory.length) return;
    if (!confirm('مسح كل سجل الحسابات؟')) return;
    calcHistory = [];
    saveHistoryStore();
    renderHistory();
    showToast('✅ تم مسح السجل', 'success');
  });

  document.getElementById('btn-save-branding')?.addEventListener('click', saveBranding);
  document.getElementById('company-logo')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      branding.logoDataUrl = String(reader.result || '');
      const preview = document.getElementById('company-logo-preview');
      const img = document.getElementById('company-logo-img');
      if (img && preview) {
        img.src = branding.logoDataUrl;
        preview.classList.remove('d-none');
      }
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('btn-clear-logo')?.addEventListener('click', () => {
    branding.logoDataUrl = '';
    document.getElementById('company-logo').value = '';
    applyLogoPreview();
    showToast('تم استعادة الشعار الافتراضي', 'success');
  });

  // Enter key submits delay form
  document.getElementById('tab-delays')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault();
      calculateContractDelays(true);
    }
  });

  /* ==================[ Init ]================== */
  holidayModal = new bootstrap.Modal(document.getElementById('holidayModal'));
  dateCalcModal = new bootstrap.Modal(document.getElementById('dateCalcModal'));
  loadHolidays();
  loadBranding();
  loadHistory();
  initYearSelect();
  refreshHolidayViews();
  renderHistory();
  updateGraceUI();
  setDateCalcOp('count');
  setDateCalcMode('calendar');
});
