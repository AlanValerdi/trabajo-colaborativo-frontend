import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the summary endpoint with the backend query parameter names', () => {
    service.getSummary({
      start_date: '2026-01-01',
      end_date: '2026-01-31',
      category_id: 'ti',
      area_id: 4,
      location_id: 5,
      status: 'bloqueada',
      priority: 'critica',
      limit: 25,
      offset: 25,
    }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/reports/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([
      'start_date',
      'end_date',
      'category_id',
      'area_id',
      'location_id',
      'status',
      'priority',
      'limit',
      'offset',
    ]);
    expect(request.request.params.get('priority')).toBe('critica');
    expect(request.request.params.get('area_id')).toBe('4');
    expect(request.request.url).not.toContain('/api/');
    request.flush({
      kpis: {
        total: 3,
        open: 1,
        in_progress: 1,
        blocked: 0,
        resolved_closed: 1,
        average_resolution_hours: 2.5,
      },
      by_category: [],
      by_status: [],
      by_priority: [],
      by_building: [],
      total: 3,
      limit: 25,
      offset: 25,
      items: [],
    });
  });

  it('omits empty dates and filters so the backend returns all reports', () => {
    service.getSummary({ limit: 20, offset: 0 }).subscribe();

    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/reports/summary`);
    expect(request.request.params.keys()).toEqual(['limit', 'offset']);
    expect(request.request.params.has('start_date')).toBeFalse();
    expect(request.request.params.has('end_date')).toBeFalse();
    request.flush({
      kpis: {
        total: 0,
        open: 0,
        in_progress: 0,
        blocked: 0,
        resolved_closed: 0,
        average_resolution_hours: null,
      },
      by_category: [],
      by_status: [],
      by_priority: [],
      by_building: [],
      total: 0,
      limit: 20,
      offset: 0,
      items: [],
    });
  });
});
