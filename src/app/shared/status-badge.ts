import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DistributionStatus, TrackStatus } from '../core/models';

interface BadgeStyle {
  pill: string;
  dot: string;
}

// TrackStatus and DistributionStatus names never overlap, so one map serves both.
const STYLES: Record<TrackStatus | DistributionStatus, BadgeStyle> = {
  Draft: { pill: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  Submitted: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  Distributed: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  Pending: { pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  Live: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  Rejected: { pill: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="style().pill"
    >
      <span class="size-1.5 rounded-full" [class]="style().dot" aria-hidden="true"></span>
      {{ status() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<TrackStatus | DistributionStatus>();

  protected readonly style = computed(() => STYLES[this.status()]);
}
