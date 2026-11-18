import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div class="flex items-center gap-6">
          <a routerLink="/tracks" class="flex items-center gap-2 font-semibold text-slate-900">
            <span
              class="grid size-7 place-items-center rounded-md bg-indigo-600 text-sm text-white"
              aria-hidden="true"
              >T</span
            >
            <span>Track Management</span>
          </a>
          <nav aria-label="Main">
            <a
              routerLink="/tracks"
              routerLinkActive="text-indigo-700"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
              >Tracks</a
            >
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden max-w-56 truncate text-sm text-slate-500 sm:inline">{{ auth.email() }}</span>
          <button
            type="button"
            (click)="auth.logout()"
            class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <router-outlet />
    </main>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
}
