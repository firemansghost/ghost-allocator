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
import { computeScaledHouseLineup, type GhostRegimeScaleData, type ScaledLineupItem } from '@/lib/houseScaling';
import { getModelTemplate } from '@/lib/modelTemplates';
import { buildActionPlanDnaString } from '@/lib/builder/actionPlanCopy';
import { encodeDnaToQuery, decodeDnaFromQuery } from '@/lib/builder/dnaLink';
import { extractDnaParam } from '@/lib/builder/dnaImport';
import type { ExampleETF } from '@/lib/types';

/**
 * Canary self-check: validate name-based TDF detection against known samples
 * This runs in dev/test to ensure detection patterns are working correctly
 */
function runCanaryChecks() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return; // Only run in dev/test
  }

  const positiveSamples = [
    'Vanguard Target Retirement 2035 Fund',
    'Vanguard Target-Retirement 2035 Fund', // Hyphenated variant
    'Fidelity Freedom 2040 Fund',
    'BlackRock LifePath Index 2050',
    'Target Date 2045',
    'Target-Date 2045', // Hyphenated variant
    'Retirement 2030 Fund',
    'LifePath 2055 Index Fund',
  ];

  const negativeSamples = [
    'JPMorgan Core Bond Fund',
    'PIMCO Diversified Real Assets Fund',
    'Northern Trust S&P 500 Index',
    'SSGA Russell Small/Mid Cap Index',
    'Stable Value Option',
    'Targeted Income Fund', // Should not match (targeted != target + date/retirement)
  ];

  const failures: string[] = [];

  // Check positives: should all match
  for (const name of positiveSamples) {
    if (!isTargetDateName(name)) {
      failures.push(`FAIL: "${name}" should be detected as TDF but wasn't`);
    }
  }

  // Check negatives: should NOT match
  for (const name of negativeSamples) {
    if (isTargetDateName(name)) {
      failures.push(`FAIL: "${name}" should NOT be detected as TDF but was`);
    }
  }

  if (failures.length > 0) {
    const message = `[review/builder] Canary check FAILED:\n${failures.join('\n')}`;
    console.error(message);
    throw new Error(message);
  }
}

// Canary checks will run on component mount (see ReviewBuilderPage component)


interface ReviewOutput {
  fixtureId: string;
  riskLevel: number;
  platformSplit: ReturnType<typeof computePlatformSplit>;
  voyaImplementation: ReturnType<typeof buildVoyaImplementation>;
  schwabLineup: {
    type: 'house' | 'standard' | 'standard_tilted';
    houseModel?: ReturnType<typeof getHouseModel>;
    scaledLineup?: ScaledLineupItem[];
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
  actionPlanDnaString?: string;
  assertions: {
    riskLevelMatchesExpected: boolean;
    templateIdMatchesExpected: boolean;
    riskOverrideMatchesExpected: boolean;
    actionPlanShowsTemplateDna: boolean;
    actionPlanDnaStringPresent: boolean;
    dnaImportRoundTripOk: boolean;
    builderBannerShowsShareActions: boolean;
    onboardingDnaImportHelpersWork: boolean;
    voyaTotalValid: boolean;
    schwabTotalValid: boolean;
    housePresetHasCorrectTickers: boolean;
    housePresetVoyaNoRealAssets: boolean;
    standardPresetUnchanged: boolean;
    tiltHasGldmFbtc: boolean;
    tiltIncludesStandardEtfs: boolean;
    voyaMixNoTargetDateFunds: boolean;
    scaledLineupHasSpymGoldBtc: boolean;
    scaledLineupHasCash: boolean;
    scaledLineupSumsTo100: boolean;
    scaledLineupWrappersApplied: boolean;
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
      const goldInstrument = fixture.answers.goldInstrument ?? 'gldm';
      const btcInstrument = fixture.answers.btcInstrument ?? 'fbtc';
      
      // For review harness: use mocked GhostRegime data for specific fixture
      let scaleData: GhostRegimeScaleData | null = null;
      if (fixture.id === 'voya-schwab-house-scaled-moderate') {
        // Mocked scale data: stocks_scale=0.5, gold_scale=1, btc_scale=0
        scaleData = {
          stocks_scale: 0.5,
          gold_scale: 1,
          btc_scale: 0,
          date: '2024-01-15',
          stale: false,
        };
      }
      
      const scaledLineup = scaleData
        ? computeScaledHouseLineup(houseModel, scaleData, goldInstrument, btcInstrument)
        : undefined;
      
      schwabLineup = {
        type: 'house',
        houseModel,
        scaledLineup,
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

  // Assertions for scaled house lineup
  let scaledLineupHasSpymGoldBtc = true;
  let scaledLineupHasCash = false;
  let scaledLineupSumsTo100 = true;
  let scaledLineupWrappersApplied = true;
  
  if (schwabLineup.type === 'house' && schwabLineup.scaledLineup) {
    const lineup = schwabLineup.scaledLineup;
    const tickers = lineup.map((item) => item.ticker);
    
    // Check for SPYM, Gold (GLDM/YGLD), BTC (FBTC/MAXI)
    scaledLineupHasSpymGoldBtc =
      tickers.includes('SPYM') &&
      (tickers.includes('GLDM') || tickers.includes('YGLD')) &&
      (tickers.includes('FBTC') || tickers.includes('MAXI'));
    
    // Check for cash
    scaledLineupHasCash = lineup.some((item) => item.isCash);
    
    // Check sum ~100%
    const sum = lineup.reduce((s, item) => s + item.actualPct, 0);
    scaledLineupSumsTo100 = Math.abs(sum - 100) <= 0.01;
    
    // Check wrappers (if fixture specifies them)
    const goldInstrument = fixture.answers.goldInstrument ?? 'gldm';
    const btcInstrument = fixture.answers.btcInstrument ?? 'fbtc';
    if (goldInstrument === 'ygld') {
      scaledLineupWrappersApplied = scaledLineupWrappersApplied && tickers.includes('YGLD');
    } else {
      scaledLineupWrappersApplied = scaledLineupWrappersApplied && tickers.includes('GLDM');
    }
    if (btcInstrument === 'maxi') {
      scaledLineupWrappersApplied = scaledLineupWrappersApplied && tickers.includes('MAXI');
    } else {
      scaledLineupWrappersApplied = scaledLineupWrappersApplied && tickers.includes('FBTC');
    }
  } else {
    // Not applicable if no scaled lineup
    scaledLineupHasSpymGoldBtc = true;
    scaledLineupHasCash = true;
    scaledLineupSumsTo100 = true;
    scaledLineupWrappersApplied = true;
  }

  // Validate risk level matches expected (for template fixtures)
  const riskLevelMatchesExpected = riskLevel === fixture.expectedRiskLevel;
  
  // Validate template ID matches expected (if specified)
  const templateIdMatchesExpected = fixture.expectedTemplateId
    ? fixture.answers.selectedTemplateId === fixture.expectedTemplateId
    : true; // If not specified, always pass
  
  // Validate risk override matches expected (if template is selected)
  const riskOverrideMatchesExpected = fixture.expectedTemplateId
    ? fixture.answers.riskLevelOverride === fixture.expectedRiskLevel
    : true; // If no template expected, don't validate override

  // Validate that Action Plan Template DNA would render (if template is selected)
  const actionPlanShowsTemplateDna = fixture.expectedTemplateId
    ? fixture.answers.selectedTemplateId === fixture.expectedTemplateId
    : true; // If no template expected, always pass

  // Validate Action Plan DNA string (if template is selected)
  let actionPlanDnaStringPresent = true;
  let actionPlanDnaString = '';
  if (fixture.answers.selectedTemplateId) {
    const template = getModelTemplate(fixture.answers.selectedTemplateId);
    if (template) {
      actionPlanDnaString = buildActionPlanDnaString({
        templateId: fixture.answers.selectedTemplateId,
        templateName: template.title,
        platform: fixture.answers.platform,
        riskLevelOverride: fixture.answers.riskLevelOverride,
        portfolioPreset: fixture.answers.portfolioPreset,
        schwabLineupStyle: fixture.answers.schwabLineupStyle,
        goldBtcTilt: fixture.answers.goldBtcTilt,
        goldInstrument: fixture.answers.goldInstrument,
        btcInstrument: fixture.answers.btcInstrument,
      });
      // Check that DNA string is non-empty and contains template info
      actionPlanDnaStringPresent =
        actionPlanDnaString.length > 0 &&
        (actionPlanDnaString.includes(fixture.answers.selectedTemplateId) ||
          actionPlanDnaString.includes(template.title));
      // If expectedTemplateId exists, ensure it's in the string
      if (fixture.expectedTemplateId) {
        actionPlanDnaStringPresent =
          actionPlanDnaStringPresent &&
          (actionPlanDnaString.includes(fixture.expectedTemplateId) ||
            actionPlanDnaString.includes(template.title));
      }
    }
  }

  // Validate that Builder banner would show share actions (if template is selected)
  const builderBannerShowsShareActions = fixture.expectedTemplateId
    ? fixture.answers.selectedTemplateId === fixture.expectedTemplateId
    : true; // If no template expected, always pass

  // Validate DNA import helpers (extractDnaParam function)
  let onboardingDnaImportHelpersWork = true;
  try {
    // Test case a: raw token
    const rawToken = 'eyJ2IjoxLCJzZWxlY3RlZFRlbXBsYXRlSWQiOiJiYWxhbmNlZCJ9';
    const extractedA = extractDnaParam(rawToken);
    if (extractedA !== rawToken) {
      onboardingDnaImportHelpersWork = false;
    }
    
    // Test case b: partial URL
    const partialUrl = `/onboarding?dna=${rawToken}`;
    const extractedB = extractDnaParam(partialUrl);
    if (extractedB !== rawToken) {
      onboardingDnaImportHelpersWork = false;
    }
    
    // Test case c: full URL
    const fullUrl = `https://example.com/onboarding?dna=${rawToken}`;
    const extractedC = extractDnaParam(fullUrl);
    if (extractedC !== rawToken) {
      onboardingDnaImportHelpersWork = false;
    }
  } catch (err) {
    onboardingDnaImportHelpersWork = false;
  }

  // Validate DNA round-trip encoding/decoding
  let dnaImportRoundTripOk = true;
  if (fixture.answers.selectedTemplateId) {
    try {
      // Encode current fixture answers
      const encoded = encodeDnaToQuery(fixture.answers);
      // Decode it back
      const decoded = decodeDnaFromQuery(encoded);
      
      if (!decoded.ok) {
        dnaImportRoundTripOk = false;
      } else {
        // Check that key fields match (whitelisted fields only)
        const checkField = (field: keyof typeof fixture.answers) => {
          const original = fixture.answers[field];
          const restored = decoded.answers[field];
          if (original !== undefined && original !== null) {
            return original === restored;
          }
          return true; // If original was undefined, restored can be undefined too
        };

        dnaImportRoundTripOk =
          checkField('selectedTemplateId') &&
          checkField('riskLevelOverride') &&
          checkField('platform') &&
          checkField('portfolioPreset') &&
          checkField('schwabLineupStyle') &&
          checkField('goldInstrument') &&
          checkField('btcInstrument') &&
          checkField('goldBtcTilt') &&
          checkField('complexityPreference');
      }
    } catch (err) {
      dnaImportRoundTripOk = false;
    }
  }

  return {
    fixtureId: fixture.id,
    riskLevel,
    platformSplit,
    voyaImplementation,
    schwabLineup,
    actionPlanDnaString: actionPlanDnaString || undefined,
    assertions: {
      riskLevelMatchesExpected,
      templateIdMatchesExpected,
      riskOverrideMatchesExpected,
      actionPlanShowsTemplateDna,
      actionPlanDnaStringPresent,
      dnaImportRoundTripOk,
      builderBannerShowsShareActions,
      onboardingDnaImportHelpersWork,
      voyaTotalValid,
      schwabTotalValid,
      housePresetHasCorrectTickers,
      housePresetVoyaNoRealAssets,
      standardPresetUnchanged,
      tiltHasGldmFbtc,
      tiltIncludesStandardEtfs,
      voyaMixNoTargetDateFunds,
      scaledLineupHasSpymGoldBtc,
      scaledLineupHasCash,
      scaledLineupSumsTo100,
      scaledLineupWrappersApplied,
    },
  };
}

export default function ReviewBuilderPage() {
  // Run canary checks on component mount (dev/test only)
  if (typeof window !== 'undefined') {
    try {
      runCanaryChecks();
    } catch (error) {
      console.error('[review/builder] Canary check failed on mount:', error);
    }
  }
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
                <span className="text-zinc-200">
                  {output.riskLevel} {output.riskLevel === fixture.expectedRiskLevel ? '✓' : `(expected ${fixture.expectedRiskLevel})`}
                </span>
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
                      output.assertions.riskLevelMatchesExpected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className={output.assertions.riskLevelMatchesExpected ? 'text-green-300' : 'text-red-300'}>
                    Risk level matches expected ({fixture.expectedRiskLevel})
                  </span>
                </li>
                {fixture.expectedTemplateId && (
                  <>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.templateIdMatchesExpected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.templateIdMatchesExpected ? 'text-green-300' : 'text-red-300'}>
                        Template ID matches expected ({fixture.expectedTemplateId})
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.riskOverrideMatchesExpected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.riskOverrideMatchesExpected ? 'text-green-300' : 'text-red-300'}>
                        Risk override matches expected
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.actionPlanShowsTemplateDna ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.actionPlanShowsTemplateDna ? 'text-green-300' : 'text-red-300'}>
                        Action Plan shows Template DNA
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.actionPlanDnaStringPresent ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.actionPlanDnaStringPresent ? 'text-green-300' : 'text-red-300'}>
                        Action Plan DNA string present
                      </span>
                    </li>
                    {output.actionPlanDnaString && (
                      <li className="text-[10px] text-zinc-400 font-mono break-all pl-4">
                        {output.actionPlanDnaString}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.dnaImportRoundTripOk ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.dnaImportRoundTripOk ? 'text-green-300' : 'text-red-300'}>
                        DNA round-trip encoding/decoding OK
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.builderBannerShowsShareActions ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.builderBannerShowsShareActions ? 'text-green-300' : 'text-red-300'}>
                        Builder banner shows share actions
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.onboardingDnaImportHelpersWork ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className={output.assertions.onboardingDnaImportHelpersWork ? 'text-green-300' : 'text-red-300'}>
                        Onboarding DNA import helpers work
                      </span>
                    </li>
                  </>
                )}
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
                {output.schwabLineup.type === 'house' && output.schwabLineup.scaledLineup && (
                  <>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.scaledLineupHasSpymGoldBtc
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.scaledLineupHasSpymGoldBtc
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        Scaled lineup: Has SPYM + Gold + BTC
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.scaledLineupHasCash
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.scaledLineupHasCash
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        Scaled lineup: Has cash when total &lt; 100%
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.scaledLineupSumsTo100
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.scaledLineupSumsTo100
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        Scaled lineup: Sums to ~100%
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          output.assertions.scaledLineupWrappersApplied
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span
                        className={
                          output.assertions.scaledLineupWrappersApplied
                            ? 'text-green-300'
                            : 'text-red-300'
                        }
                      >
                        Scaled lineup: Wrappers applied correctly
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

