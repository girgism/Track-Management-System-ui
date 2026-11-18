import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { TrackDetail, TrackListItem, TrackStatus } from './models';

@Injectable({ providedIn: 'root' })
export class TracksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(status?: TrackStatus): Observable<TrackListItem[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<TrackListItem[]>(`${this.baseUrl}/api/tracks`, { params });
  }

  get(id: string): Observable<TrackDetail> {
    return this.http.get<TrackDetail>(`${this.baseUrl}/api/tracks/${encodeURIComponent(id)}`);
  }
}
