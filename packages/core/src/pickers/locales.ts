/*
 * Picker locale packs (phase 4, ADR-0030; MUI X `localeText`): pass one as `localeText` (React
 * `LocalizationProvider`) or to `setLocaleText()` (HTML). English (`pickersEnUS`) and Vietnamese
 * (`pickersViVN`) are built in and picked by the locale; the others are plain data, so a page
 * bundles only the packs it imports. Names and formats (months, weekdays) always come from `Intl`.
 */
import { type PickerLocaleText, pickersEnUS } from "./locale.js";
import type { ClockSectionView } from "./time.js";

type ViewNames = Record<ClockSectionView, string>;

/** Placeholders shared by most packs (letters of the language's words). */
const placeholders = (
  year: string,
  day: string,
  hours = "hh",
  minutes = "mm",
  seconds = "ss",
  meridiem = "aa",
): Pick<
  PickerLocaleText,
  | "fieldYearPlaceholder"
  | "fieldMonthPlaceholder"
  | "fieldDayPlaceholder"
  | "fieldHoursPlaceholder"
  | "fieldMinutesPlaceholder"
  | "fieldSecondsPlaceholder"
  | "fieldMeridiemPlaceholder"
> => ({
  fieldYearPlaceholder: (format) => year.repeat(format.length),
  fieldMonthPlaceholder: (format, contentType) => (contentType === "letter" ? format : "MM"),
  fieldDayPlaceholder: () => day.repeat(2),
  fieldHoursPlaceholder: () => hours,
  fieldMinutesPlaceholder: () => minutes,
  fieldSecondsPlaceholder: () => seconds,
  fieldMeridiemPlaceholder: () => meridiem,
});

const viewText = (names: ViewNames, build: (name: string) => string) => (view: ClockSectionView) =>
  build(names[view]);

/** French. */
const FR_VIEWS: ViewNames = {
  hours: "les heures",
  minutes: "les minutes",
  seconds: "les secondes",
  meridiem: "méridien",
};
export const pickersFrFR: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("A", "J"),
  previousMonth: "Mois précédent",
  nextMonth: "Mois suivant",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "La vue année est ouverte, ouvrir la vue calendrier"
      : "La vue calendrier est ouverte, ouvrir la vue année",
  openDatePickerDialogue: (value) =>
    value ? `Choisir la date, la date sélectionnée est ${value}` : "Choisir la date",
  datePickerToolbarTitle: "Choisir une date",
  cancelButtonLabel: "Annuler",
  clearButtonLabel: "Vider",
  todayButtonLabel: "Aujourd'hui",
  nextStepButtonLabel: "Suivant",
  fieldClearLabel: "Effacer la valeur",
  year: "Année",
  month: "Mois",
  day: "Jour",
  weekDay: "Jour de la semaine",
  hours: "Heures",
  minutes: "Minutes",
  seconds: "Secondes",
  meridiem: "Méridien",
  empty: "Vide",
  calendarWeekNumberHeaderLabel: "Numéro de semaine",
  calendarWeekNumberAriaLabelText: (week) => `Semaine ${week}`,
  shortcutsLabel: "Raccourcis",
  timePickerToolbarTitle: "Choisir l’heure",
  dateTimePickerToolbarTitle: "Choisir la date et l'heure",
  openTimePickerDialogue: (value) =>
    value ? `Choisir l’heure, l’heure sélectionnée est ${value}` : "Choisir l’heure",
  openPreviousView: "Ouvrir la vue précédente",
  openNextView: "Ouvrir la vue suivante",
  clockLabelText: (view, time) =>
    `Sélectionner ${FR_VIEWS[view]}. ${time ? `L’heure sélectionnée est ${time}` : "Aucune heure choisie"}`,
  hoursClockNumberText: (hours) => `${hours} heures`,
  minutesClockNumberText: (minutes) => `${minutes} minutes`,
  secondsClockNumberText: (seconds) => `${seconds} secondes`,
  selectViewText: viewText(FR_VIEWS, (name) => `Choisir ${name}`),
  dateTableLabel: "choix de la date",
  timeTableLabel: "choix de l’heure",
  start: "Début",
  end: "Fin",
  startDate: "Date de début",
  startTime: "Heure de début",
  endDate: "Date de fin",
  endTime: "Heure de fin",
  dateRangePickerToolbarTitle: "Choisir une plage de dates",
  timeRangePickerToolbarTitle: "Choisir une plage horaire",
  dateTimeRangePickerToolbarTitle: "Choisir une plage de dates et d’heures",
  openRangePickerDialogue: (value) =>
    value ? `Choisir la plage, la plage sélectionnée est ${value}` : "Choisir la plage",
};

/** German. */
const DE_VIEWS: ViewNames = {
  hours: "Stunden",
  minutes: "Minuten",
  seconds: "Sekunden",
  meridiem: "Meridiem",
};
export const pickersDeDE: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("J", "T"),
  previousMonth: "Letzter Monat",
  nextMonth: "Nächster Monat",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "Jahresansicht ist geöffnet, zur Kalenderansicht wechseln"
      : "Kalenderansicht ist geöffnet, zur Jahresansicht wechseln",
  openDatePickerDialogue: (value) =>
    value ? `Datum auswählen, gewähltes Datum ist ${value}` : "Datum auswählen",
  datePickerToolbarTitle: "Datum auswählen",
  cancelButtonLabel: "Abbrechen",
  clearButtonLabel: "Löschen",
  todayButtonLabel: "Heute",
  nextStepButtonLabel: "Weiter",
  fieldClearLabel: "Wert leeren",
  year: "Jahr",
  month: "Monat",
  day: "Tag",
  weekDay: "Wochentag",
  hours: "Stunden",
  minutes: "Minuten",
  seconds: "Sekunden",
  meridiem: "Tageszeit",
  empty: "Leer",
  calendarWeekNumberHeaderLabel: "Kalenderwoche",
  calendarWeekNumberAriaLabelText: (week) => `Woche ${week}`,
  shortcutsLabel: "Schnellauswahl",
  timePickerToolbarTitle: "Uhrzeit auswählen",
  dateTimePickerToolbarTitle: "Datum & Uhrzeit auswählen",
  openTimePickerDialogue: (value) =>
    value ? `Uhrzeit auswählen, gewählte Uhrzeit ist ${value}` : "Uhrzeit auswählen",
  openPreviousView: "Letzte Ansicht öffnen",
  openNextView: "Nächste Ansicht öffnen",
  clockLabelText: (view, time) =>
    `${DE_VIEWS[view]} auswählen. ${time ? `Gewählte Uhrzeit ist ${time}` : "Keine Uhrzeit ausgewählt"}`,
  hoursClockNumberText: (hours) => `${hours} Stunden`,
  minutesClockNumberText: (minutes) => `${minutes} Minuten`,
  secondsClockNumberText: (seconds) => `${seconds} Sekunden`,
  selectViewText: viewText(DE_VIEWS, (name) => `${name} auswählen`),
  dateTableLabel: "Datum auswählen",
  timeTableLabel: "Uhrzeit auswählen",
  start: "Beginn",
  end: "Ende",
  startDate: "Startdatum",
  startTime: "Startzeit",
  endDate: "Enddatum",
  endTime: "Endzeit",
  dateRangePickerToolbarTitle: "Datumsbereich auswählen",
  timeRangePickerToolbarTitle: "Zeitbereich auswählen",
  dateTimeRangePickerToolbarTitle: "Datums- und Zeitbereich auswählen",
  openRangePickerDialogue: (value) =>
    value ? `Bereich auswählen, gewählter Bereich ist ${value}` : "Bereich auswählen",
};

/** Spanish. */
const ES_VIEWS: ViewNames = {
  hours: "las horas",
  minutes: "los minutos",
  seconds: "los segundos",
  meridiem: "el meridiano",
};
export const pickersEsES: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("A", "D"),
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "la vista anual está abierta, cambiar a la vista de calendario"
      : "la vista de calendario está abierta, cambiar a la vista anual",
  openDatePickerDialogue: (value) =>
    value ? `Elegir fecha, la fecha elegida es ${value}` : "Elegir fecha",
  datePickerToolbarTitle: "Seleccionar fecha",
  cancelButtonLabel: "Cancelar",
  okButtonLabel: "Aceptar",
  clearButtonLabel: "Limpiar",
  todayButtonLabel: "Hoy",
  nextStepButtonLabel: "Siguiente",
  fieldClearLabel: "Limpiar valor",
  year: "Año",
  month: "Mes",
  day: "Día",
  weekDay: "Día de la semana",
  hours: "Horas",
  minutes: "Minutos",
  seconds: "Segundos",
  meridiem: "Meridiano",
  empty: "Vacío",
  calendarWeekNumberHeaderLabel: "Número de semana",
  calendarWeekNumberAriaLabelText: (week) => `Semana ${week}`,
  shortcutsLabel: "Atajos",
  timePickerToolbarTitle: "Seleccionar hora",
  dateTimePickerToolbarTitle: "Seleccionar fecha y hora",
  openTimePickerDialogue: (value) =>
    value ? `Elegir hora, la hora elegida es ${value}` : "Elegir hora",
  openPreviousView: "Abrir la vista anterior",
  openNextView: "Abrir la vista siguiente",
  clockLabelText: (view, time) =>
    `Seleccione ${ES_VIEWS[view]}. ${time ? `La hora elegida es ${time}` : "No hay hora seleccionada"}`,
  hoursClockNumberText: (hours) => `${hours} horas`,
  minutesClockNumberText: (minutes) => `${minutes} minutos`,
  secondsClockNumberText: (seconds) => `${seconds} segundos`,
  selectViewText: viewText(ES_VIEWS, (name) => `Seleccionar ${name}`),
  dateTableLabel: "elegir fecha",
  timeTableLabel: "elegir hora",
  start: "Inicio",
  end: "Fin",
  startDate: "Fecha de inicio",
  startTime: "Hora de inicio",
  endDate: "Fecha de fin",
  endTime: "Hora de fin",
  dateRangePickerToolbarTitle: "Seleccionar rango de fechas",
  timeRangePickerToolbarTitle: "Seleccionar rango de horas",
  dateTimeRangePickerToolbarTitle: "Seleccionar rango de fecha y hora",
  openRangePickerDialogue: (value) =>
    value ? `Elegir rango, el rango elegido es ${value}` : "Elegir rango",
};

/** Japanese. */
const JA_VIEWS: ViewNames = { hours: "時間", minutes: "分", seconds: "秒", meridiem: "午前/午後" };
export const pickersJaJP: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("年", "日", "時間", "分", "秒", "午前/午後"),
  fieldYearPlaceholder: () => "年",
  fieldMonthPlaceholder: (_format, contentType) => (contentType === "letter" ? "MMMM" : "MM"),
  fieldDayPlaceholder: () => "日",
  previousMonth: "先月",
  nextMonth: "来月",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "年選択表示からカレンダー表示に切り替える"
      : "カレンダー表示から年選択表示に切り替える",
  openDatePickerDialogue: (value) =>
    value ? `日付を選択してください。選択した日付は ${value} です` : "日付を選択してください",
  datePickerToolbarTitle: "日付を選択",
  cancelButtonLabel: "キャンセル",
  okButtonLabel: "確定",
  clearButtonLabel: "クリア",
  todayButtonLabel: "今日",
  nextStepButtonLabel: "次へ",
  fieldClearLabel: "クリア",
  year: "年",
  month: "月",
  day: "日",
  weekDay: "平日",
  hours: "時間",
  minutes: "分",
  seconds: "秒",
  meridiem: "午前/午後",
  empty: "空",
  calendarWeekNumberHeaderLabel: "週番号",
  calendarWeekNumberAriaLabelText: (week) => `${week}週目`,
  shortcutsLabel: "ショートカット",
  timePickerToolbarTitle: "時間を選択",
  dateTimePickerToolbarTitle: "日時を選択",
  openTimePickerDialogue: (value) =>
    value ? `時間を選択してください。選択した時間は ${value} です` : "時間を選択してください",
  openPreviousView: "前の表示を開く",
  openNextView: "次の表示を開く",
  clockLabelText: (view, time) =>
    `${JA_VIEWS[view]}を選択してください ${time ? `選択した時間は ${time} です` : "時間が選択されていません"}`,
  hoursClockNumberText: (hours) => `${hours}時`,
  minutesClockNumberText: (minutes) => `${minutes}分`,
  secondsClockNumberText: (seconds) => `${seconds}秒`,
  selectViewText: viewText(JA_VIEWS, (name) => `${name}を選択`),
  dateTableLabel: "日付を選択",
  timeTableLabel: "時間を選択",
  start: "開始",
  end: "終了",
  startDate: "開始日",
  startTime: "開始時間",
  endDate: "終了日",
  endTime: "終了時間",
  dateRangePickerToolbarTitle: "日付の範囲を選択",
  timeRangePickerToolbarTitle: "時間の範囲を選択",
  dateTimeRangePickerToolbarTitle: "日時の範囲を選択",
  openRangePickerDialogue: (value) =>
    value ? `範囲を選択してください。選択した範囲は ${value} です` : "範囲を選択してください",
};

/** Chinese (simplified). */
const ZH_VIEWS: ViewNames = {
  hours: "小时",
  minutes: "分钟",
  seconds: "秒",
  meridiem: "十二小时制",
};
export const pickersZhCN: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("年", "日", "时", "分", "秒", "上午/下午"),
  fieldYearPlaceholder: () => "年",
  fieldMonthPlaceholder: () => "月",
  fieldDayPlaceholder: () => "日",
  previousMonth: "上个月",
  nextMonth: "下个月",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year" ? "年视图已打开，切换为日历视图" : "日历视图已打开，切换为年视图",
  openDatePickerDialogue: (value) => (value ? `选择日期，已选择 ${value}` : "选择日期"),
  datePickerToolbarTitle: "选择日期",
  cancelButtonLabel: "取消",
  okButtonLabel: "确认",
  clearButtonLabel: "清除",
  todayButtonLabel: "今天",
  nextStepButtonLabel: "下一步",
  fieldClearLabel: "清除",
  year: "年份",
  month: "月份",
  day: "日期",
  weekDay: "星期",
  hours: "时",
  minutes: "分",
  seconds: "秒",
  meridiem: "十二小时制",
  empty: "空",
  calendarWeekNumberHeaderLabel: "周数",
  calendarWeekNumberAriaLabelText: (week) => `第${week}周`,
  shortcutsLabel: "快捷选项",
  timePickerToolbarTitle: "选择时间",
  dateTimePickerToolbarTitle: "选择日期和时间",
  openTimePickerDialogue: (value) => (value ? `选择时间，已选择 ${value}` : "选择时间"),
  openPreviousView: "打开上一个视图",
  openNextView: "打开下一个视图",
  clockLabelText: (view, time) =>
    `选择${ZH_VIEWS[view]}。${time ? `已选择 ${time}` : "未选择时间"}`,
  hoursClockNumberText: (hours) => `${hours}时`,
  minutesClockNumberText: (minutes) => `${minutes}分`,
  secondsClockNumberText: (seconds) => `${seconds}秒`,
  selectViewText: viewText(ZH_VIEWS, (name) => `选择${name}`),
  dateTableLabel: "选择日期",
  timeTableLabel: "选择时间",
  start: "开始",
  end: "结束",
  startDate: "开始日期",
  startTime: "开始时间",
  endDate: "结束日期",
  endTime: "结束时间",
  dateRangePickerToolbarTitle: "选择日期范围",
  timeRangePickerToolbarTitle: "选择时间范围",
  dateTimeRangePickerToolbarTitle: "选择日期和时间范围",
  openRangePickerDialogue: (value) => (value ? `选择范围，已选择 ${value}` : "选择范围"),
};

/** Persian (right to left; pair it with `calendar="persian"` for the Jalali calendar). */
const FA_VIEWS: ViewNames = {
  hours: "ساعت",
  minutes: "دقیقه",
  seconds: "ثانیه",
  meridiem: "نیم‌روز",
};
export const pickersFaIR: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("Y", "D"),
  previousMonth: "ماه گذشته",
  nextMonth: "ماه آینده",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "نمای سال باز است، رفتن به نمای تقویم"
      : "نمای تقویم باز است، رفتن به نمای سال",
  openDatePickerDialogue: (value) =>
    value ? `تاریخ را انتخاب کنید، تاریخ انتخاب شده ${value} است` : "تاریخ را انتخاب کنید",
  datePickerToolbarTitle: "تاریخ را انتخاب کنید",
  cancelButtonLabel: "لغو",
  okButtonLabel: "تایید",
  clearButtonLabel: "پاک کردن",
  todayButtonLabel: "امروز",
  nextStepButtonLabel: "بعدی",
  fieldClearLabel: "پاک کردن مقدار",
  year: "سال",
  month: "ماه",
  day: "روز",
  weekDay: "روز هفته",
  hours: "ساعت‌ها",
  minutes: "دقیقه‌ها",
  seconds: "ثانیه‌ها",
  meridiem: "نیم‌روز",
  empty: "خالی",
  calendarWeekNumberHeaderLabel: "شماره هفته",
  calendarWeekNumberAriaLabelText: (week) => `هفته ${week}`,
  shortcutsLabel: "میان‌برها",
  timePickerToolbarTitle: "ساعت را انتخاب کنید",
  dateTimePickerToolbarTitle: "تاریخ و ساعت را انتخاب کنید",
  openTimePickerDialogue: (value) =>
    value ? `ساعت را انتخاب کنید، ساعت انتخاب شده ${value} است` : "ساعت را انتخاب کنید",
  openPreviousView: "نمای قبلی",
  openNextView: "نمای بعدی",
  clockLabelText: (view, time) =>
    `${FA_VIEWS[view]} را انتخاب کنید. ${time ? `ساعت انتخاب شده ${time} است` : "ساعتی انتخاب نشده است"}`,
  hoursClockNumberText: (hours) => `${hours} ساعت`,
  minutesClockNumberText: (minutes) => `${minutes} دقیقه`,
  secondsClockNumberText: (seconds) => `${seconds} ثانیه`,
  selectViewText: viewText(FA_VIEWS, (name) => `${name} را انتخاب کنید`),
  dateTableLabel: "انتخاب تاریخ",
  timeTableLabel: "انتخاب ساعت",
  start: "شروع",
  end: "پایان",
  startDate: "تاریخ شروع",
  startTime: "ساعت شروع",
  endDate: "تاریخ پایان",
  endTime: "ساعت پایان",
  dateRangePickerToolbarTitle: "بازه تاریخ را انتخاب کنید",
  timeRangePickerToolbarTitle: "بازه ساعت را انتخاب کنید",
  dateTimeRangePickerToolbarTitle: "بازه تاریخ و ساعت را انتخاب کنید",
  openRangePickerDialogue: (value) =>
    value ? `بازه را انتخاب کنید، بازه انتخاب شده ${value} است` : "بازه را انتخاب کنید",
};

/** Arabic (right to left; pair it with `calendar="islamic-umalqura"` for the Hijri calendar). */
const AR_VIEWS: ViewNames = {
  hours: "الساعات",
  minutes: "الدقائق",
  seconds: "الثواني",
  meridiem: "الفترة",
};
export const pickersArSD: PickerLocaleText = {
  ...pickersEnUS,
  ...placeholders("Y", "D"),
  previousMonth: "الشهر السابق",
  nextMonth: "الشهر التالي",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "عرض السنوات مفتوح، التحويل إلى عرض التقويم"
      : "عرض التقويم مفتوح، التحويل إلى عرض السنوات",
  openDatePickerDialogue: (value) =>
    value ? `اختر التاريخ، التاريخ المختار هو ${value}` : "اختر التاريخ",
  datePickerToolbarTitle: "اختر التاريخ",
  cancelButtonLabel: "إلغاء",
  okButtonLabel: "موافق",
  clearButtonLabel: "مسح",
  todayButtonLabel: "اليوم",
  nextStepButtonLabel: "التالي",
  fieldClearLabel: "مسح القيمة",
  year: "السنة",
  month: "الشهر",
  day: "اليوم",
  weekDay: "اليوم من الأسبوع",
  hours: "الساعات",
  minutes: "الدقائق",
  seconds: "الثواني",
  meridiem: "الفترة",
  empty: "فارغ",
  calendarWeekNumberHeaderLabel: "رقم الأسبوع",
  calendarWeekNumberAriaLabelText: (week) => `الأسبوع ${week}`,
  shortcutsLabel: "اختصارات",
  timePickerToolbarTitle: "اختر الوقت",
  dateTimePickerToolbarTitle: "اختر التاريخ والوقت",
  openTimePickerDialogue: (value) =>
    value ? `اختر الوقت، الوقت المختار هو ${value}` : "اختر الوقت",
  openPreviousView: "افتح العرض السابق",
  openNextView: "افتح العرض التالي",
  clockLabelText: (view, time) =>
    `اختر ${AR_VIEWS[view]}. ${time ? `الوقت المختار هو ${time}` : "لم يتم اختيار وقت"}`,
  hoursClockNumberText: (hours) => `${hours} ساعات`,
  minutesClockNumberText: (minutes) => `${minutes} دقائق`,
  secondsClockNumberText: (seconds) => `${seconds} ثواني`,
  selectViewText: viewText(AR_VIEWS, (name) => `اختر ${name}`),
  dateTableLabel: "اختر التاريخ",
  timeTableLabel: "اختر الوقت",
  start: "البداية",
  end: "النهاية",
  startDate: "تاريخ البداية",
  startTime: "وقت البداية",
  endDate: "تاريخ النهاية",
  endTime: "وقت النهاية",
  dateRangePickerToolbarTitle: "اختر نطاق التاريخ",
  timeRangePickerToolbarTitle: "اختر نطاق الوقت",
  dateTimeRangePickerToolbarTitle: "اختر نطاق التاريخ والوقت",
  openRangePickerDialogue: (value) =>
    value ? `اختر النطاق، النطاق المختار هو ${value}` : "اختر النطاق",
};
