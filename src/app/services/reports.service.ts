import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IncidentCategory, Priority, ReportStatus } from '../data/models';

export interface ReportsSummaryFilters {
  start_date?: string;
  end_date?: string;
  category_id?: IncidentCategory;
  area_id?: number;
  location_id?: number;
  status?: ReportStatus;
  priority?: Priority;
  limit?: number;
  offset?: number;
}

export interface ReportsSummaryKpis {
  total: number;
  open: number;
  in_progress: number;
  blocked: number;
  resolved_closed: number;
  average_resolution_hours: number | null;
}

export interface ReportsSummaryItem {
  id: number;
  title: string;
  category: IncidentCategory | null;
  priority: Priority | null;
  status: ReportStatus;
  location_id: number | null;
  location: string;
  assignee: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface ReportsSummaryCount {
  count: number;
}

export interface ReportsSummaryCategory extends ReportsSummaryCount {
  category: IncidentCategory | null;
}

export interface ReportsSummaryStatus extends ReportsSummaryCount {
  status: ReportStatus;
}

export interface ReportsSummaryPriority extends ReportsSummaryCount {
  priority: Priority | null;
}

export interface ReportsSummaryBuilding extends ReportsSummaryCount {
  location_id: number | null;
  building: string | null;
}

export interface ReportsSummaryResponse {
  kpis: ReportsSummaryKpis;
  by_category: ReportsSummaryCategory[];
  by_status: ReportsSummaryStatus[];
  by_priority: ReportsSummaryPriority[];
  by_building: ReportsSummaryBuilding[];
  total: number;
  limit: number;
  offset: number;
  items: ReportsSummaryItem[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSummary(filters: ReportsSummaryFilters = {}): Observable<ReportsSummaryResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }

    return this.http.get<ReportsSummaryResponse>(`${this.apiUrl}/reports/summary`, { params });
  }
}
