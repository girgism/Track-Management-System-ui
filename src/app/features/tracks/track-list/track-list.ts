import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { describeError } from '../../../core/http-error';
import { genreLabel } from '../../../core/labels';
import { TRACK_STATUSES, isTrackStatus } from '../../../core/models';
import { TracksApi } from '../../../core/tracks-api';
import { StatusBadge } from '../../../shared/status-badge';

@Component({
  selector: 'app-track-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, StatusBadge],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Tracks</h1>
        <p class="mt-1 text-sm text-slate-500" aria-live="polite">
          @if (tracks.hasValue()) {
            {{ tracks.value().length }}
            {{ tracks.value().length === 1 ? 'track' : 'tracks' }}
            @if (activeStatus()) {
              with status {{ activeStatus() }}
            }
          } @else {
            &nbsp;
          }
        </p>
      </div>

      <div>
        <label for="status-filter" class="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
        <select
          id="status-filter"
          (change)="setStatus($any($event.target).value)"
          class="block w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
        >
          <option value="" [selected]="!activeStatus()">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s" [selected]="activeStatus() === s">{{ s }}</option>
          }
        </select>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      @if (tracks.error()) {
        <div role="alert" class="px-6 py-12 text-center">
          <p class="font-medium text-slate-900">Couldn't load tracks</p>
          <p class="mt-1 text-sm text-slate-500">{{ errorMessage() }}</p>
          <button
            type="button"
            (click)="tracks.reload()"
            class="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      } @else if (tracks.isLoading()) {
        <div class="divide-y divide-slate-100" aria-busy="true" aria-label="Loading tracks">
          @for (row of skeletonRows; track row) {
            <div class="flex animate-pulse items-center gap-4 px-4 py-4 sm:px-6">
              <div class="h-4 w-1/3 rounded bg-slate-200"></div>
              <div class="h-4 w-1/5 rounded bg-slate-200"></div>
              <div class="ml-auto h-5 w-20 rounded-full bg-slate-200"></div>
            </div>
          }
        </div>
      } @else if (tracks.value()?.length === 0) {
        <div class="px-6 py-12 text-center">
          <p class="font-medium text-slate-900">No tracks found</p>
          <p class="mt-1 text-sm text-slate-500">
            @if (activeStatus()) {
              No tracks have the status {{ activeStatus() }}.
              <button type="button" (click)="setStatus('')" class="font-medium text-indigo-700 hover:underline">
                Clear filter
              </button>
            } @else {
              There are no tracks yet.
            }
          </p>
        </div>
      } @else {
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Tracks with artist, genre, release date and status
          </caption>
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th scope="col" class="px-4 py-3 sm:px-6">Track</th>
              <th scope="col" class="hidden px-4 py-3 sm:table-cell">Genre</th>
              <th scope="col" class="hidden px-4 py-3 md:table-cell">Released</th>
              <th scope="col" class="px-4 py-3 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (t of tracks.value(); track t.id) {
              <tr (click)="open(t.id)" class="cursor-pointer transition-colors hover:bg-slate-50">
                <td class="px-4 py-3.5 sm:px-6">
                  <a
                    [routerLink]="['/tracks', t.id]"
                    (click)="$event.stopPropagation()"
                    class="font-medium text-slate-900 hover:text-indigo-700"
                    >{{ t.title }}</a
                  >
                  <div class="text-slate-500">{{ t.artistName }}</div>
                </td>
                <td class="hidden px-4 py-3.5 text-slate-700 sm:table-cell">{{ genreLabel(t.genre) }}</td>
                <td class="hidden px-4 py-3.5 text-slate-700 md:table-cell">
                  {{ t.releaseDate | date: 'mediumDate' }}
                </td>
                <td class="px-4 py-3.5 sm:px-6"><app-status-badge [status]="t.status" /></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class TrackList {
  private readonly api = inject(TracksApi);
  private readonly router = inject(Router);

  protected readonly statuses = TRACK_STATUSES;
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  protected readonly genreLabel = genreLabel;

  /** Bound from the ?status= query string (withComponentInputBinding), so the filter survives back/forward and reloads. */
  readonly status = input<string | undefined>();

  protected readonly activeStatus = computed(() => {
    const value = this.status();
    return isTrackStatus(value) ? value : undefined;
  });

  protected readonly tracks = rxResource({
    params: () => ({ status: this.activeStatus() }),
    stream: ({ params }) => this.api.list(params.status),
  });

  protected readonly errorMessage = computed(() => describeError(this.tracks.error()));

  protected setStatus(value: string): void {
    void this.router.navigate([], {
      queryParams: { status: value || null },
      queryParamsHandling: 'merge',
    });
  }

  protected open(id: string): void {
    void this.router.navigate(['/tracks', id]);
  }
}
