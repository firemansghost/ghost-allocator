'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionnaireAnswers } from '@/lib/types';
import { computeRiskLevel } from '@/lib/portfolioEngine';
import type { QuestionnaireResult } from '@/lib/types';

const STORAGE_KEY = 'ghostAllocatorQuestionnaire';

export default function QuestionnaireForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<QuestionnaireAnswers>>({
    drawdownTolerance: 'medium',
    behaviorInCrash: 'hold',
    incomeStability: 'medium',
    complexityPreference: 'simple',
    hasPension: false,
    pensionCoverage: 'none',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const finalFormData = {
      ...formData,
      pensionCoverage: formData.hasPension ? formData.pensionCoverage : 'none',
    } as QuestionnaireAnswers;

    const answers = finalFormData;
    const riskLevel = computeRiskLevel(answers);
    const result: QuestionnaireResult = { answers, riskLevel };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    router.push('/builder');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 leading-snug">Age</label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) })
            }
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            min="18"
            max="100"
          />
          {errors.age && (
            <p className="mt-1 text-xs text-red-400">{errors.age}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 leading-snug">
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
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            min="0"
          />
          {errors.yearsToGoal && (
            <p className="mt-1 text-xs text-red-400">{errors.yearsToGoal}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
            <span className="text-sm text-slate-300">Yes</span>
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
            <span className="text-sm text-slate-300">No</span>
          </label>
        </div>
        {errors.isRetired && (
          <p className="mt-1 text-xs text-red-400">{errors.isRetired}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
            <span className="text-sm text-slate-300">
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
            <span className="text-sm text-slate-300">I&apos;d probably hold</span>
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
            <span className="text-sm text-slate-300">
              I&apos;d probably buy more
            </span>
          </label>
        </div>
        {errors.behaviorInCrash && (
          <p className="mt-1 text-xs text-red-400">{errors.behaviorInCrash}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
            <span className="text-sm text-slate-300">Keep it simple</span>
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
            <span className="text-sm text-slate-300">
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
            <span className="text-sm text-slate-300">
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 leading-snug">
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
            <span className="text-sm text-slate-300">Yes</span>
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
            <span className="text-sm text-slate-300">No</span>
          </label>
        </div>
        {errors.hasPension && (
          <p className="mt-1 text-xs text-red-400">{errors.hasPension}</p>
        )}
      </div>

      {formData.hasPension && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 leading-snug">
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
              <span className="text-sm text-slate-300">
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
              <span className="text-sm text-slate-300">Less than half</span>
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
              <span className="text-sm text-slate-300">About half</span>
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
              <span className="text-sm text-slate-300">
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
        className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/25 transform hover:-translate-y-[1px]"
      >
        Build My Portfolio
      </button>
    </form>
  );
}

