#!/usr/bin/env tsx
/**
 * Model Portfolio Audit Script
 * Validates and prints model portfolio specifications for review
 */

import { MODEL_PORTFOLIOS, RISK_TO_MODEL, validateModelSpecs, sumSleeves } from '../lib/modelPortfolios';
import { sleeveDefinitions } from '../lib/sleeves';
import type { SleeveId } from '../lib/types';

const TOLERANCE = 0.005; // ±0.5%

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function printModel(modelId: string, spec: typeof MODEL_PORTFOLIOS[keyof typeof MODEL_PORTFOLIOS]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Model: ${spec.name} (${modelId})`);
  console.log(`Risk Level: ${spec.riskLevel}`);
  console.log(`Description: ${spec.description}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\nSleeve Allocations:');
  console.log('─'.repeat(60));
  
  // Get all sleeve IDs from definitions
  const allSleeveIds = Object.keys(sleeveDefinitions) as SleeveId[];
  
  // Print sleeves in order, showing 0% for missing ones
  const sleeveEntries = allSleeveIds.map(sleeveId => {
    const weight = spec.sleeves[sleeveId] ?? 0;
    const sleeveDef = sleeveDefinitions[sleeveId];
    return {
      id: sleeveId,
      name: sleeveDef.name,
      weight,
    };
  });
  
  // Sort by weight descending, then by name
  sleeveEntries.sort((a, b) => {
    if (Math.abs(a.weight - b.weight) > 0.001) {
      return b.weight - a.weight;
    }
    return a.name.localeCompare(b.name);
  });
  
  for (const entry of sleeveEntries) {
    const weightStr = formatPercent(entry.weight);
    const padding = ' '.repeat(40 - entry.name.length);
    console.log(`  ${entry.name}${padding}${weightStr}`);
  }
  
  const total = sumSleeves(spec);
  console.log('─'.repeat(60));
  console.log(`  TOTAL${' '.repeat(33)}${formatPercent(total)}`);
  
  // Validation checks
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check total
  if (Math.abs(total - 1.0) > TOLERANCE) {
    errors.push(`Total is ${formatPercent(total)}, expected ~100% (tolerance: ±${formatPercent(TOLERANCE)})`);
  }
  
  // Check for negative allocations
  for (const [sleeveId, weight] of Object.entries(spec.sleeves)) {
    if (weight < 0) {
      errors.push(`Negative allocation for sleeve "${sleeveId}": ${formatPercent(weight)}`);
    }
  }
  
  // Check for missing sleeves (warn, not error - some models may intentionally omit sleeves)
  const missingSleeves = allSleeveIds.filter(id => !(id in spec.sleeves) || spec.sleeves[id] === 0);
  if (missingSleeves.length > 0) {
    warnings.push(`Missing/zero sleeves: ${missingSleeves.join(', ')}`);
  }
  
  // Check for invalid sleeve IDs
  for (const sleeveId of Object.keys(spec.sleeves) as SleeveId[]) {
    if (!allSleeveIds.includes(sleeveId)) {
      errors.push(`Invalid sleeve ID: "${sleeveId}"`);
    }
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of warnings) {
      console.log(`   ${warning}`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of errors) {
      console.log(`   ${error}`);
    }
  } else {
    console.log('\n✅ Validation passed');
  }
}

function main() {
  console.log('Model Portfolio Audit Report');
  console.log('Generated:', new Date().toISOString());
  
  let hasErrors = false;
  
  try {
    // Run validation first
    validateModelSpecs(MODEL_PORTFOLIOS);
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    hasErrors = true;
  }
  
  // Print each model
  const modelIds: Array<keyof typeof MODEL_PORTFOLIOS> = ['r1', 'r2', 'r3', 'r4', 'r5'];
  
  for (const modelId of modelIds) {
    const spec = MODEL_PORTFOLIOS[modelId];
    printModel(modelId, spec);
    
    // Check for errors in this model
    const total = sumSleeves(spec);
    if (Math.abs(total - 1.0) > TOLERANCE) {
      hasErrors = true;
    }
    
    for (const weight of Object.values(spec.sleeves)) {
      if (weight < 0) {
        hasErrors = true;
      }
    }
  }
  
  // Print risk-to-model mapping
  console.log(`\n${'='.repeat(60)}`);
  console.log('Risk Level → Model Mapping:');
  console.log('─'.repeat(60));
  for (const [riskLevel, modelId] of Object.entries(RISK_TO_MODEL)) {
    const spec = MODEL_PORTFOLIOS[modelId];
    console.log(`  Risk ${riskLevel} → ${modelId} (${spec.name})`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  
  if (hasErrors) {
    console.error('\n❌ Audit failed: One or more models have validation errors');
    process.exit(1);
  } else {
    console.log('\n✅ All models validated successfully');
    process.exit(0);
  }
}

main();







