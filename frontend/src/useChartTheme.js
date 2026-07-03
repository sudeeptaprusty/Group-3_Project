// useChartTheme.js
// Returns Chart.js compatible color tokens derived from the active CSS theme.
// Locked to light mode for professional white enterprise theme.


export function useChartTheme() {
  return getThemeColors();
}

function getThemeColors() {
  return {
    gridColor:      '#F3F4F6',
    tickColor:      '#6B7280',
    tickColorBold:  '#4B5563',
    tooltipBg:      '#111827',
    tooltipBorder:  '#E5E7EB',
    tooltipColor:   '#FFFFFF',
    legendColor:    '#4B5563',
    pointBorder:    '#FFFFFF',
  };
}

