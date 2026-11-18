import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { AuthService } from './auth.service';

/** Attaches the bearer token to API calls and signs the user out when the API says the token is no longer valid. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(baseUrl)) {
    return next(req);
  }

  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isLoginCall = req.url.endsWith('/api/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isLoginCall) {
        auth.logout(router.url);
      }
      return throwError(() => error);
    }),
  );
};
