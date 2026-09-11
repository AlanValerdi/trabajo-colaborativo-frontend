import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportCard } from '../report-card/report-card';
import { ReportsService } from '../data/reports.service';
import { RoleSessionService } from '../session/role-session.service';

type AdminContext = 'usuarios' | 'roles' | 'espacios';

@Component({
  selector: 'app-home',
  imports: [ReportCard, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly fb = inject(FormBuilder);
  protected readonly reports = inject(ReportsService);
  protected readonly session = inject(RoleSessionService);

  protected readonly dialogOpen = signal(false);
  protected readonly createdTitle = signal<string | null>(null);
  protected readonly adminContext = signal<AdminContext>('usuarios');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    campusId: ['', Validators.required],
    spaceId: ['', Validators.required],
    description: ['', Validators.required],
  });

  protected readonly imageUrl = signal<string | null>(null);

  protected readonly roleSlug = this.session.currentSlug;

  protected readonly ownReports = computed(() =>
    this.reports.reports().filter((item) => item.authorId === this.reports.currentReportanteId),
  );

  protected readonly communityReports = computed(() =>
    this.reports.reports().filter((item) => item.authorId !== this.reports.currentReportanteId),
  );

  protected readonly assignedToMe = computed(() => {
    const ids = new Set(
      this.reports.assignments
        .filter((item) => item.technicianId === this.reports.currentTechnicianId)
        .map((item) => item.reportId),
    );
    return this.reports.reports().filter((item) => ids.has(item.id));
  });

  protected readonly inProgress = computed(() =>
    this.assignedToMe().filter((item) => item.status === 'en_revision'),
  );

  protected readonly unclassified = computed(() =>
    this.reports.reports().filter((item) => !item.classified),
  );

  protected readonly unassigned = computed(() =>
    this.reports
      .reports()
      .filter((item) => item.classified && !this.reports.assignmentFor(item.id)),
  );

  protected readonly allReports = computed(() => this.reports.reports());

  protected readonly awaitingValidation = computed(() =>
    this.reports.reports().filter((item) => item.awaitingValidation),
  );

  protected readonly technicianLoad = this.reports.technicianLoad();

  protected readonly selectedCampusId = signal(this.reports.campuses[0]?.id ?? '');

  protected readonly spacesForCampus = computed(() =>
    this.reports.spaces.filter((space) => space.campusId === this.selectedCampusId()),
  );

  protected openDialog(): void {
    this.form.reset({
      title: '',
      campusId: this.reports.campuses[0]?.id ?? '',
      spaceId: '',
      description: '',
    });
    this.selectedCampusId.set(this.form.controls.campusId.value);
    const firstSpace = this.reports.spaces.find(
      (space) => space.campusId === this.form.controls.campusId.value,
    );
    if (firstSpace) {
      this.form.controls.spaceId.setValue(firstSpace.id);
    }
    this.imageUrl.set(null);
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
  }

  protected roleName(roleId: string): string {
    return this.reports.roles.find((role) => role.id === roleId)?.name ?? roleId;
  }

  protected initials(name?: string): string {
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected onCampusChange(): void {
    this.selectedCampusId.set(this.form.controls.campusId.value);
    const first = this.spacesForCampus()[0];
    this.form.controls.spaceId.setValue(first?.id ?? '');
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.imageUrl.set(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.imageUrl.set(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  protected submitReport(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.reports.create({
      title: value.title,
      campusId: value.campusId,
      spaceId: value.spaceId,
      description: value.description,
      imageUrl: this.imageUrl(),
    });
    this.dialogOpen.set(false);
    this.createdTitle.set(value.title);
  }

  protected closeCreated(): void {
    this.createdTitle.set(null);
  }
}
