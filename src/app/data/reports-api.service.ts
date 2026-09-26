import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IncidentCategory, Priority, ReportStatus } from './models';

export interface ReportAuthor {
  id: number;
  name: string;
}

export interface ApiReport {
  id: number;
  folio: string;
  title: string;
  description: string;
  campusLabel: string;
  facultyLabel: string;
  spaceLabel: string;
  campusId: number | null;
  facultyId: number | null;
  locationId: number | null;
  status: ReportStatus;
  category: IncidentCategory | null;
  specialtyId: number | null;
  assigneeId: number | null;
  assignedAt: string | null;
  imageUrl: string | null;
  authorId: number;
  author: ReportAuthor;
  classified: boolean;
  priority: Priority | null;
  awaitingValidation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiReportInput {
  title: string;
  description: string;
  campusId: number;
  facultyId: number;
  locationId: number;
  imageUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(): Observable<ApiReport[]> {
    return this.http.get<ApiReport[]>(`${this.apiUrl}/reports/`);
  }

  getByFolio(folio: string): Observable<ApiReport> {
    return this.http.get<ApiReport>(`${this.apiUrl}/reports/${folio}`);
  }

  create(input: CreateApiReportInput): Observable<ApiReport> {
    return this.http.post<ApiReport>(`${this.apiUrl}/reports/`, input);
  }

  update(folio: string, input: CreateApiReportInput): Observable<ApiReport> {
    return this.http.patch<ApiReport>(`${this.apiUrl}/reports/${folio}`, input);
  }

  delete(folio: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reports/${folio}`);
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/reports/images`, formData);
  }

  listSpecialties(): Observable<ApiSpecialty[]> {
    return this.http.get<ApiSpecialty[]>(`${this.apiUrl}/specialties/`);
  }

  categorize(folio: string, input: CategorizeReportInput): Observable<ApiReport> {
    return this.http.post<ApiReport>(`${this.apiUrl}/reports/${folio}/category`, input);
  }

  assign(folio: string, assigneeId: number): Observable<ApiReport> {
    return this.http.post<ApiReport>(`${this.apiUrl}/reports/${folio}/assignments`, { assigneeId });
  }

  listAssignments(folio: string): Observable<ApiAssignment[]> {
    return this.http.get<ApiAssignment[]>(`${this.apiUrl}/reports/${folio}/assignments`);
  }

  changeStatus(folio: string, input: StatusChangeInput): Observable<ApiReport> {
    return this.http.post<ApiReport>(`${this.apiUrl}/reports/${folio}/status`, input);
  }

  listStatusEvents(folio: string): Observable<ApiStatusEvent[]> {
    return this.http.get<ApiStatusEvent[]>(`${this.apiUrl}/reports/${folio}/status-events`);
  }
}

export interface ApiSpecialty {
  id: number;
  code: string;
  name: string;
  category: IncidentCategory;
}

export interface CategorizeReportInput {
  category: IncidentCategory;
  priority: Priority;
}

export interface ApiAssignment {
  id: number;
  reportId: number;
  assigneeId: number;
  assignedById: number;
  assignedAt: string;
  status: ReportStatus;
  specialtyId: number;
}

export interface StatusChangeInput {
  status: ReportStatus;
  comment?: string | null;
}

export interface ApiStatusEvent {
  id: number;
  reportId: number;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  actorId: number;
  comment: string | null;
  createdAt: string;
}
