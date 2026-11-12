import { Chart } from "@owlky/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const orders = [
  { name: "Online", data: [41, 37, 35, 39, 56] },
  { name: "In store", data: [19, 13, 11, 19, 8] },
];

export function CustomTooltipChart() {
  return (
    <Chart
      label="Orders per weekday (custom tooltip)"
      type="bar"
      categories={days}
      series={orders}
      tooltipContent={({ title, rows, selected }) => (
        <>
          <div data-ok-chart-tooltip-title="">
            <span>Orders on </span>
            <span>{title}</span>
          </div>
          {selected && <div data-ok-chart-tooltip-state="">Selected</div>}
          <div data-ok-chart-tooltip-rows="">
            {rows.map((row) => (
              <div key={row.name} data-ok-chart-tooltip-row="">
                <span data-ok-chart-tooltip-marker="" data-ok-color={row.color} />
                <span>{row.name}</span>
                <span data-ok-chart-tooltip-value="">{row.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    />
  );
}
