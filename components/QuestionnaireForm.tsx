'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuestionnaireAnswers, PortfolioPreset, GoldBtcTilt } from '@/lib/types';
import { computeRiskLevel } from '@/lib/portfolioEngine';
import type { QuestionnaireResult } from '@/lib/types';
import { willShowGoldBtc } from '@/lib/schwabLineups';
import { getModelTemplate } from '@/lib/modelTemplates';

const STORAGE_KEY = 'ghostAllocatorQuestionnaire';

export default function QuestionnaireForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<Partial<QuestionnaireAnswers>>({
    drawdownTolerance: 'medium',
    behaviorInCrash: 'hold',
    incomeStability: 'medium',
    complexityPreference: 'simple',
    platform: 'voya_only',
    portfolioPreset: 'standard',
    goldBtcTilt: 'none',
    schwabLineupStyle: 'standard',
    goldInstrument: 'gldm',
    btcInstrument: 'fbtc',
    hasPension: false,
    pensionCoverage: 'none',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Read template query param and apply defaults if valid
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = getModelTemplate(templateId);
      if (template && template.defaults) {
        setSelectedTemplate(template.title);
        setFormData((prev) => {
          const updated = { ...prev };
          updated.selectedTemplateId = templateId; // Persist template ID
          if (template.defaults?.portfolioPreset) {
            updated.portfolioPreset = template.defaults.portfolioPreset;
          }
          if (template.defaults?.riskLevelOverride !== undefined) {
            updated.riskLevelOverride = template.defaults.riskLevelOverride;
          }
          if (template.defaults?.schwabLineupStyle) {
            updated.schwabLineupStyle = template.defaults.schwabLineupStyle;
          }
          return updated;
        });
      } else if (templateId === 'ghostregime-60-30-10') {
        // Legacy support for house preset
        setSelectedTemplate('GhostRegime 60/30/10');
        setFormData((prev) => ({
          ...prev,
          selectedTemplateId: templateId,
          portfolioPreset: 'ghostregime_60_30_10',
        }));
      }
    }
  }, [searchParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.age || formData.age < 18 || formData.age > 100) {
      errors.age = 'Please enter a valid age';
    }
    if (!formData.yearsToGoal || formData.yearsToGoal < 0) {
      errors.yearsToGoal = 'Please enter a valid number of years';
    }
    if (formData.isRetired === undefined) {
      errors.isRetired = 'Please select an option';
    }
    if (!formData.drawdownTolerance) {
      errors.drawdownTolerance = 'Please select an option';
    }
    if (!formData.behaviorInCrash) {
      errors.behaviorInCrash = 'Please select an option';
    }
    if (!formData.incomeStability) {
      errors.incomeStability = 'Please select an option';
    }
    if (!formData.complexityPreference) {
      errors.complexityPreference = 'Please select an option';
    }
    if (!formData.platform) {
      errors.platform = 'Please select an option';
    }
    if (formData.platform === 'voya_and_schwab') {
      if (formData.currentSchwabPct === undefined || formData.currentSchwabPct < 0 || formData.currentSchwabPct > 75) {
        errors.currentSchwabPct = 'Please enter a valid percentage (0-75)';
      }
      if (!formData.schwabPreference) {
        errors.schwabPreference = 'Please select an option';
      }
    }
    if (formData.hasPension === undefined) {
      errors.hasPension = 'Please select an option';
    }
    if (formData.hasPension && !formData.pensionCoverage) {
      errors.pensionCoverage = 'Please select an option';
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    // Ensure pensionCoverage is set to 'none' if hasPension is false
    // Clean up Schwab fields if platform is voya_only
    // Reset portfolio preset to standard if platform is voya_only
    // Reset goldBtcTilt to none if platform is voya_only or preset is house
    const finalFormData = {
      ...formData,
      pensionCoverage: formData.hasPension ? formData.pensionCoverage : 'none',
      currentSchwabPct: formData.platform === 'voya_and_schwab' ? formData.currentSchwabPct : undefined,
      schwabPreference: formData.platform === 'voya_and_schwab' ? formData.schwabPreference : undefined,
      portfolioPreset: formData.platform === 'voya_and_schwab' ? (formData.portfolioPreset ?? 'standard') : 'standard',
      goldBtcTilt:
        formData.platform === 'voya_and_schwab' &&
        (formData.portfolioPreset ?? 'standard') === 'standard' &&
        (formData.schwabLineupStyle ?? 'standard') === 'standard'
          ? (formData.goldBtcTilt ?? 'none')
          : 'none',
      schwabLineupStyle:
        formData.platform === 'voya_and_schwab' &&
        (formData.portfolioPreset ?? 'standard') === 'standard'
          ? (formData.schwabLineupStyle ?? 'standard')
          : 'standard',
      goldInstrument: formData.goldInstrument ?? 'gldm',
      btcInstrument: formData.btcInstrument ?? 'fbtc',
    } as QuestionnaireAnswers;

    const answers = finalFormData;
    const riskLevel = computeRiskLevel(answers);
    const result: QuestionnaireResult = { answers, riskLevel };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    router.push('/builder');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      {selectedTemplate && (
        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
          <p className="font-medium">Template selected: {selectedTemplate}</p>
          <p className="mt-1 text-amber-200/80">You can change anything below.</p>
          {formData.riskLevelOverride !== undefined && (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => {
                  const { riskLevelOverride, ...rest } = prev;
                  return rest;
                });
              }}
              className="mt-2 text-[11px] text-amber-300 underline hover:text-amber-200"
            >
              Reset to computed risk
            </button>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">Age</label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) })
            }
            className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-0"
            min="18"
            max="100"
          />
          {errors.age && (
            <p className="mt-1 text-xs text-red-400">{errors.age}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
            Years to goal / retirement
          </label>
          <input
            type="number"
            value={formData.yearsToGoal || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearsToGoal: parseInt(e.target.value),
              })
            }
            className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-0"
            min="0"
          />
          {errors.yearsToGoal && (
            <p className="mt-1 text-xs text-red-400">{errors.yearsToGoal}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Are you currently retired?
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="isRetired"
              value="yes"
              checked={formData.isRetired === true}
              onChange={() => setFormData({ ...formData, isRetired: true })}
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="isRetired"
              value="no"
              checked={formData.isRetired === false}
              onChange={() => setFormData({ ...formData, isRetired: false })}
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">No</span>
          </label>
        </div>
        {errors.isRetired && (
          <p className="mt-1 text-xs text-red-400">{errors.isRetired}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Drawdown tolerance
        </label>
        <select
          value={formData.drawdownTolerance || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              drawdownTolerance: e.target.value as 'low' | 'medium' | 'high',
            })
          }
          className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-0"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {errors.drawdownTolerance && (
          <p className="mt-1 text-xs text-red-400">
            {errors.drawdownTolerance}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Behavior in a big crash (like 2020/2022)
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="behaviorInCrash"
              value="panic_sell"
              checked={formData.behaviorInCrash === 'panic_sell'}
              onChange={() =>
                setFormData({ ...formData, behaviorInCrash: 'panic_sell' })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">
              I&apos;d probably panic sell
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="behaviorInCrash"
              value="hold"
              checked={formData.behaviorInCrash === 'hold'}
              onChange={() =>
                setFormData({ ...formData, behaviorInCrash: 'hold' })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">I&apos;d probably hold</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="behaviorInCrash"
              value="buy_more"
              checked={formData.behaviorInCrash === 'buy_more'}
              onChange={() =>
                setFormData({ ...formData, behaviorInCrash: 'buy_more' })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">
              I&apos;d probably buy more
            </span>
          </label>
        </div>
        {errors.behaviorInCrash && (
          <p className="mt-1 text-xs text-red-400">{errors.behaviorInCrash}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Income stability
        </label>
        <select
          value={formData.incomeStability || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              incomeStability: e.target.value as 'low' | 'medium' | 'high',
            })
          }
          className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-0"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {errors.incomeStability && (
          <p className="mt-1 text-xs text-red-400">
            {errors.incomeStability}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Preference for complexity
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="complexityPreference"
              value="simple"
              checked={formData.complexityPreference === 'simple'}
              onChange={() =>
                setFormData({ ...formData, complexityPreference: 'simple' })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">Keep it simple</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="complexityPreference"
              value="moderate"
              checked={formData.complexityPreference === 'moderate'}
              onChange={() =>
                setFormData({
                  ...formData,
                  complexityPreference: 'moderate',
                })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">
              I&apos;m okay with some complexity
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="complexityPreference"
              value="advanced"
              checked={formData.complexityPreference === 'advanced'}
              onChange={() =>
                setFormData({ ...formData, complexityPreference: 'advanced' })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">
              Give me the advanced stuff
            </span>
          </label>
        </div>
        {errors.complexityPreference && (
          <p className="mt-1 text-xs text-red-400">
            {errors.complexityPreference}
          </p>
        )}
      </div>

      {/* Platform / account structure */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Where is your 457 invested today?
        </p>
        <div className="space-y-1.5 text-sm text-zinc-200">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="platform"
              value="voya_only"
              checked={formData.platform === 'voya_only'}
              onChange={() =>
                setFormData({
                  ...formData,
                  platform: 'voya_only',
                  currentSchwabPct: undefined,
                  schwabPreference: undefined,
                  goldBtcTilt: 'none', // Reset tilt when switching to Voya-only
                  schwabLineupStyle: 'standard', // Reset lineup style
                  goldInstrument: 'gldm', // Reset instruments
                  btcInstrument: 'fbtc',
                })
              }
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <span>Voya core menu only (no Schwab BrokerageLink)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="platform"
              value="voya_and_schwab"
              checked={formData.platform === 'voya_and_schwab'}
              onChange={() =>
                setFormData({
                  ...formData,
                  platform: 'voya_and_schwab',
                  currentSchwabPct: formData.currentSchwabPct ?? 50,
                  schwabPreference: formData.schwabPreference ?? 'stay_low',
                })
              }
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <span>Mix of Voya core menu and Schwab BrokerageLink</span>
          </label>
        </div>
        {errors.platform && (
          <p className="mt-1 text-xs text-red-400">{errors.platform}</p>
        )}

        {formData.platform === 'voya_and_schwab' && (
          <div className="mt-2 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
                Roughly what % is in Schwab now? (max 75%)
              </label>
              <input
                type="number"
                min={0}
                max={75}
                value={formData.currentSchwabPct ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentSchwabPct: Number(e.target.value || 0),
                  })
                }
                className="w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-0"
                placeholder="e.g. 50"
              />
              {errors.currentSchwabPct && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.currentSchwabPct}
                </p>
              )}
            </div>
            <div className="space-y-1 text-sm text-zinc-200">
              <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
                Schwab allocation preference
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schwabPreference"
                  value="stay_low"
                  checked={formData.schwabPreference === 'stay_low'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      schwabPreference: 'stay_low',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>I&apos;d rather keep it closer to where it is</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schwabPreference"
                  value="use_full_75"
                  checked={formData.schwabPreference === 'use_full_75'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      schwabPreference: 'use_full_75',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>I&apos;m fine going up to the 75% cap for more flexibility</span>
              </label>
            </div>
            {errors.schwabPreference && (
              <p className="mt-1 text-xs text-red-400">
                {errors.schwabPreference}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Preset Selection */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Portfolio preset
        </p>
        <div className="space-y-1.5 text-sm text-zinc-200">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="portfolioPreset"
              value="standard"
              checked={(formData.portfolioPreset ?? 'standard') === 'standard'}
              onChange={() =>
                setFormData({
                  ...formData,
                  portfolioPreset: 'standard',
                  // Keep tilt if platform is still Voya+Schwab, otherwise reset
                  goldBtcTilt:
                    formData.platform === 'voya_and_schwab'
                      ? formData.goldBtcTilt ?? 'none'
                      : 'none',
                })
              }
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <span>Standard (Ghost sleeves)</span>
          </label>
          <label
            className={`flex items-center gap-2 ${
              formData.platform !== 'voya_and_schwab'
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <input
              type="radio"
              name="portfolioPreset"
              value="ghostregime_60_30_10"
              checked={formData.portfolioPreset === 'ghostregime_60_30_10'}
              onChange={() =>
                setFormData({
                  ...formData,
                  portfolioPreset: 'ghostregime_60_30_10',
                  goldBtcTilt: 'none', // Reset tilt when switching to house preset
                })
              }
              disabled={formData.platform !== 'voya_and_schwab'}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <span>House Model: GhostRegime 60/30/10</span>
          </label>
          <label
            className={`flex items-center gap-2 ${
              formData.platform !== 'voya_and_schwab'
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <input
              type="radio"
              name="portfolioPreset"
              value="ghostregime_60_25_15"
              checked={formData.portfolioPreset === 'ghostregime_60_25_15'}
              onChange={() =>
                setFormData({
                  ...formData,
                  portfolioPreset: 'ghostregime_60_25_15',
                  goldBtcTilt: 'none', // Reset tilt when switching to house preset
                })
              }
              disabled={formData.platform !== 'voya_and_schwab'}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <span>House Model: GhostRegime 60/25/15 (optional)</span>
          </label>
        </div>
        {formData.platform !== 'voya_and_schwab' && (
          <p className="text-xs text-zinc-400 mt-1">
            House models require Schwab (or another brokerage).
          </p>
        )}
      </div>

      {/* Optional Gold + Bitcoin Tilt (Schwab only, Standard preset only) */}
      {formData.platform === 'voya_and_schwab' &&
        (formData.portfolioPreset ?? 'standard') === 'standard' && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
              Optional tilts (Schwab only)
            </p>
            <div className="space-y-1.5 text-sm text-zinc-200">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="goldBtcTilt"
                  value="none"
                  checked={(formData.goldBtcTilt ?? 'none') === 'none'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      goldBtcTilt: 'none',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>None</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="goldBtcTilt"
                  value="gold10_btc5"
                  checked={formData.goldBtcTilt === 'gold10_btc5'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      goldBtcTilt: 'gold10_btc5',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>10% Gold / 5% Bitcoin</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="goldBtcTilt"
                  value="gold15_btc5"
                  checked={formData.goldBtcTilt === 'gold15_btc5'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      goldBtcTilt: 'gold15_btc5',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>15% Gold / 5% Bitcoin</span>
              </label>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              This adjusts the Schwab lineup only (percent of your Schwab slice).
            </p>
          </div>
        )}

      {/* Schwab ETF Lineup Style (Schwab only, Standard preset only) */}
      {formData.platform === 'voya_and_schwab' &&
        (formData.portfolioPreset ?? 'standard') === 'standard' && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
              Schwab ETF lineup style
            </p>
            <div className="space-y-1.5 text-sm text-zinc-200">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schwabLineupStyle"
                  value="standard"
                  checked={(formData.schwabLineupStyle ?? 'standard') === 'standard'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      schwabLineupStyle: 'standard',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>Standard (core index ETFs)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="schwabLineupStyle"
                  value="simplify"
                  checked={formData.schwabLineupStyle === 'simplify'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      schwabLineupStyle: 'simplify',
                      // Disable tilt when simplify mode is selected
                      goldBtcTilt: 'none',
                    })
                  }
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>Simplify mode (alts/hedges/convexity)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Advanced
                </span>
              </label>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Simplify mode uses building-block ETFs with options overlays and alternative strategies.
            </p>
          </div>
        )}

      {/* Instrument Wrappers (only show when Gold/BTC will appear) */}
      {formData.platform === 'voya_and_schwab' && (() => {
        const preset = (formData.portfolioPreset ?? 'standard') as PortfolioPreset;
        const tilt = (formData.goldBtcTilt ?? 'none') as GoldBtcTilt;
        const { willShowGold, willShowBtc } = willShowGoldBtc(preset, tilt);
        return willShowGold || willShowBtc;
      })() && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
            Instrument wrappers (advanced)
          </p>
          {(() => {
            const preset = (formData.portfolioPreset ?? 'standard') as PortfolioPreset;
            const tilt = (formData.goldBtcTilt ?? 'none') as GoldBtcTilt;
            const { willShowGold, willShowBtc } = willShowGoldBtc(preset, tilt);
            return (
              <>
                {willShowGold && (
                  <div className="space-y-1.5 text-sm text-zinc-200 mb-3">
                    <p className="text-xs text-zinc-400 mb-1">Gold instrument:</p>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="goldInstrument"
                        value="gldm"
                        checked={(formData.goldInstrument ?? 'gldm') === 'gldm'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            goldInstrument: 'gldm',
                          })
                        }
                        className="h-3.5 w-3.5 accent-amber-400"
                      />
                      <span>GLDM (spot)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="goldInstrument"
                        value="ygld"
                        checked={formData.goldInstrument === 'ygld'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            goldInstrument: 'ygld',
                          })
                        }
                        className="h-3.5 w-3.5 accent-amber-400"
                      />
                      <span>YGLD (income wrapper)</span>
                    </label>
                  </div>
                )}
                {willShowBtc && (
                  <div className="space-y-1.5 text-sm text-zinc-200">
                    <p className="text-xs text-zinc-400 mb-1">Bitcoin instrument:</p>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="btcInstrument"
                        value="fbtc"
                        checked={(formData.btcInstrument ?? 'fbtc') === 'fbtc'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            btcInstrument: 'fbtc',
                          })
                        }
                        className="h-3.5 w-3.5 accent-amber-400"
                      />
                      <span>FBTC (spot)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="btcInstrument"
                        value="maxi"
                        checked={formData.btcInstrument === 'maxi'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            btcInstrument: 'maxi',
                          })
                        }
                        className="h-3.5 w-3.5 accent-amber-400"
                      />
                      <span>MAXI (income wrapper)</span>
                    </label>
                  </div>
                )}
              </>
            );
          })()}
          <p className="text-xs text-zinc-400 mt-1">
            Income wrappers (YGLD/MAXI) use options overlays and may have ROC-style distributions.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Do you have (or expect) a pension that will pay you a monthly benefit
          in retirement?
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="hasPension"
              value="yes"
              checked={formData.hasPension === true}
              onChange={() => setFormData({ ...formData, hasPension: true })}
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="hasPension"
              value="no"
              checked={formData.hasPension === false}
              onChange={() =>
                setFormData({
                  ...formData,
                  hasPension: false,
                  pensionCoverage: 'none',
                })
              }
              className="mr-2"
            />
            <span className="text-sm text-zinc-300">No</span>
          </label>
        </div>
        {errors.hasPension && (
          <p className="mt-1 text-xs text-red-400">{errors.hasPension}</p>
        )}
      </div>

      {formData.hasPension && (
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
            How much of your basic retirement expenses (housing, utilities,
            groceries, basic insurance) will be covered by guaranteed income like
            pension + Social Security?
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="pensionCoverage"
                value="none"
                checked={formData.pensionCoverage === 'none'}
                onChange={() =>
                  setFormData({ ...formData, pensionCoverage: 'none' })
                }
                className="mr-2"
              />
              <span className="text-sm text-zinc-300">
                None or almost none
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="pensionCoverage"
                value="less_than_half"
                checked={formData.pensionCoverage === 'less_than_half'}
                onChange={() =>
                  setFormData({
                    ...formData,
                    pensionCoverage: 'less_than_half',
                  })
                }
                className="mr-2"
              />
              <span className="text-sm text-zinc-300">Less than half</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="pensionCoverage"
                value="about_half"
                checked={formData.pensionCoverage === 'about_half'}
                onChange={() =>
                  setFormData({ ...formData, pensionCoverage: 'about_half' })
                }
                className="mr-2"
              />
              <span className="text-sm text-zinc-300">About half</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="pensionCoverage"
                value="most_or_all"
                checked={formData.pensionCoverage === 'most_or_all'}
                onChange={() =>
                  setFormData({ ...formData, pensionCoverage: 'most_or_all' })
                }
                className="mr-2"
              />
              <span className="text-sm text-zinc-300">
                Most or all of my basics are covered
              </span>
            </label>
          </div>
          {errors.pensionCoverage && (
            <p className="mt-1 text-xs text-red-400">
              {errors.pensionCoverage}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
      >
        Build My Portfolio
      </button>
    </form>
  );
}

