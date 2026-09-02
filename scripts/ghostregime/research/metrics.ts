/**
 * Frozen R7 research metrics. Unit-tested on synthetic equity curves only.
 */

import { calendarDaysBetween, type DateKey, type ResearchWarning } from './types';

export interface EquityPoint {
  date: DateKey;
  nav: number;
}

export interface DailyReturnPoint {
  date: DateKey;
  portfolioReturn: number;
  rfReturn: number;
}

function mean(xs: number[]): number {
  return xs.reduce((sum, x) => sum + x, 0) / xs.length;
}

export function sampleStdev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs);
  const variance = xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

export function cagr(
  startNav: number,
  endNav: number,
  startDate: DateKey,
  endDate: DateKey
): { value: number | null; warnings: ResearchWarning[] } {
  const warnings: ResearchWarning[] = [];
  const days = calendarDaysBetween(startDate, endDate);
  if (startNav <= 0 || endNav <= 0 || days <= 0) {
    warnings.push({ code: 'CAGR_UNDEFINED', message: 'CAGR undefined: non-positive NAV or non-positive elapsed days' });
    return { value: null, warnings };
  }
  const years = days / 365.25;
  return { value: (endNav / startNav) ** (1 / years) - 1, warnings };
}

export function annualizedVolatility(
  dailyReturns: number[]
): { value: number | null; warnings: ResearchWarning[] } {
  const sd = sampleStdev(dailyReturns);
  if (sd == null) {
    return {
      value: null,
      warnings: [{ code: 'VOL_UNDEFINED', message: 'Annualized volatility undefined: need at least 2 daily returns' }],
    };
  }
  return { value: sd * Math.sqrt(252), warnings: [] };
}

export function sharpe(
  points: DailyReturnPoint[]
): { value: number | null; warnings: ResearchWarning[] } {
  const excess = points.map((p) => p.portfolioReturn - p.rfReturn);
  if (excess.length < 2) {
    return {
      value: null,
      warnings: [{ code: 'SHARPE_UNDEFINED', message: 'Sharpe undefined: need at least 2 excess returns' }],
    };
  }
  const sd = sampleStdev(excess);
  if (sd == null || sd === 0) {
    return {
      value: null,
      warnings: [{ code: 'SHARPE_UNDEFINED', message: 'Sharpe undefined: sample stdev of excess is zero or undefined' }],
    };
  }
  return { value: (Math.sqrt(252) * mean(excess)) / sd, warnings: [] };
}

export function downsideDeviation(excess: number[]): number | null {
  if (excess.length === 0) return null;
  const meanSq = mean(excess.map((x) => Math.min(x, 0) ** 2));
  return Math.sqrt(meanSq);
}

export function sortino(
  points: DailyReturnPoint[]
): { value: number | null; warnings: ResearchWarning[] } {
  const excess = points.map((p) => p.portfolioReturn - p.rfReturn);
  if (excess.length === 0) {
    return {
      value: null,
      warnings: [{ code: 'SORTINO_UNDEFINED', message: 'Sortino undefined: no excess returns' }],
    };
  }
  const dd = downsideDeviation(excess);
  if (dd == null || dd === 0) {
    return {
      value: null,
      warnings: [{ code: 'SORTINO_UNDEFINED', message: 'Sortino undefined: downside deviation is zero or undefined' }],
    };
  }
  return { value: (Math.sqrt(252) * mean(excess)) / dd, warnings: [] };
}

export interface DrawdownResult {
  maxDrawdown: number | null;
  peakDate: DateKey | null;
  troughDate: DateKey | null;
  recoveredDate: DateKey | null;
  tuwMaxDdCalendarDays: number | null;
  tuwLongestCalendarDays: number | null;
  warnings: ResearchWarning[];
}

export function drawdownStats(equity: EquityPoint[]): DrawdownResult {
  const warnings: ResearchWarning[] = [];
  if (equity.length === 0) {
    warnings.push({ code: 'DRAWDOWN_UNDEFINED', message: 'Max drawdown undefined: empty equity curve' });
    return {
      maxDrawdown: null,
      peakDate: null,
      troughDate: null,
      recoveredDate: null,
      tuwMaxDdCalendarDays: null,
      tuwLongestCalendarDays: null,
      warnings,
    };
  }

  let peak = equity[0].nav;
  let peakDate = equity[0].date;
  let maxDd = 0;
  let maxPeakDate = equity[0].date;
  let maxTroughDate = equity[0].date;
  let longest = 0;
  let underwaterStart: DateKey | null = null;
  let priorPeak = equity[0].nav;

  for (const point of equity) {
    if (point.nav >= peak) {
      peak = point.nav;
      peakDate = point.date;
    }
    const dd = point.nav / peak - 1;
    if (dd < maxDd) {
      maxDd = dd;
      maxPeakDate = peakDate;
      maxTroughDate = point.date;
    }

    if (point.nav < priorPeak) {
      if (underwaterStart == null) underwaterStart = point.date;
      longest = Math.max(longest, calendarDaysBetween(underwaterStart, point.date));
    } else {
      if (underwaterStart != null) {
        longest = Math.max(longest, calendarDaysBetween(underwaterStart, point.date));
      }
      underwaterStart = null;
      priorPeak = Math.max(priorPeak, point.nav);
    }
  }

  let recoveredDate: DateKey | null = null;
  const peakNav = equity.find((p) => p.date === maxPeakDate)?.nav;
  if (peakNav != null) {
    const troughIdx = equity.findIndex((p) => p.date === maxTroughDate);
    for (let i = troughIdx + 1; i < equity.length; i += 1) {
      if (equity[i].nav >= peakNav) {
        recoveredDate = equity[i].date;
        break;
      }
    }
  }

  let tuwMaxDd: number | null = null;
  if (maxDd < 0) {
    if (recoveredDate) {
      tuwMaxDd = calendarDaysBetween(maxPeakDate, recoveredDate);
    } else {
      warnings.push({
        code: 'TUW_MAXDD_UNRECOVERED',
        message: 'Max-drawdown episode has not recovered; TUW_maxDD is null',
      });
    }
  }

  return {
    maxDrawdown: maxDd,
    peakDate: maxPeakDate,
    troughDate: maxTroughDate,
    recoveredDate,
    tuwMaxDdCalendarDays: tuwMaxDd,
    tuwLongestCalendarDays: longest,
    warnings,
  };
}

export function calmar(
  cagrValue: number | null,
  maxDrawdown: number | null
): { value: number | null; warnings: ResearchWarning[] } {
  if (cagrValue == null || maxDrawdown == null || maxDrawdown === 0) {
    return {
      value: null,
      warnings: [{ code: 'CALMAR_UNDEFINED', message: 'Calmar undefined: missing CAGR or zero/undefined max drawdown' }],
    };
  }
  return { value: cagrValue / Math.abs(maxDrawdown), warnings: [] };
}

export function worstCompleteCalendarYear(
  equity: EquityPoint[]
): { year: number | null; value: number | null; warnings: ResearchWarning[] } {
  const warnings: ResearchWarning[] = [];
  const byYear = new Map<number, EquityPoint[]>();
  for (const point of equity) {
    const year = Number(point.date.slice(0, 4));
    const rows = byYear.get(year) ?? [];
    rows.push(point);
    byYear.set(year, rows);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  let worstYear: number | null = null;
  let worst = Infinity;

  for (const year of years) {
    const rows = byYear.get(year) ?? [];
    const hasJan = rows.some((r) => r.date.slice(5, 7) === '01');
    const hasDec = rows.some((r) => r.date.slice(5, 7) === '12');
    const prior = byYear.get(year - 1);
    if (!hasJan || !hasDec || !prior || prior.length === 0) continue;
    const startNav = prior[prior.length - 1].nav;
    const endNav = rows[rows.length - 1].nav;
    if (startNav <= 0) continue;
    const yr = endNav / startNav - 1;
    if (yr < worst) {
      worst = yr;
      worstYear = year;
    }
  }

  if (worstYear == null) {
    warnings.push({
      code: 'WORST_YEAR_UNDEFINED',
      message: 'Worst calendar year undefined: no complete Jan–Dec year with a prior year-end NAV',
    });
    return { year: null, value: null, warnings };
  }

  return { year: worstYear, value: worst, warnings };
}
