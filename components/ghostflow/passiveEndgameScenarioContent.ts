/**
 * GhostFlow v1.6b — static Passive Endgame Scenario content (educational only; not scored).
 */

export type EndgameBandId =
  | 'normal'
  | 'watch'
  | 'stress_zone'
  | 'fragility_zone'
  | 'intervention_reset';

export interface EndgameBandLadderStep {
  id: EndgameBandId;
  label: string;
  description: string;
}

export type RelatedIndicatorRef =
  | { kind: 'signal'; signalId: string; label: string }
  | { kind: 'sub_input'; key: string; label: string }
  | { kind: 'unavailable'; label: string; note: string };

export interface PassiveEndgameScenario {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  bandIds: EndgameBandId[];
  relatedIndicators: RelatedIndicatorRef[];
  caveat: string;
}

export const SCENARIO_GLOBAL_CAVEAT =
  'Illustrative pathway from passive-flow research framing — not a prediction, timetable, or investment recommendation.';

export const ENDGAME_BAND_LADDER: EndgameBandLadderStep[] = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'Mechanical pressure present but markets remain broadly workable.',
  },
  {
    id: 'watch',
    label: 'Watch',
    description: 'Flows and concentration build; dependency on the mechanical bid rises.',
  },
  {
    id: 'stress_zone',
    label: 'Stress Zone',
    description: 'Model-stress framing (often 60–65% depending on definition); surface strength may mask thinning participation.',
  },
  {
    id: 'fragility_zone',
    label: 'Fragility Zone',
    description: 'Flow reversals and air pockets become more plausible in model terms — not a dated forecast.',
  },
  {
    id: 'intervention_reset',
    label: 'Intervention / Reset Risk',
    description: 'Policy response or structural reform paths — outcomes uncertain.',
  },
];

export const PASSIVE_ADOPTION_IMPACT_NOTE = {
  title: 'Adoption rate vs market impact rate',
  paragraphs: [
    'Passive adoption (fund-industry index share climbing on the ICI proxy) can move steadily, slow, or accelerate. That is a different question from how much passive flows move prices.',
    'Passive market impact can become nonlinear as active price-discovery capital shrinks — even when adoption looks linear on a chart. GhostFlow shows public proxies for context, not proof of acceleration.',
  ],
};

export const PASSIVE_ENDGAME_SCENARIOS: PassiveEndgameScenario[] = [
  {
    id: 'benign-plateau',
    title: 'Benign Plateau',
    summary:
      'Passive share rises slowly while markets remain workable — stress builds in the model without an immediate break.',
    bullets: [
      'Index-share growth slows before the 60–65% stress framing on the ICI proxy.',
      'Top-10 concentration stays high but stabilizes rather than accelerating.',
      'Breadth participation improves or holds steady.',
      'Active vs index flow differential stabilizes — less one-way tilt.',
      'VIX and ETF flow proxies stay unremarkable relative to fragility scenarios.',
    ],
    bandIds: ['normal', 'watch'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'passive-share', label: 'ICI Index Share Proxy' },
      { kind: 'signal', signalId: 'concentration', label: 'Index Concentration' },
      { kind: 'signal', signalId: 'breadth', label: 'Market Breadth' },
      { kind: 'signal', signalId: 'active-index-flow', label: 'Active vs Index Flow' },
      { kind: 'signal', signalId: 'etf-flow', label: 'ETF Net Issuance' },
      { kind: 'signal', signalId: 'vol-regime', label: 'Volatility Regime (VIX)' },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
  {
    id: 'melt-up-concentration',
    title: 'Melt-Up / Concentration Boom',
    summary:
      'Passive inflows keep lifting cap-weighted indexes — strength on the surface, rising dependency on the mechanical bid.',
    bullets: [
      'Strong domestic equity ETF net issuance supports index-level lifts.',
      'ICI index-share and top-10 concentration climb together.',
      'Mega-cap leadership dominates index returns in narrative terms.',
      'Valuations may stretch while vol stays muted early — complacency risk, not proof.',
      'Cap-weight vs equal-weight divergence is discussed in research but not on this dashboard.',
    ],
    bandIds: ['watch', 'stress_zone'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'etf-flow', label: 'ETF Net Issuance' },
      { kind: 'signal', signalId: 'passive-share', label: 'ICI Index Share Proxy' },
      { kind: 'signal', signalId: 'concentration', label: 'Index Concentration' },
      { kind: 'signal', signalId: 'breadth', label: 'Market Breadth' },
      { kind: 'signal', signalId: 'vol-regime', label: 'Volatility Regime (VIX)' },
      {
        kind: 'unavailable',
        label: 'Cap-weight vs equal-weight',
        note: 'Not on GhostFlow dashboard — future context only.',
      },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
  {
    id: 'fragility-regime',
    title: 'Fragility Regime',
    summary:
      'Headline indexes may still rise, but participation and liquidity quality weaken underneath — a pressure-gauge read, not a crash date.',
    bullets: [
      'Breadth deteriorates while concentration stays elevated.',
      'Earnings reactions may feel larger in narrative terms; gaps and vol-of-vol can pick up.',
      'VIX amplifier rises despite “strong” index levels on the tape.',
      'Distance to model-stress-zone reference narrows on the ICI proxy.',
      'Active price-discovery capital feels thinner — qualitative, not measured directly here.',
    ],
    bandIds: ['stress_zone', 'fragility_zone'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'breadth', label: 'Market Breadth' },
      { kind: 'signal', signalId: 'concentration', label: 'Index Concentration' },
      { kind: 'signal', signalId: 'passive-share', label: 'ICI Index Share Proxy' },
      { kind: 'signal', signalId: 'distance-65', label: 'Distance to Model-Stress Zone' },
      {
        kind: 'sub_input',
        key: 'modelZoneProximity',
        label: 'Model-zone proximity (structural sub-input)',
      },
      { kind: 'signal', signalId: 'vol-regime', label: 'Volatility Regime (VIX)' },
      {
        kind: 'signal',
        signalId: 'options-activity-proxy',
        label: 'Index Options Intensity (display only)',
      },
      {
        kind: 'unavailable',
        label: 'Correlation / liquidity index',
        note: 'Not on GhostFlow dashboard — qualitative narrative only.',
      },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
  {
    id: 'flow-reversal-shock',
    title: 'Flow-Reversal Shock',
    summary:
      'Passive inflows slow or reverse into a smaller active pool — air pockets, vol spikes, and correlation jumps become more plausible in model terms.',
    bullets: [
      'ETF issuance turns weak or negative on the ICI weekly proxy.',
      'Index-share level may stall; flow tilt can flip in active/index data.',
      'Levered ETF rebalance estimates spike on the display card — flow-stress context, not scored.',
      'CFTC positioning may look crowded — display-only systematic-flow context.',
      'Breadth and VIX stress together — still not a timetable for a crash.',
    ],
    bandIds: ['fragility_zone'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'etf-flow', label: 'ETF Net Issuance' },
      { kind: 'signal', signalId: 'passive-share', label: 'ICI Index Share Proxy' },
      { kind: 'signal', signalId: 'breadth', label: 'Market Breadth' },
      { kind: 'signal', signalId: 'vol-regime', label: 'Volatility Regime (VIX)' },
      {
        kind: 'signal',
        signalId: 'levered-etf-rebalance',
        label: 'Levered ETF Rebalance (display only)',
      },
      { kind: 'signal', signalId: 'systematic-flow', label: 'CFTC Positioning (display only)' },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
  {
    id: 'policy-intervention',
    title: 'Policy Intervention / Market Repair',
    summary:
      'Authorities and rulemakers respond after stress appears — halts, facilities, retirement-rule debate, or index methodology scrutiny.',
    bullets: [
      'Narrative response band — not a GhostFlow score or signal.',
      'May coincide with extreme breadth or VIX readings already on the dashboard.',
      'Does not imply successful repair or a particular policy outcome.',
      'Treasury market-structure / plumbing lens is deferred (v1.7a+).',
      'Possible pathways, not predictions — timing unknown.',
    ],
    bandIds: ['intervention_reset'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'vol-regime', label: 'Volatility Regime (VIX)' },
      { kind: 'signal', signalId: 'breadth', label: 'Market Breadth' },
      {
        kind: 'unavailable',
        label: 'Treasury Plumbing',
        note: 'Deferred to v1.7a feasibility — not in v1.6b.',
      },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
  {
    id: 'structural-reform',
    title: 'Structural Reform',
    summary:
      'Rules and defaults shift before a full crisis — allocation mixes may move toward active, factor, or equal-weight approaches over time.',
    bullets: [
      'Retirement default and index-construction reform narratives — slow-moving.',
      'ICI mix and flow proxies would adjust over quarters and years, not overnight.',
      'Reduced pure cap-weight dominance is a structural story, not a trade signal.',
      'Would show up gradually in passive-share and active/index flow artifacts if it happens.',
      'Benign intervention path — still uncertain and not scored.',
    ],
    bandIds: ['intervention_reset'],
    relatedIndicators: [
      { kind: 'signal', signalId: 'passive-share', label: 'ICI Index Share Proxy' },
      { kind: 'signal', signalId: 'active-index-flow', label: 'Active vs Index Flow' },
      {
        kind: 'signal',
        signalId: 'retirement-asset-growth',
        label: 'Retirement Asset Growth (display only)',
      },
    ],
    caveat: SCENARIO_GLOBAL_CAVEAT,
  },
];

export const TEASER_INTRO =
  'Six illustrative pathways from passive-flow research as index-oriented share moves toward model-stress zones. They do not have to happen in order, and GhostFlow does not forecast a crash date — it is a pressure gauge, not a countdown clock.';
