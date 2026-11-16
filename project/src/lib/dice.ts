import type { RollResult } from '@/types';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollD20(
  advantage: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  modifier: number = 0,
  label: string = '',
  dc: number | null = null
): RollResult {
  let rolls: number[];
  let result: number;

  if (advantage === 'advantage') {
    rolls = [rollDie(20), rollDie(20)];
    result = Math.max(...rolls);
  } else if (advantage === 'disadvantage') {
    rolls = [rollDie(20), rollDie(20)];
    result = Math.min(...rolls);
  } else {
    const r = rollDie(20);
    rolls = [r];
    result = r;
  }

  const total = result + modifier;
  let outcome: RollResult['outcome'] = null;

  if (dc !== null) {
    if (result === 20) outcome = 'critical_success';
    else if (result === 1) outcome = 'critical_failure';
    else if (total >= dc) outcome = 'success';
    else outcome = 'failure';
  }

  return {
    die: 20,
    result,
    rolls,
    modifier,
    total,
    advantage,
    label,
    dc,
    outcome,
  };
}

export function rollCustom(sides: number, modifier: number = 0): RollResult {
  const r = rollDie(sides);
  return {
    die: sides,
    result: r,
    rolls: [r],
    modifier,
    total: r + modifier,
    advantage: 'normal',
    label: `d${sides}`,
    dc: null,
    outcome: null,
  };
}

export function rollWithAdvantage(rolls: number[]): number {
  return Math.max(...rolls);
}

export function rollWithDisadvantage(rolls: number[]): number {
  return Math.min(...rolls);
}

export function outcomeLabel(outcome: RollResult['outcome']): string {
  switch (outcome) {
    case 'critical_success': return 'КРИТИЧЕСКИЙ УСПЕХ (20)!';
    case 'critical_failure': return 'КРИТИЧЕСКИЙ ПРОВАЛ (1)!';
    case 'success': return 'УСПЕХ';
    case 'failure': return 'ПРОВАЛ';
    default: return '';
  }
}

export function outcomeColor(outcome: RollResult['outcome']): string {
  switch (outcome) {
    case 'critical_success': return 'text-gold-bright glow-gold';
    case 'critical_failure': return 'text-danger glow-red';
    case 'success': return 'text-emerald glow-green';
    case 'failure': return 'text-danger glow-red';
    default: return 'text-ink';
  }
}
