import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Track Management',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tracks' },
      {
        path: 'tracks',
        title: 'Tracks · Track Management',
        loadComponent: () =>
          import('./features/tracks/track-list/track-list').then((m) => m.TrackList),
      },
      {
        path: 'tracks/:id',
        title: 'Track · Track Management',
        loadComponent: () =>
          import('./features/tracks/track-detail/track-detail').then((m) => m.TrackDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
