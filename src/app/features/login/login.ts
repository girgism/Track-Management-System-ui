import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { describeError } from '../../core/http-error';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid min-h-screen place-items-center px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <span
            class="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-indigo-600 text-lg font-semibold text-white"
            aria-hidden="true"
            >T</span
          >
          <h1 class="text-2xl font-semibold tracking-tight">Track Management</h1>
          <p class="mt-1 text-sm text-slate-500">Sign in to manage tracks and distributions.</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          novalidate
          class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          @if (error(); as message) {
            <div
              role="alert"
              class="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              {{ message }}
            </div>
          }

          <div>
            <label for="email" class="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="username"
              class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              [attr.aria-invalid]="showError('email')"
              aria-describedby="email-error"
            />
            @if (showError('email')) {
              <p id="email-error" class="mt-1.5 text-sm text-rose-700">Enter a valid email address.</p>
            }
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              [attr.aria-invalid]="showError('password')"
              aria-describedby="password-error"
            />
            @if (showError('password')) {
              <p id="password-error" class="mt-1.5 text-sm text-rose-700">Enter your password.</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            @if (loading()) {
              <span
                class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              ></span>
              Signing in…
            } @else {
              Sign in
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    // Already signed in: skip the form.
    if (this.auth.hasValidToken()) {
      void this.router.navigateByUrl(this.returnUrl());
    }
  }

  protected showError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (err: unknown) => {
        this.error.set(describeError(err));
        this.loading.set(false);
      },
    });
  }

  /** Only same-app paths are allowed, so a crafted ?returnUrl= cannot redirect off-site. */
  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/tracks';
  }
}
