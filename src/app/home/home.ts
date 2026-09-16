import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportCard } from '../report-card/report-card';
import { ApiReport, ReportsApiService } from '../data/reports-api.service';
import { ROLES } from '../data/roles';
import { RoleSessionService } from '../session/role-session.service';
import { AuthService } from '../auth/auth.service';
import { HomeSearchService } from '../session/home-search.service';
import {
  LucideCamera,
  LucideLink,
  LucidePencil,
  LucideTrash2,
  LucideUpload,
  LucideX,
  LucideEye,
} from '@lucide/angular';

type AdminContext = 'usuarios' | 'roles' | 'espacios';
type ImageSource = 'none' | 'url' | 'file' | 'camera';
type DialogMode = 'create' | 'edit';
type ConfirmAction = 'update' | 'delete';

@Component({
  selector: 'app-home',
  imports: [
    ReportCard,
    ReactiveFormsModule,
    RouterLink,
    LucideCamera,
    LucideLink,
    LucidePencil,
    LucideTrash2,
    LucideUpload,
    LucideX,
    LucideEye,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReportsApiService);
  private readonly auth = inject(AuthService);
  private readonly homeSearch = inject(HomeSearchService);
  protected readonly session = inject(RoleSessionService);

  protected readonly pageSize = 10;
  protected readonly roles = ROLES;
  protected readonly dialogOpen = signal(false);
  protected readonly dialogMode = signal<DialogMode>('create');
  protected readonly editingFolio = signal<string | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly confirmAction = signal<ConfirmAction | null>(null);
  protected readonly confirmError = signal<string | null>(null);
  protected readonly deleteTarget = signal<ApiReport | null>(null);
  protected readonly createdTitle = signal<string | null>(null);
  protected readonly createdFolio = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly adminContext = signal<AdminContext>('usuarios');
  protected readonly page = signal(1);
  protected readonly imageSource = signal<ImageSource>('none');
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly selectedImageFile = signal<File | null>(null);
  protected readonly imageError = signal<string | null>(null);

  protected readonly searchQuery = this.homeSearch.query;
  protected readonly reports = signal<ApiReport[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    campusLabel: ['', Validators.required],
    spaceLabel: ['', Validators.required],
    description: ['', Validators.required],
    imageUrl: [''],
  });

  protected readonly roleSlug = this.session.currentSlug;

  protected readonly ownReports = computed(() => {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      return [];
    }
    return this.reports().filter((item) => item.authorId === userId);
  });

  protected readonly filteredOwnReports = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.ownReports();
    if (!query) {
      return items;
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.folio.toLowerCase().includes(query),
    );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredOwnReports().length / this.pageSize)),
  );

  protected readonly pagedOwnReports = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredOwnReports().slice(start, start + this.pageSize);
  });

  protected readonly showPaginator = computed(() => this.filteredOwnReports().length > this.pageSize);

  protected readonly unclassified = computed(() =>
    this.reports().filter((item) => !item.classified),
  );

  protected readonly unassigned = computed(() =>
    this.reports().filter((item) => item.classified && item.status === 'creado'),
  );

  protected readonly allReports = computed(() => this.reports());

  protected readonly awaitingValidation = computed(() =>
    this.reports().filter((item) => item.awaitingValidation),
  );

  protected readonly inProgress = computed(() =>
    this.reports().filter((item) => item.status === 'en_revision'),
  );

  protected readonly assignedToMe = computed(() =>
    this.reports().filter((item) => item.status === 'en_revision' || item.status === 'creado'),
  );

  constructor() {
    effect(() => {
      this.searchQuery();
      this.page.set(1);
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  protected loadReports(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().subscribe({
      next: (items) => {
        this.reports.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar los reportes.');
        this.loading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.homeSearch.setQuery(value);
  }

  protected goToPage(nextPage: number): void {
    const clamped = Math.min(Math.max(1, nextPage), this.totalPages());
    this.page.set(clamped);
  }

  protected openDialog(): void {
    this.dialogMode.set('create');
    this.editingFolio.set(null);
    this.form.reset({
      title: '',
      campusLabel: '',
      spaceLabel: '',
      description: '',
      imageUrl: '',
    });
    this.resetImageState();
    this.submitError.set(null);
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    this.confirmError.set(null);
    this.deleteTarget.set(null);
    this.dialogOpen.set(true);
  }

  protected openEditDialog(report: ApiReport): void {
    if (report.status !== 'creado') {
      return;
    }
    this.dialogMode.set('edit');
    this.editingFolio.set(report.folio);
    this.form.reset({
      title: report.title,
      campusLabel: report.campusLabel,
      spaceLabel: report.spaceLabel,
      description: report.description,
      imageUrl: report.imageUrl ?? '',
    });
    this.resetImageState();
    if (report.imageUrl) {
      this.imageSource.set('url');
      this.imagePreviewUrl.set(report.imageUrl);
    }
    this.submitError.set(null);
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    this.confirmError.set(null);
    this.deleteTarget.set(null);
    this.dialogOpen.set(true);
  }

  protected requestDelete(report: ApiReport): void {
    if (report.status !== 'creado') {
      return;
    }
    this.deleteTarget.set(report);
    this.confirmAction.set('delete');
    this.confirmError.set(null);
    this.confirmOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.dialogMode.set('create');
    this.editingFolio.set(null);
    this.resetImageState();
  }

  protected closeConfirm(): void {
    if (this.confirmAction() === 'update') {
      this.confirmOpen.set(false);
      this.confirmAction.set(null);
      this.confirmError.set(null);
      return;
    }
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    this.confirmError.set(null);
    this.deleteTarget.set(null);
  }

  protected setImageSource(source: ImageSource): void {
    this.imageSource.set(source);
    this.imageError.set(null);
    if (source === 'url') {
      this.selectedImageFile.set(null);
      this.imagePreviewUrl.set(this.form.controls.imageUrl.value || null);
    } else if (source === 'none') {
      this.resetImageState();
    } else {
      this.form.controls.imageUrl.setValue('');
      this.selectedImageFile.set(null);
      this.imagePreviewUrl.set(null);
    }
  }

  protected onImageUrlInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.form.controls.imageUrl.setValue(value);
    this.imagePreviewUrl.set(value || null);
    this.imageSource.set(value ? 'url' : 'none');
    this.selectedImageFile.set(null);
    this.imageError.set(null);
  }

  protected onImageFile(event: Event, source: 'file' | 'camera'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.imageError.set('La imagen no puede superar 5 MB.');
      return;
    }
    this.imageSource.set(source);
    this.selectedImageFile.set(file);
    this.form.controls.imageUrl.setValue('');
    this.imageError.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  protected clearImage(): void {
    this.resetImageState();
  }

  protected submitReport(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }

    if (this.dialogMode() === 'edit') {
      this.confirmAction.set('update');
      this.confirmError.set(null);
      this.confirmOpen.set(true);
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.imageError.set(null);
    this.resolveImageUrl((imageUrl) => this.performCreate(imageUrl));
  }

  protected confirmActionLabel(): string {
    return this.confirmAction() === 'delete' ? 'Eliminar' : 'Confirmar';
  }

  protected confirmMessage(): string {
    if (this.confirmAction() === 'delete') {
      return '¿Estás seguro que deseas eliminar este reporte?';
    }
    return '¿Estás seguro que deseas realizar la modificación?';
  }

  protected executeConfirm(): void {
    if (this.submitting()) {
      return;
    }
    if (this.confirmAction() === 'delete') {
      this.performDelete();
      return;
    }
    if (this.confirmAction() === 'update') {
      this.submitting.set(true);
      this.confirmError.set(null);
      this.submitError.set(null);
      this.imageError.set(null);
      this.resolveImageUrl((imageUrl) => this.performUpdate(imageUrl));
    }
  }

  protected canMutateReport(report: ApiReport): boolean {
    return report.status === 'creado';
  }

  private resolveImageUrl(onResolved: (imageUrl: string | null) => void): void {
    const value = this.form.getRawValue();
    const file = this.selectedImageFile();
    if (file && (this.imageSource() === 'file' || this.imageSource() === 'camera')) {
      this.api.uploadImage(file).subscribe({
        next: (response) => onResolved(response.imageUrl),
        error: (err) => {
          this.imageError.set(err?.error?.detail ?? 'No se pudo subir la imagen.');
          this.submitting.set(false);
        },
      });
      return;
    }
    onResolved(value.imageUrl.trim() || null);
  }

  private performCreate(imageUrl: string | null): void {
    const value = this.form.getRawValue();
    this.api
      .create({
        title: value.title,
        campusLabel: value.campusLabel,
        spaceLabel: value.spaceLabel,
        description: value.description,
        imageUrl,
      })
      .subscribe({
        next: (report) => {
          this.reports.update((items) => [report, ...items]);
          this.dialogOpen.set(false);
          this.resetImageState();
          this.createdTitle.set(report.title);
          this.createdFolio.set(report.folio);
          this.submitting.set(false);
        },
        error: (err) => {
          this.submitError.set(
            err?.error?.detail ?? 'No se pudo crear el reporte. Intenta de nuevo.',
          );
          this.submitting.set(false);
        },
      });
  }

  private performUpdate(imageUrl: string | null): void {
    const folio = this.editingFolio();
    if (!folio) {
      this.submitting.set(false);
      return;
    }
    const value = this.form.getRawValue();
    this.api
      .update(folio, {
        title: value.title,
        campusLabel: value.campusLabel,
        spaceLabel: value.spaceLabel,
        description: value.description,
        imageUrl,
      })
      .subscribe({
        next: (report) => {
          this.reports.update((items) =>
            items.map((item) => (item.folio === folio ? report : item)),
          );
          this.confirmOpen.set(false);
          this.confirmAction.set(null);
          this.dialogOpen.set(false);
          this.dialogMode.set('create');
          this.editingFolio.set(null);
          this.resetImageState();
          this.submitting.set(false);
        },
        error: (err) => {
          this.confirmError.set(
            err?.error?.detail ?? 'No se pudo actualizar el reporte. Intenta de nuevo.',
          );
          this.submitting.set(false);
        },
      });
  }

  private performDelete(): void {
    const report = this.deleteTarget();
    if (!report) {
      return;
    }
    this.submitting.set(true);
    this.confirmError.set(null);
    this.api.delete(report.folio).subscribe({
      next: () => {
        this.reports.update((items) => items.filter((item) => item.folio !== report.folio));
        this.confirmOpen.set(false);
        this.confirmAction.set(null);
        this.deleteTarget.set(null);
        this.submitting.set(false);
      },
      error: (err) => {
        this.confirmError.set(
          err?.error?.detail ?? 'No se pudo eliminar el reporte. Intenta de nuevo.',
        );
        this.submitting.set(false);
      },
    });
  }

  protected closeCreated(): void {
    this.createdTitle.set(null);
    this.createdFolio.set(null);
  }

  protected statusLabel(status: ApiReport['status']): string {
    const labels: Record<ApiReport['status'], string> = {
      creado: 'Creado',
      en_revision: 'En revisión',
      resuelto: 'Resuelto',
    };
    return labels[status];
  }

  private resetImageState(): void {
    this.imageSource.set('none');
    this.imagePreviewUrl.set(null);
    this.selectedImageFile.set(null);
    this.imageError.set(null);
    this.form.controls.imageUrl.setValue('');
  }
}
