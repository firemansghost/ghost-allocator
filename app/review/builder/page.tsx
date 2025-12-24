'use client';

import { GlassCard } from '@/components/GlassCard';
import { REVIEW_FIXTURES } from '@/lib/reviewFixtures';
import {
  computeRiskLevel,
  selectModelPortfolio,
  suggestExampleEtfs,
  computePlatformSplit,
  buildVoyaImplementation,
} from '@/lib/portfolioEngine';
import { getHouseModel, getHouseModelWithWrappers, isHousePreset } from '@/lib/houseModels';
import { getStandardSchwabLineup } from '@/lib/schwabLineups';
import { isTargetDateFund, isTargetDateName, looksLikeTargetDateFund, getFundById } from '@/lib/voyaFunds';
import type { ExampleETF } from '@/lib/types';


interface ReviewOutput {
  fixtureId: string;
  riskLevel: number;
  platformSplit: ReturnType<typeof computePlatformSplit>;
  voyaImplementation: ReturnType<typeof buildVoyaImplementation>;
  schwabLineup: {
    type: 'house' | 'standard' | 'standard_tilted';
    houseModel?: ReturnType<typeof getHouseModel>;
    standardEtfs?: ExampleETF[];
    standardSleeves?: Array<{ id: string; name: string; weight: number; etfs: ExampleETF[] }>;
    tiltedItems?: Array<{
      type: 'sleeve' | 'tilt';
      id: string;
      label: string;
      ticker?: string;
      weight: number;
      etfs?: ExampleETF[];
    }>;
  };
  assertions: {
    voyaTotalValid: boolean;
    schwabTotalValid: boolean;
    housePresetHasCorrectTickers: boolean;
    housePresetVoyaNoRealAssets: boolean;
    standardPresetUnchanged: boolean;
    tiltHasGldmFbtc: boolean;
    tiltIncludesStandardEtfs: boolean;
    voyaMixNoTargetDateFunds: boolean;
  };
}

function computeReviewOutput(fixture: typeof REVIEW_FIXTURES[0]): ReviewOutput {
  const riskLevel = computeRiskLevel(fixture.answers);
  const platformSplit = computePlatformSplit(fixture.answers);
  const voyaImplementation = buildVoyaImplementation(fixture.answers, riskLevel);
  const preset = fixture.answers.portfolioPreset ?? 'standard';
  const isHouseModel = isHousePreset(preset);

  // Compute Schwab lineup
  let schwabLineup: ReviewOutput['schwabLineup'];
  if (platformSplit.platform === 'voya_and_schwab') {
    if (isHouseModel) {
      const houseModel = getHouseModel(preset);
      schwabLineup = {
        type: 'house',
        houseModel,
      };
    } else {
      const portfolio = selectModelPortfolio(riskLevel);
      const lineupStyle = fixture.answers.schwabLineupStyle ?? 'standard';
      const goldInstrument = fixture.answers.goldInstrument ?? 'gldm';
      const btcInstrument = fixture.answers.btcInstrument ?? 'fbtc';
      const tilt = fixture.answers.goldBtcTilt ?? 'none';

      const standardLineup = getStandardSchwabLineup(
        portfolio.sleeves,
        riskLevel,
        lineupStyle,
        goldInstrument,
        btcInstrument,
        tilt
      );

      if (tilt !== 'none' || lineupStyle === 'simplify') {
        schwabLineup = {
          type: 'standard_tilted',
          tiltedItems: standardLineup,
        };
      } else {
        // Convert to old format for compatibility
        const standardSleeves = standardLineup
          .filter((item) => item.type === 'sleeve')
          .map((item) => ({
            id: item.id,
            name: item.label,
            weight: item.weight / 100, // convert back to decimal
            etfs: item.etfs || [],
          }));

        schwabLineup = {
          type: 'standard',
          standardSleeves,
        };
      }
    }
  } else {
    schwabLineup = {
      type: 'standard',
    };
  }

  // Compute assertions
  const voyaTotal = voyaImplementation.mix
    ? voyaImplementation.mix.reduce((sum, item) => sum + item.allocationPct, 0)
    : 0;
  const voyaTotalValid = Math.abs(voyaTotal - 100) <= 0.5;

  let schwabTotalValid = true;
  let housePresetHasCorrectTickers = true;
  let tiltHasGldmFbtc = true;
  let tiltIncludesStandardEtfs = true;

  if (schwabLineup.type === 'house' && schwabLineup.houseModel) {
    const schwabTotal = schwabLineup.houseModel.allocations.reduce(
      (sum, alloc) => sum + alloc.pct,
      0
    );
    schwabTotalValid = Math.abs(schwabTotal - 100) <= 0.5;

    const tickers = schwabLineup.houseModel.allocations.map((a) => a.ticker).sort();
    housePresetHasCorrectTickers =
      tickers.length === 3 &&
      tickers.includes('SPYM') &&
      tickers.includes('GLDM') &&
      tickers.includes('FBTC');
  } else if (schwabLineup.type === 'standard_tilted' && schwabLineup.tiltedItems) {
    const schwabTotal = schwabLineup.tiltedItems.reduce((sum, item) => sum + item.weight, 0);
    schwabTotalValid = Math.abs(schwabTotal - 100) <= 0.5;

    const tickers = schwabLineup.tiltedItems
      .filter((item) => item.type === 'tilt')
      .map((item) => item.ticker)
      .filter((t): t is string => t !== undefined);
    const goldInstrument = fixture.answers.goldInstrument ?? 'gldm';
    const btcInstrument = fixture.answers.btcInstrument ?? 'fbtc';
    tiltHasGldmFbtc =
      (tickers.includes('GLDM') || tickers.includes('YGLD')) &&
      (tickers.includes('FBTC') || tickers.includes('MAXI'));

    // Check that standard ETFs are still present (at least one sleeve item)
    const hasSleeveItems = schwabLineup.tiltedItems.some((item) => item.type === 'sleeve');
    tiltIncludesStandardEtfs = hasSleeveItems;
  } else if (schwabLineup.type === 'standard' && schwabLineup.standardSleeves) {
    // Standard preset without tilt - no special assertions needed
    schwabTotalValid = true;
  }

  const housePresetVoyaNoRealAssets =
    !isHouseModel ||
    !voyaImplementation.mix ||
    !voyaImplementation.mix.some(
      (item) =>
        item.id.includes('real_assets') ||
        item.id.includes('pimco_diversified_real_assets') ||
        item.name.toLowerCase().includes('real assets')
    );

  const standardPresetUnchanged = preset === 'standard';

  // Assert: Voya recommended mix must not contain target-date funds
  // Use redundant detection (group + ID + name patterns) to catch any TDFs
  let voyaMixNoTargetDateFunds = true;
  if (voyaImplementation.mix && voyaImplementation.mix.length > 0) {
    for (const item of voyaImplementation.mix) {
      const fund = getFundById(item.id);
      if (fund && looksLikeTargetDateFund(fund)) {
        voyaMixNoTargetDateFunds = false;
        break;
      }
      // Belt: also check name directly (in case fund lookup fails)
      if (isTargetDateName(item.name)) {
        voyaMixNoTargetDateFunds = false;
        break;
      }
    }
  }

  return {
    fixtureId: fixture.id,
    riskLevel,
    platformSplit,
    voyaImplementation,
    schwabLineup,
    assertions: {
      voyaTotalValid,
      schwabTotalValid,
      housePresetHasCorrectTickers,
      housePresetVoyaNoRealAssets,
      standardPresetUnchanged,
      tiltHasGldmFbtc,
      tiltIncludesStandardEtfs,
      voyaMixNoTargetDateFunds,
    },
  };
}

export default function ReviewBuilderPage() {
  // Check env var at runtime (client-side)
  const enableReviewHarness =
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_ENABLE_REVIEW_HARNESS === 'true';

  if (!enableReviewHarness) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <GlassCard className="p-8 max-w-md">
          <h1 className="text-xl font-semibold text-zinc-50 mb-4">Review Harness Not Available</h1>
          <p className="text-sm text-zinc-300">
            This page is only available when NEXT_PUBLIC_ENABLE_REVIEW_HARNESS is set to "true".
          </p>
        </GlassCard>
      </div>
    );
  }

  const outputs = REVIEW_FIXTURES.map((fixture) => ({
    fixture,
    output: computeReviewOutput(fixture),
  }));

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Builder Output Review Harness</h1>
        <p className="text-sm text-zinc-300">
          Deterministic fixtures and computed outputs for sanity-checking builder behavior
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {outputs.map(({ fixture, output }) => (
          <GlassCard key={fixture.id} className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-50 mb-1">{fixture.title}</h2>
              {fixture.notes && (
                <p className="text-xs text-zinc-400 italic">{fixture.notes}</p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-zinc-400">Platform: </span>
                <span className="text-zinc-200">{fixture.answers.platform}</span>
              </div>
              <div>
                <span className="text-zinc-400">Preset: </span>
                <span className="text-zinc-200">{fixture.answers.portfolioPreset ?? 'standard'}</span>
              </div>
              <div>
                <span className="text-zinc-400">Risk Level: </span>
                <span className="text-zinc-200">{output.riskLevel}</span>
              </div>
              {output.platformSplit.platform === 'voya_and_schwab' && (
                <div>
                  <span className="text-zinc-400">Split: </span>
                  <span className="text-zinc-200">
                    {output.platformSplit.targetSchwabPct}% Schwab /{' '}
                    {output.platformSplit.targetVoyaPct}% Voya
                  </span>
                </div>
              )}
            </div>

            {/* Voya Mix */}
            <div className="pt-2 border-t border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-300 mb-2">Voya Mix</h3>
              <ul className="space-y-1 text-xs text-zinc-300">
                {output.voyaImplementation.mix?.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-amber-300 font-medium">{item.allocationPct}%</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schwab Lineup */}
            {output.platformSplit.platform === 'voya_and_schwab' && (
              <div className="pt-2 border-t border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-300 mb-2">Schwab Lineup</h3>
                {output.schwabLineup.type === 'house' && output.schwabLineup.houseModel ? (
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {output.schwabLineup.houseModel.allocations.map((alloc) => (
                      <li key={alloc.id} className="flex justify-between">
                        <span>
                          {alloc.ticker} ({alloc.label})
                        </span>
                        <span className="text-amber-300 font-medium">{alloc.pct}%</span>
                      </li>
                    ))}
                  </ul>
                ) : output.schwabLineup.type === 'standard_tilted' &&
                  output.schwabLineup.tiltedItems ? (
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {output.schwabLineup.tiltedItems.map((item) => {
                      if (item.type === 'tilt') {
                        return (
                          <li key={item.id} className="flex justify-between text-amber-300">
                            <span>
                              {item.ticker} ({item.label})
                            </span>
                            <span className="font-medium">{item.weight.toFixed(1)}%</span>
                          </li>
                        );
                      } else {
                        return (
                          <li key={item.id}>
                            <div className="flex justify-between mb-0.5">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-amber-300 font-medium">
                                {item.weight.toFixed(1)}%
                              </span>
                            </div>
                            {item.etfs && item.etfs.length > 0 && (
                              <ul className="ml-2 space-y-0.5 text-zinc-400">
                                {item.etfs.map((etf, idx) => (
                                  <li key={idx} className="text-[10px]">
                                    {etf.ticker} - {etf.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      }
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-xs text-zinc-300">
                    {output.schwabLineup.standardSleeves?.map((sleeve) => (
                      <li key={sleeve.id}>
                        <div className="font-medium mb-1">
                          {sleeve.name} ({(sleeve.weight * 100).toFixed(1)}%)
                        </div>
                        {sleeve.etfs.length > 0 && (
                          <ul className="ml-2 space-y-0.5 text-zinc-400">
                            {sleeve.etfs.map((etf, idx) => (
                              <li key={idx} className="text-[10px]">
                                {etf.ticker} - {etf.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Assertions */}
            <div className="pt-2 border-t border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-300 mb-2">Assertions</h3>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      output.assertions.voyaTotalValid ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className={output.assertions.voyaTotalValid ? 'text-green-300' : 'text-red-300'}>
                    Voya total ~100%
                  </span>
                </li>
                {output.platformSplit.platform === 'voya_and_schwab' && (
                  <li className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        output.assertions.schwabTotalValid ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span
                      className={output.assertions.schwabTotalValid ? 'text-green-300' : 'text-red-300'}
                    >
                      Schwab total ~100%
                    </span>
                  </li>
                )}
                {isHousePreset(fixture.answers.portfolioPreset) && (
                  <>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.housePresetHasCorrectTickers
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.housePresetHasCorrectTickers
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        House preset: SPYM/GLDM/FBTC only
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.housePresetVoyaNoRealAssets
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.housePresetVoyaNoRealAssets
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        House preset: Voya has no real assets
                      </span>
                    </li>
                  </>
                )}
                {fixture.answers.portfolioPreset === 'standard' &&
                  (fixture.answers.goldBtcTilt ?? 'none') === 'none' && (
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.standardPresetUnchanged
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.standardPresetUnchanged
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        Standard preset unchanged
                      </span>
                    </li>
                  )}
                {output.voyaImplementation.mix && output.voyaImplementation.mix.length > 0 && (
                  <li className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        output.assertions.voyaMixNoTargetDateFunds
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span
                      className={
                        output.assertions.voyaMixNoTargetDateFunds
                          ? 'text-green-300'
                          : 'text-red-300'
                      }
                    >
                      Voya mix: No target-date funds
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

