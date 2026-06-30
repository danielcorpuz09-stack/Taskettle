/**
 * Registers the Chart.js building blocks used across the wallet charts and
 * applies the cozy "Family Hearth" defaults (body font + muted text colour).
 * Importing this module anywhere performs the registration once.
 */
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = "'Be Vietnam Pro', system-ui, sans-serif";
ChartJS.defaults.color = '#424844'; // on-surface-variant
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
ChartJS.defaults.plugins.legend.labels.boxHeight = 8;
