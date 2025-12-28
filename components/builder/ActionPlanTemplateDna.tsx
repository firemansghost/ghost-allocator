'use client';

import { useState } from 'react';
import { getModelTemplate } from '@/lib/modelTemplates';
import type { PortfolioPreset, SchwabLineupStyle, GoldInstrument, BtcInstrument, PlatformType, GoldBtcTilt, RiskLevel } from '@/lib/types';
import { GlassCard } from '@/components/GlassCard';
import {
  ACTION_PLAN_TEMPLATE_DNA_LABEL,
  ACTION_PLAN_RISK_PINNED_LABEL,
  ACTION_PLAN_RISK_COMPUTED_LABEL,
  ACTION_PLAN_PRESET_LABEL,
  ACTION_PLAN_LINEUP_STYLE_LABEL,
  ACTION_PLAN_GOLD_WRAPPER_LABEL,
  ACTION_PLAN_BTC_WRAPPER_LABEL,
  PRESET_DISPLAY_NAMES,
  LINEUP_STYLE_DISPLAY_NAMES,
  buildActionPlanDnaString,
} from '@/lib/builder/actionPlanCopy';
import { encodeDnaToQuery } from '@/lib/builder/dnaLink';

interface ActionPlanTemplateDnaProps {
  selectedTemplateId: string;
  platform: PlatformType;
  riskLevelOverride?: RiskLevel;
  portfolioPreset?: PortfolioPreset;
  schwabLineupStyle?: SchwabLineupStyle;
  goldBtcTilt?: GoldBtcTilt;
  goldInstrument?: GoldInstrument;
  btcInstrument?: BtcInstrument;
  complexityPreference?: 'simple' | 'moderate' | 'advanced';
}

export default function ActionPlanTemplateDna({
  selectedTemplateId,
  platform,
  riskLevelOverride,
  portfolioPreset,
  schwabLineupStyle,
  goldBtcTilt,
  goldInstrument,
  btcInstrument,
  complexityPreference,
}: ActionPlanTemplateDnaProps) {
  const [copied, setCopied] = useState<'dna' | 'link' | null>(null);
  const template = getModelTemplate(selectedTemplateId);
  if (!template) return null;

  const presetDisplay = portfolioPreset
    ? PRESET_DISPLAY_NAMES[portfolioPreset] || portfolioPreset
    : null;

  const lineupStyleDisplay = schwabLineupStyle
    ? LINEUP_STYLE_DISPLAY_NAMES[schwabLineupStyle] || schwabLineupStyle
    : null;

  const hasGoldWrapper = goldInstrument === 'ygld';
  const hasBtcWrapper = btcInstrument === 'maxi';

  // Build DNA string
  const dnaString = buildActionPlanDnaString({
    templateId: selectedTemplateId,
    templateName: template.title,
    platform,
    riskLevelOverride,
    portfolioPreset,
    schwabLineupStyle,
    goldBtcTilt,
    goldInstrument,
    btcInstrument,
  });

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  const handleCopyDna = async () => {
    const success = await copyToClipboard(dnaString);
    if (success) {
      setCopied('dna');
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const handleShareLink = async () => {
    // Build answers object for encoding
    const answers = {
      selectedTemplateId,
      platform,
      riskLevelOverride,
      portfolioPreset,
      schwabLineupStyle,
      goldBtcTilt,
      goldInstrument,
      btcInstrument,
      complexityPreference,
    };

    const encoded = encodeDnaToQuery(answers);
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/onboarding?dna=${encoded}`
      : `/onboarding?dna=${encoded}`;

    const success = await copyToClipboard(url);
    if (success) {
      setCopied('link');
      setTimeout(() => setCopied(null), 1500);
    }
  };

  return (
    <GlassCard className="p-3 border-amber-400/20 bg-amber-400/5">
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-200">{ACTION_PLAN_TEMPLATE_DNA_LABEL}</span>
          <span className="text-amber-300">{template.title}</span>
        </div>
        <div className="text-[11px] text-zinc-400 space-y-0.5">
          <div>
            {riskLevelOverride !== undefined
              ? `${ACTION_PLAN_RISK_PINNED_LABEL} ${riskLevelOverride}`
              : ACTION_PLAN_RISK_COMPUTED_LABEL}
          </div>
          {presetDisplay && (
            <div>
              {ACTION_PLAN_PRESET_LABEL} {presetDisplay}
            </div>
          )}
          {lineupStyleDisplay && (
            <div>
              {ACTION_PLAN_LINEUP_STYLE_LABEL} {lineupStyleDisplay}
            </div>
          )}
          {hasGoldWrapper && (
            <div>
              {ACTION_PLAN_GOLD_WRAPPER_LABEL} YGLD
            </div>
          )}
          {hasBtcWrapper && (
            <div>
              {ACTION_PLAN_BTC_WRAPPER_LABEL} MAXI
            </div>
          )}
        </div>
        {/* DNA String + Copy Button */}
        <div className="pt-2 mt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-400">DNA:</span>
            <code className="flex-1 text-[10px] text-zinc-300 font-mono bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800 break-all">
              {dnaString}
            </code>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDna}
                aria-label="Copy Template DNA to clipboard"
                className="text-[10px] px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                {copied === 'dna' ? 'Copied' : 'Copy DNA'}
              </button>
              <button
                onClick={handleShareLink}
                aria-label="Copy shareable DNA link to clipboard"
                className="text-[10px] px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                {copied === 'link' ? 'Copied' : 'Share link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

