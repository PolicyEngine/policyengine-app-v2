import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import {
  accountAssociationId,
  AccountAssociationRoutes,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { isAssociationCountry, type UserReportItem } from '@/types/v2User';
import { UserReport } from '../types/ingredients/UserReport';

export interface UserReportStore {
  create: (report: Omit<UserReport, 'id' | 'createdAt'>) => Promise<UserReport>;
  /**
   * Saves under a caller-chosen ID (shared-report saves in localStorage).
   * Account storage assigns its own IDs, so the API store omits it.
   */
  createWithId?: (report: Omit<UserReport, 'createdAt'>) => Promise<UserReport>;
  findByUser: (userId: string, countryId?: string) => Promise<UserReport[]>;
  findById: (userId: string, reportId: string) => Promise<UserReport | null>;
  findByUserReportId: (userReportId: string) => Promise<UserReport | null>;
  update: (userReportId: string, updates: Partial<UserReport>) => Promise<UserReport>;
  delete: (userReportId: string) => Promise<void>;
}

/**
 * Account storage: `/v2/user-reports` on the PolicyEngine API. The server
 * stamps the signed-in user onto each row; `userId` arguments are never
 * sent.
 *
 * Report links are URL-addressable, so local IDs (`sur-…`) keep working
 * after sign-in: imported ones resolve to their account UUID, and ones
 * never imported are read from (and updated in) this browser's
 * localStorage as before.
 */
export class ApiReportStore implements UserReportStore {
  private readonly routes: AccountAssociationRoutes<UserReportItem>;

  constructor(
    private readonly context: ApiStoreContext,
    private readonly local: UserReportStore = new LocalStorageReportStore()
  ) {
    this.routes = new AccountAssociationRoutes(context, 'user-reports', 'UserReport');
  }

  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    const countryId = isAssociationCountry(report.countryId)
      ? report.countryId
      : this.routes.countryId;
    const item = await this.routes.create(UserReportAdapter.toCreationPayload(report, countryId));
    return UserReportAdapter.fromApiItem(item);
  }

  async findByUser(_userId: string, countryId?: string): Promise<UserReport[]> {
    if (countryId && countryId !== this.routes.countryId) {
      return [];
    }
    const items = await this.routes.list();
    return items.filter(UserReportAdapter.hasLegacyReport).map(UserReportAdapter.fromApiItem);
  }

  /** The association for a v1 report ID (the oldest, as localStorage returns the first). */
  async findById(_userId: string, reportId: string): Promise<UserReport | null> {
    if (!isLegacyId(reportId)) {
      return null;
    }
    const item = await this.routes.findFirst({ legacy_report_id: reportId });
    return item && UserReportAdapter.hasLegacyReport(item)
      ? UserReportAdapter.fromApiItem(item)
      : null;
  }

  async findByUserReportId(userReportId: string): Promise<UserReport | null> {
    if (!accountAssociationId(this.context, userReportId)) {
      return this.local.findByUserReportId(userReportId);
    }
    const item = await this.routes.get(userReportId);
    return item && UserReportAdapter.hasLegacyReport(item)
      ? UserReportAdapter.fromApiItem(item)
      : null;
  }

  async update(userReportId: string, updates: Partial<UserReport>): Promise<UserReport> {
    if (!accountAssociationId(this.context, userReportId)) {
      return this.local.update(userReportId, updates);
    }
    const item = await this.routes.patch(userReportId, UserReportAdapter.toUpdatePayload(updates));
    return UserReportAdapter.fromApiItem(item);
  }

  delete(userReportId: string): Promise<void> {
    if (!accountAssociationId(this.context, userReportId)) {
      return this.local.delete(userReportId);
    }
    return this.routes.delete(userReportId);
  }
}

export class LocalStorageReportStore implements UserReportStore {
  private readonly STORAGE_KEY = 'user-report-associations';

  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    // Generate a unique ID for local storage
    // Format: "sur-[short-timestamp][random]"
    // Use base36 encoding for compactness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const uniqueId = `sur-${timestamp}${random}`;

    const newReport: UserReport = {
      ...report,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const reports = this.getStoredReports();

    const updatedReports = [...reports, newReport];
    this.setStoredReports(updatedReports);

    return newReport;
  }

  async createWithId(report: Omit<UserReport, 'createdAt'>): Promise<UserReport> {
    // Check if ID already exists (idempotent - don't create duplicates)
    const existing = await this.findByUserReportId(report.id!);
    if (existing) {
      throw new Error(`Association with id ${report.id} already exists`);
    }

    const newReport: UserReport = {
      ...report,
      id: report.id!,
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const reports = this.getStoredReports();
    const updatedReports = [...reports, newReport];
    this.setStoredReports(updatedReports);

    return newReport;
  }

  async findByUser(userId: string, countryId?: string): Promise<UserReport[]> {
    const reports = this.getStoredReports();
    return reports.filter((r) => r.userId === userId && (!countryId || r.countryId === countryId));
  }

  async findById(userId: string, reportId: string): Promise<UserReport | null> {
    const reports = this.getStoredReports();
    return reports.find((r) => r.userId === userId && r.reportId === reportId) || null;
  }

  async findByUserReportId(userReportId: string): Promise<UserReport | null> {
    const reports = this.getStoredReports();
    return reports.find((r) => r.id === userReportId) || null;
  }

  private getStoredReports(): UserReport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredReports(reports: UserReport[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
  }

  async update(userReportId: string, updates: Partial<UserReport>): Promise<UserReport> {
    const reports = this.getStoredReports();

    // Find by userReport.id (the "sur-" prefixed ID), NOT reportId
    const index = reports.findIndex((r) => r.id === userReportId);

    if (index === -1) {
      throw new Error(`UserReport with id ${userReportId} not found`);
    }

    // Merge updates and set timestamp
    const updated: UserReport = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    reports[index] = updated;
    this.setStoredReports(reports);

    return updated;
  }

  async delete(userReportId: string): Promise<void> {
    this.setStoredReports(this.getStoredReports().filter((r) => r.id !== userReportId));
  }
}
