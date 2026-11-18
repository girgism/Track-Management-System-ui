import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { LoginResponse } from '../models';

interface Session {
  token: string;
  email: string;
  expiresAt: number; // epoch ms
}

const STORAGE_KEY = 'tm.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly session = signal<Session | null>(this.restore());

  readonly email = computed(() => this.session()?.email ?? null);

  /** Checked on every call (not cached) so an expired token is never treated as signed in. */
  hasValidToken(): boolean {
    const session = this.session();
    return session !== null && session.expiresAt > Date.now();
  }

  token(): string | null {
    return this.hasValidToken() ? this.session()!.token : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((response) =>
          this.store({
            token: response.accessToken,
            email: email.trim().toLowerCase(),
            expiresAt: Date.parse(response.expiresAtUtc),
          }),
        ),
      );
  }

  logout(returnUrl?: string): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: the in-memory session is already cleared.
    }
    void this.router.navigate(['/login'], returnUrl ? { queryParams: { returnUrl } } : undefined);
  }

  private store(session: Session): void {
    this.session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage unavailable: the user stays signed in until the tab closes.
    }
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (
        typeof parsed.token === 'string' &&
        typeof parsed.email === 'string' &&
        typeof parsed.expiresAt === 'number' &&
        parsed.expiresAt > Date.now()
      ) {
        return parsed as Session;
      }
    } catch {
      // Corrupt or unavailable storage: treat as signed out.
    }
    return null;
  }
}
