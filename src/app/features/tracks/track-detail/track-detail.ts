import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { describeError, unwrapError } from '../../../core/http-error';
import { genreLabel } from '../../../core/labels';
import { TracksApi } from '../../../core/tracks-api';
import { StatusBadge } from '../../../shared/status-badge';

@Component({
  selector: 'app-track-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, StatusBadge],
  template: `
    <button
      type="button"
      (click)="back()"
      class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <span aria-hidden="true">←</span> Back to tracks
    </button>

    @if (track.error()) {
      <div role="alert" class="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p class="font-medium text-slate-900">
          {{ notFound() ? 'Track not found' : "Couldn't load this track" }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ notFound() ? 'It may have been removed, or the link is incorrect.' : errorMessage() }}
        </p>
        @if (!notFound()) {
          <button
            type="button"
            (click)="track.reload()"
            class="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        }
      </div>
    } @else if (track.isLoading()) {
      <div class="animate-pulse space-y-6" aria-busy="true" aria-label="Loading track">
        <div class="h-8 w-1/2 rounded bg-slate-200"></div>
        <div class="h-40 rounded-xl bg-slate-200"></div>
        <div class="h-32 rounded-xl bg-slate-200"></div>
      </div>
    } @else if (track.value(); as t) {
      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ t.title }}</h1>
          <p class="mt-1 text-slate-500">by {{ t.artist.name }}</p>
        </div>
        <app-status-badge [status]="t.status" />
      </div>

      <section class="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="info-heading">
        <h2 id="info-heading" class="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Track information
        </h2>
        <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt class="text-sm text-slate-500">Genre</dt>
            <dd class="mt-1 font-medium">{{ genreLabel(t.genre) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Release date</dt>
            <dd class="mt-1 font-medium">{{ t.releaseDate | date: 'longDate' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">ISRC</dt>
            <dd class="mt-1 font-mono font-medium">{{ t.isrc }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Artist</dt>
            <dd class="mt-1 font-medium">{{ t.artist.name }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Artist email</dt>
            <dd class="mt-1 font-medium break-all">{{ t.artist.email }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Country</dt>
            <dd class="mt-1 font-medium">{{ t.artist.country }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="dist-heading">
        <h2 id="dist-heading" class="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Distribution
        </h2>

        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          @if (t.distributions.length === 0) {
            <div class="px-6 py-10 text-center">
              <p class="font-medium text-slate-900">Not distributed yet</p>
              <p class="mt-1 text-sm text-slate-500">This track hasn't been submitted to any DSP.</p>
            </div>
          } @else {
            <table class="w-full text-left text-sm">
              <caption class="sr-only">
                DSPs this track was submitted to, with submission date and status
              </caption>
              <thead class="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" class="px-4 py-3 sm:px-6">DSP</th>
                  <th scope="col" class="px-4 py-3">Submitted</th>
                  <th scope="col" class="px-4 py-3 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (d of t.distributions; track d.id) {
                  <tr>
                    <td class="px-4 py-3.5 font-medium sm:px-6">{{ d.dspName }}</td>
                    <td class="px-4 py-3.5 text-slate-700">{{ d.submittedAt | date: 'medium' }}</td>
                    <td class="px-4 py-3.5 sm:px-6"><app-status-badge [status]="d.status" /></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    }
  `,
})
export class TrackDetail {
  private readonly api = inject(TracksApi);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly genreLabel = genreLabel;

  /** Bound from the :id route parameter (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly track = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.get(params),
  });

  protected readonly notFound = computed(() => {
    const error = unwrapError(this.track.error());
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly errorMessage = computed(() => describeError(this.track.error()));

  /** Goes back (keeping the list's status filter) when we came from the list; otherwise opens the list. */
  protected back(): void {
    const cameFromInsideApp = (history.state?.navigationId ?? 0) > 1;
    if (cameFromInsideApp) {
      this.location.back();
    } else {
      void this.router.navigate(['/tracks']);
    }
  }
}
