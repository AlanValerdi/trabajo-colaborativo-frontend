import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  IncidentCategory,
  Priority,
  ReportStatus,
} from './models';


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

export interface ApiComment {
  id: number;
  report_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

/* =========================================================
   HU-11 — DIAGNÓSTICO TÉCNICO
   ========================================================= */

export interface ApiDiagnosis {
  id: number;
  reportId: number;
  authorId: number;

  author: ReportAuthor;

  evaluation: string;
  rootCause: string;

  createdAt: string;
}


export interface CreateDiagnosisInput {
  evaluation: string;
  rootCause: string;
}


/* =========================================================
   HU-12 — BITÁCORA DE ACTIVIDADES
   ========================================================= */

export interface ApiWorkLog {
  id: number;
  reportId: number;
  authorId: number;

  author: ReportAuthor;

  tasks: string;
  materials: string;
  timeMinutes: number;

  createdAt: string;
}


export interface CreateWorkLogInput {
  tasks: string;
  materials: string;
  timeMinutes: number;
}


/* =========================================================
   SERVICIO DE REPORTES
   ========================================================= */

@Injectable({
  providedIn: 'root',
})
export class ReportsApiService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;


  /* =======================================================
     REPORTES
     ======================================================= */

  list(): Observable<ApiReport[]> {
    return this.http.get<ApiReport[]>(
      `${this.apiUrl}/reports/`,
    );
  }


  getByFolio(
    folio: string,
  ): Observable<ApiReport> {

    return this.http.get<ApiReport>(
      `${this.apiUrl}/reports/${folio}`,
    );
  }


  create(
    input: CreateApiReportInput,
  ): Observable<ApiReport> {

    return this.http.post<ApiReport>(
      `${this.apiUrl}/reports/`,
      input,
    );
  }


  update(
    folio: string,
    input: CreateApiReportInput,
  ): Observable<ApiReport> {

    return this.http.patch<ApiReport>(
      `${this.apiUrl}/reports/${folio}`,
      input,
    );
  }


  delete(
    folio: string,
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/reports/${folio}`,
    );
  }


  uploadImage(
    file: File,
  ): Observable<{ imageUrl: string }> {

    const formData = new FormData();

    formData.append(
      'file',
      file,
    );

    return this.http.post<{ imageUrl: string }>(
      `${this.apiUrl}/reports/images`,
      formData,
    );
  }


  /* =======================================================
     ESPECIALIDADES / CATEGORIZACIÓN
     ======================================================= */

  listSpecialties(): Observable<ApiSpecialty[]> {

    return this.http.get<ApiSpecialty[]>(
      `${this.apiUrl}/specialties/`,
    );
  }


  categorize(
    folio: string,
    input: CategorizeReportInput,
  ): Observable<ApiReport> {

    return this.http.post<ApiReport>(
      `${this.apiUrl}/reports/${folio}/category`,
      input,
    );
  }


  /* =======================================================
     HU-09 — ASIGNACIÓN DE TÉCNICO
     ======================================================= */

  assign(
    folio: string,
    assigneeId: number,
  ): Observable<ApiReport> {

    return this.http.post<ApiReport>(
      `${this.apiUrl}/reports/${folio}/assignments`,
      {
        assigneeId,
      },
    );
  }


  listAssignments(
    folio: string,
  ): Observable<ApiAssignment[]> {

    return this.http.get<ApiAssignment[]>(
      `${this.apiUrl}/reports/${folio}/assignments`,
    );
  }


  /* =======================================================
     HU-10 — ESTADOS DEL REPORTE
     ======================================================= */

  changeStatus(
    folio: string,
    input: StatusChangeInput,
  ): Observable<ApiReport> {

    return this.http.post<ApiReport>(
      `${this.apiUrl}/reports/${folio}/status`,
      input,
    );
  }


  listStatusEvents(
    folio: string,
  ): Observable<ApiStatusEvent[]> {

    return this.http.get<ApiStatusEvent[]>(
      `${this.apiUrl}/reports/${folio}/status-events`,
    );
  }

  /* --- Métodos para Comentarios --- */
  getComments(reportId: number): Observable<ApiComment[]> {
    return this.http.get<ApiComment[]>(`${this.apiUrl}/reports/${reportId}/comments`);
  }

  createComment(reportId: number, content: string): Observable<ApiComment> {
    return this.http.post<ApiComment>(`${this.apiUrl}/reports/${reportId}/comments`, { content });
  }

  updateComment(commentId: number, content: string): Observable<ApiComment> {
    return this.http.put<ApiComment>(`${this.apiUrl}/comments/${commentId}`, { content });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }

  /* =======================================================
     HU-11 — DIAGNÓSTICO TÉCNICO
     ======================================================= */

  getDiagnosis(
    folio: string,
  ): Observable<ApiDiagnosis> {

    return this.http.get<ApiDiagnosis>(
      `${this.apiUrl}/reports/${folio}/diagnosis`,
    );
  }


  createDiagnosis(
    folio: string,
    input: CreateDiagnosisInput,
  ): Observable<ApiDiagnosis> {

    return this.http.post<ApiDiagnosis>(
      `${this.apiUrl}/reports/${folio}/diagnosis`,
      input,
    );
  }


  /* =======================================================
     HU-12 — BITÁCORA TÉCNICA
     ======================================================= */

  listWorkLogs(
    folio: string,
  ): Observable<ApiWorkLog[]> {

    return this.http.get<ApiWorkLog[]>(
      `${this.apiUrl}/reports/${folio}/work-logs`,
    );
  }


  createWorkLog(
    folio: string,
    input: CreateWorkLogInput,
  ): Observable<ApiWorkLog> {

    return this.http.post<ApiWorkLog>(
      `${this.apiUrl}/reports/${folio}/work-logs`,
      input,
    );
  }

}


/* =========================================================
   ESPECIALIDADES
   ========================================================= */

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


/* =========================================================
   ASIGNACIONES
   ========================================================= */

export interface ApiAssignment {
  id: number;
  reportId: number;

  assigneeId: number;
  assignedById: number;

  assignedAt: string;

  status: ReportStatus;
  specialtyId: number;
}


/* =========================================================
   CAMBIOS DE ESTADO
   ========================================================= */

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