'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuestionnaireAnswers, PortfolioPreset, GoldBtcTilt } from '@/lib/types';
import { computeRiskLevel } from '@/lib/portfolioEngine';
import type { QuestionnaireResult } from '@/lib/types';
import { willShowGoldBtc } from '@/lib/schwabLineups';
import { getModelTemplate } from '@/lib/modelTemplates';
import { decodeDnaFromQuery } from '@/lib/builder/dnaLink';
import { extractDnaParam } from '@/lib/builder/dnaImport';

const STORAGE_KEY = 'ghostAllocatorQuestionnaire';

/**
 * Infer drawdown tolerance from crash behavior
 */
function inferDrawdownTolerance(behaviorInCrash?: 'panic_sell' | 'hold' | 'buy_more'): 'low' | 'medium' | 'high' {
  if (!behaviorInCrash) return 'medium';
  switch (behaviorInCrash) {
    case 'panic_sell':
      return 'low';
    case 'hold':
      return 'medium';
    case 'buy_more':
      return 'high';
    default:
      return 'medium';
  }
}

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
  const [dnaLoadStatus, setDnaLoadStatus] = useState<'success' | 'error' | null>(null);
  const [dnaImportInput, setDnaImportInput] = useState('');
  const [dnaImportStatus, setDnaImportStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [dnaImportMessage, setDnaImportMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [drawdownOverride, setDrawdownOverride] = useState<boolean>(false);

  // Auto-expand Advanced if complexity preference is "advanced"
  useEffect(() => {
    if (formData.complexityPreference === 'advanced' && !showAdvanced) {
      setShowAdvanced(true);
    }
  }, [formData.complexityPreference, showAdvanced]);

  // Read DNA param first (takes precedence over template param)
  useEffect(() => {
    const dnaParam = searchParams.get('dna');
    if (dnaParam) {
      const result = decodeDnaFromQuery(dnaParam);
      if (result.ok) {
        setDnaLoadStatus('success');
        // Apply DNA answers to form with guardrails
        setFormData((prev) => {
          const updated = { ...prev, ...result.answers };
          
          // Apply guardrails: if platform is voya_only, reset house presets
          if (result.answers.platform === 'voya_only') {
            if (updated.portfolioPreset === 'ghostregime_60_30_10' || updated.portfolioPreset === 'ghostregime_60_25_15') {
              updated.portfolioPreset = 'standard';
            }
            // Reset tilt and lineup style for voya_only
            updated.goldBtcTilt = 'none';
            updated.schwabLineupStyle = 'standard';
          }
          
          // If template is in DNA, set the template title for display
          if (result.answers.selectedTemplateId) {
            const template = getModelTemplate(result.answers.selectedTemplateId);
            if (template) {
              setSelectedTemplate(template.title);
            }
          }
          return updated;
        });
      } else {
        setDnaLoadStatus('error');
        console.warn('Failed to decode DNA link:', result.error);
      }
    }
  }, [searchParams]);

  // Read template query param and apply defaults if valid (only if no DNA param)
  useEffect(() => {
    const dnaParam = searchParams.get('dna');
    if (dnaParam) return; // DNA takes precedence

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

  // Manual DNA import handler - supports both DNA tokens and JSON file imports
  const handleDnaImport = () => {
    if (!dnaImportInput.trim()) {
      setDnaImportStatus('error');
      setDnaImportMessage('No input provided.');
      return;
    }

    const input = dnaImportInput.trim();

    // Try parsing as JSON first (for saved setup files)
    try {
      const jsonData = JSON.parse(input);
      
      // Check if it's a saved setup file (has schemaVersion and result)
      if (jsonData.schemaVersion && jsonData.result) {
        if (jsonData.schemaVersion > 1) {
          setDnaImportStatus('error');
          setDnaImportMessage('This file was saved with a newer version. Please update the tool and try again.');
          return;
        }

        // Validate result structure
        if (!jsonData.result.answers || !jsonData.result.riskLevel) {
          setDnaImportStatus('error');
          setDnaImportMessage('That file doesn\'t look like a saved setup from this tool. Missing required fields.');
          return;
        }

        // Apply the saved answers
        setFormData((prev) => {
          const updated = { ...prev, ...jsonData.result.answers };
          // Enforce guardrails if platform is voya_only
          if (updated.platform === 'voya_only') {
            updated.portfolioPreset = 'standard';
            updated.goldBtcTilt = 'none';
            updated.schwabLineupStyle = 'standard';
            updated.goldInstrument = 'gldm';
            updated.btcInstrument = 'fbtc';
          }
          return updated;
        });

        // Set selected template if included
        if (jsonData.result.answers.selectedTemplateId) {
          const template = getModelTemplate(jsonData.result.answers.selectedTemplateId);
          if (template) {
            setSelectedTemplate(template.title);
          }
        }

        setDnaImportStatus('success');
        setDnaImportMessage('Setup loaded successfully.');
        return;
      }
    } catch {
      // Not JSON, continue with DNA token parsing
    }

    // Check if input looks like the human-readable DNA string (Template=... | ...)
    if (input.includes('Template=') || input.includes('|')) {
      setDnaImportStatus('error');
      setDnaImportMessage('Paste the Share link or dna token, not the one-line DNA label.');
      return;
    }

    // Extract DNA token
    const token = extractDnaParam(input);
    if (!token) {
      setDnaImportStatus('error');
      setDnaImportMessage('No valid DNA token or saved setup found. Use a file you saved from this site, or paste a Share link.');
      return;
    }

    // Decode DNA
    const result = decodeDnaFromQuery(token);
    if (!result.ok) {
      setDnaImportStatus('error');
      setDnaImportMessage(result.error || 'Invalid DNA token. That file doesn\'t look like a saved setup from this tool.');
      return;
    }

    // Apply decoded answers (same logic as auto-import)
    setFormData((prev) => {
      const updated = { ...prev, ...result.answers };
      // Enforce guardrails if platform is voya_only
      if (updated.platform === 'voya_only') {
        updated.portfolioPreset = 'standard'; // House presets not allowed
        updated.goldBtcTilt = 'none';
        updated.schwabLineupStyle = 'standard';
        updated.goldInstrument = 'gldm';
        updated.btcInstrument = 'fbtc';
      }
      return updated;
    });

    // Set selected template if included
    if (result.answers.selectedTemplateId) {
      const template = getModelTemplate(result.answers.selectedTemplateId);
      if (template) {
        setSelectedTemplate(template.title);
      }
    }

    setDnaImportStatus('success');
    setDnaImportMessage('Setup loaded successfully.');
  };

  const handleClearDnaImport = () => {
    setDnaImportInput('');
    setDnaImportStatus('idle');
    setDnaImportMessage('');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setDnaImportStatus('error');
      setDnaImportMessage('Please upload a JSON file (.json).');
      return;
    }

    try {
      const text = await file.text();
      setDnaImportInput(text);
      // Auto-trigger import after reading file
      setTimeout(() => {
        handleDnaImport();
      }, 100);
    } catch (err) {
      setDnaImportStatus('error');
      setDnaImportMessage('Could not read file. Please try again.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

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
    // Drawdown tolerance: use override if set, otherwise infer from crash behavior
    const finalDrawdownTolerance = drawdownOverride && formData.drawdownTolerance
      ? formData.drawdownTolerance
      : inferDrawdownTolerance(formData.behaviorInCrash);
    
    // Only validate if override is active and not set
    if (drawdownOverride && !formData.drawdownTolerance) {
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
    // Set drawdown tolerance: use override if set, otherwise infer
    const finalFormData = {
      ...formData,
      drawdownTolerance: finalDrawdownTolerance,
      pensionCoverage: formData.hasPension ? formData.pensionCoverage : 'none',
      currentSchwabPct: formData.platform === 'voya_and_schwab' ? formData.currentSchwabPct : undefined,
      schwabPreference: formData.platform === 'voya_and_schwab' ? formData.schwabPreference : undefined,
      portfolioPreset: formData.platform === 'voya_and_schwab' ? (formData.portfolioPreset ?? 'standard') : 'standard',
      goldBtcTilt: 'none', // Tilts moved to builder page (Task 4)
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

  // Get inferred drawdown tolerance
  const inferredDrawdownTolerance = inferDrawdownTolerance(formData.behaviorInCrash);
  const effectiveDrawdownTolerance = drawdownOverride && formData.drawdownTolerance
    ? formData.drawdownTolerance
    : inferredDrawdownTolerance;

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

      {/* Quick Build Section */}
      <div className="space-y-5">
        <div className="border-b border-zinc-700 pb-3">
          <h2 className="text-base font-semibold text-zinc-200">Quick Build</h2>
          <p className="text-xs text-zinc-400 mt-1">Answer these questions to get started quickly.</p>
        </div>
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

      {/* Inferred Drawdown Tolerance (Quick Build) */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-zinc-300 leading-snug uppercase tracking-wide">
          Estimated drawdown tolerance
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-300">
            {effectiveDrawdownTolerance.charAt(0).toUpperCase() + effectiveDrawdownTolerance.slice(1)}
            {!drawdownOverride && (
              <span className="text-zinc-500 ml-2 text-xs">
                (inferred from crash behavior)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setDrawdownOverride(!drawdownOverride);
              if (!drawdownOverride) {
                setFormData({ ...formData, drawdownTolerance: inferredDrawdownTolerance });
              }
              setShowAdvanced(true);
            }}
            className="px-3 py-2 text-xs text-amber-300 hover:text-amber-200 underline"
          >
            {drawdownOverride ? 'Using override' : 'Edit'}
          </button>
        </div>
        {/* Update inferred value when crash behavior changes */}
        {!drawdownOverride && formData.behaviorInCrash && (
          <p className="text-xs text-zinc-400 mt-1">
            Based on: {formData.behaviorInCrash === 'panic_sell' ? 'Panic sell' : formData.behaviorInCrash === 'hold' ? 'Hold' : 'Buy more'} → {inferredDrawdownTolerance.charAt(0).toUpperCase() + inferredDrawdownTolerance.slice(1)} tolerance
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
              I'd probably panic sell
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
            <span className="text-sm text-zinc-300">I'd probably hold</span>
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
              I'd probably buy more
            </span>
          </label>
        </div>
        {errors.behaviorInCrash && (
          <p className="mt-1 text-xs text-red-400">{errors.behaviorInCrash}</p>
        )}
      </div>

      {/* Income stability moved to Advanced */}

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
              I'm okay with some complexity
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
                <span>I'd rather keep it closer to where it is</span>
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
                <span>I'm fine going up to the 75% cap for more flexibility</span>
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

      {/* Pension section - still in Quick Build */}
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
      </div>

      {/* Advanced Settings Accordion */}
      <div className="border-t border-zinc-700 pt-5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h2 className="text-base font-semibold text-zinc-200">Advanced Settings</h2>
            <p className="text-xs text-zinc-400 mt-1">Optional customization and power-user controls</p>
          </div>
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-5">
            {/* Load a saved setup (formerly Import DNA) */}
            <div className="rounded-md border border-zinc-700 bg-zinc-900/50 px-4 py-3">
              <label htmlFor="dna-import" className="block text-xs font-medium text-zinc-300 mb-2">
                Load a saved setup (JSON)
              </label>
              <p className="text-xs text-zinc-400 mb-2">
                Get this file by clicking "Save setup" on your results page. Upload the file or paste its contents below.
              </p>
              
              {/* File Upload */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mb-3 p-4 border-2 border-dashed rounded-md transition-colors ${
                  isDragging
                    ? 'border-amber-400/60 bg-amber-400/10'
                    : 'border-zinc-700 bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer px-4 py-2 text-sm font-medium rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30 hover:text-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  >
                    Upload JSON file
                  </label>
                  <p className="text-[10px] text-zinc-400">
                    {isDragging ? 'Drop file here' : 'or drag and drop'}
                  </p>
                </div>
              </div>

              {/* Paste Fallback */}
              <div className="mb-2">
                <p className="text-[10px] text-zinc-400 mb-1">Or paste JSON contents or Share link:</p>
                <div className="flex gap-2">
                  <textarea
                    id="dna-import"
                    value={dnaImportInput}
                    onChange={(e) => setDnaImportInput(e.target.value)}
                    placeholder="Paste JSON file contents or Share link"
                    rows={3}
                    className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 font-mono text-xs resize-y"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDnaImport}
                      className="px-4 py-2 text-sm font-medium rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30 hover:text-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDnaImport}
                      className="px-4 py-2 text-sm font-medium rounded bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              {dnaImportStatus !== 'idle' && dnaImportMessage && (
                <div
                  className={`mt-2 px-3 py-2 rounded text-xs ${
                    dnaImportStatus === 'success'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : dnaImportStatus === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {dnaImportMessage}
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
                        goldBtcTilt: 'none',
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
                        goldBtcTilt: 'none',
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
                        goldBtcTilt: 'none',
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
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
      >
        Build My Portfolio
      </button>
    </form>
  );
}

