import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ReportCard } from '../report-card/report-card';
import { ApiReport, ReportsApiService } from '../data/reports-api.service';
import { HomeSearchService } from '../session/home-search.service';

@Component({
  selector: 'app-community',
  imports: [ReportCard],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly homeSearch = inject(HomeSearchService);

  protected readonly pageSize = 10;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly reports = signal<ApiReport[]>([]);
  protected readonly page = signal(1);
  protected readonly searchQuery = this.homeSearch.query;

  protected readonly communityReports = computed(() => this.reports());

  protected readonly filteredCommunityReports = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.communityReports();
    if (!query) {
      return items;
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.folio.toLowerCase().includes(query) ||
        item.author.name.toLowerCase().includes(query),
    );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCommunityReports().length / this.pageSize)),
  );

  protected readonly pagedCommunityReports = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredCommunityReports().slice(start, start + this.pageSize);
  });

  protected readonly showPaginator = computed(
    () => this.filteredCommunityReports().length > this.pageSize,
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
        this.loadError.set('No se pudieron cargar los reportes de la comunidad.');
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
}
