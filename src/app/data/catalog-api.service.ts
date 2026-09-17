import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Campus {
  id: number;
  code: string;
  name: string;
}

export interface Faculty {
  id: number;
  campusId: number;
  name: string;
}

export interface Location {
  id: number;
  facultyId: number;
  name: string;
}

export interface CampusInput {
  code: string;
  name: string;
}

export interface FacultyInput {
  campusId: number;
  name: string;
}

export interface LocationInput {
  facultyId: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listCampuses(): Observable<Campus[]> {
    return this.http.get<Campus[]>(`${this.apiUrl}/campuses/`);
  }

  createCampus(input: CampusInput): Observable<Campus> {
    return this.http.post<Campus>(`${this.apiUrl}/campuses/`, input);
  }

  updateCampus(id: number, input: Partial<CampusInput>): Observable<Campus> {
    return this.http.patch<Campus>(`${this.apiUrl}/campuses/${id}`, input);
  }

  deleteCampus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/campuses/${id}`);
  }

  listFaculties(campusId?: number): Observable<Faculty[]> {
    let params = new HttpParams();
    if (campusId != null) {
      params = params.set('campusId', campusId);
    }
    return this.http.get<Faculty[]>(`${this.apiUrl}/faculties/`, { params });
  }

  createFaculty(input: FacultyInput): Observable<Faculty> {
    return this.http.post<Faculty>(`${this.apiUrl}/faculties/`, input);
  }

  updateFaculty(id: number, input: Partial<FacultyInput>): Observable<Faculty> {
    return this.http.patch<Faculty>(`${this.apiUrl}/faculties/${id}`, input);
  }

  deleteFaculty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/faculties/${id}`);
  }

  listLocations(facultyId?: number): Observable<Location[]> {
    let params = new HttpParams();
    if (facultyId != null) {
      params = params.set('facultyId', facultyId);
    }
    return this.http.get<Location[]>(`${this.apiUrl}/locations/`, { params });
  }

  createLocation(input: LocationInput): Observable<Location> {
    return this.http.post<Location>(`${this.apiUrl}/locations/`, input);
  }

  updateLocation(id: number, input: Partial<LocationInput>): Observable<Location> {
    return this.http.patch<Location>(`${this.apiUrl}/locations/${id}`, input);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/locations/${id}`);
  }
}
