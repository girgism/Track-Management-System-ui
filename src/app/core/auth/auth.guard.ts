import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Everything except /login requires a valid (unexpired) token. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.hasValidToken()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
