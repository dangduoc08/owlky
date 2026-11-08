import {
  formatDate,
  hourUnit,
  isTimeView,
  isValidDate,
  meridiemNames,
  type PickerLocaleText,
  type PickerView,
  setTimeUnit,
  type TimeView,
} from "@owlky/core";

const pad2 = (value: number) => String(value).padStart(2, "0");

export interface TimeToolbarProps {
  id: string;
  /** The overline ("Select time", "Select date & time"). */
  title: string;
  value: Date | null;
  /** The date AM / PM changes when there's no value. */
  base: Date;
  views: readonly PickerView[];
  view: PickerView;
  ampm: boolean;
  /** Date time pickers: the year and the day before the time. */
  withDate: boolean;
  locale: string;
  localeText: PickerLocaleText;
  hidden: boolean;
  disabled: boolean;
  readOnly: boolean;
  onViewChange: (view: PickerView) => void;
  onMeridiemChange: (value: Date) => void;
}

/**
 * The toolbar of time and date time pickers (mobile and static): the year and the day (date
 * time), the hours, minutes and seconds as buttons that open their view, and AM / PM.
 */
export function TimeToolbar({
  id,
  title,
  value,
  base,
  views,
  view,
  ampm,
  withDate,
  locale,
  localeText,
  hidden,
  disabled,
  readOnly,
  onViewChange,
  onMeridiemChange,
}: TimeToolbarProps) {
  const valid = isValidDate(value) ? value : null;
  const empty = localeText.toolbarEmptyText;
  const timeViews = views.filter(isTimeView);
  const viewButton = (target: PickerView, text: string) => (
    <button
      type="button"
      data-ok-picker-toolbar-button=""
      data-ok-view={target}
      {...(view === target ? { "data-ok-selected": "" } : {})}
      tabIndex={-1}
      disabled={disabled}
      onClick={() => onViewChange(target)}
    >
      {text}
    </button>
  );
  const timeText = (target: TimeView) => {
    if (!valid) return empty;
    if (target === "hours") return pad2(hourUnit(valid, ampm));
    return pad2(target === "minutes" ? valid.getMinutes() : valid.getSeconds());
  };
  const dayView: PickerView = views.includes("day")
    ? "day"
    : (views.find((v) => !isTimeView(v)) ?? "day");
  const meridiem = meridiemNames(locale);
  const pm = (valid ?? base).getHours() >= 12;

  return (
    <div data-ok-picker-toolbar="" hidden={hidden || undefined}>
      <span data-ok-picker-toolbar-overline="" id={`${id}-toolbar`}>
        {title}
      </span>
      <div data-ok-picker-toolbar-content="">
        {withDate && (
          <div data-ok-picker-toolbar-date="">
            {views.includes("year") &&
              viewButton("year", valid ? formatDate(valid, locale, { year: "numeric" }) : empty)}
            {viewButton(
              dayView,
              valid ? formatDate(valid, locale, { month: "short", day: "numeric" }) : empty,
            )}
          </div>
        )}
        {timeViews.length > 0 && (
          <div data-ok-picker-toolbar-time="">
            {timeViews.map((target, index) => (
              <span key={target} data-ok-picker-toolbar-part="">
                {index > 0 && (
                  <span data-ok-picker-toolbar-separator="" aria-hidden="true">
                    :
                  </span>
                )}
                {viewButton(target, timeText(target))}
              </span>
            ))}
          </div>
        )}
        {ampm && timeViews.includes("hours") && (
          <div data-ok-picker-toolbar-ampm="">
            {[0, 1].map((index) => (
              <button
                key={index}
                type="button"
                data-ok-picker-toolbar-meridiem={index === 0 ? "am" : "pm"}
                aria-pressed={valid !== null && pm === (index === 1)}
                disabled={disabled || readOnly}
                onClick={() =>
                  onMeridiemChange(setTimeUnit(valid ?? base, "meridiem", index, ampm))
                }
              >
                {meridiem[index]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Clock icon of a time picker's open button (decorative). */
export function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 2a1 1 0 0 1 1 1v4.59l2.7 2.7a1 1 0 0 1-1.4 1.42l-3-3A1 1 0 0 1 11 12V7a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}
