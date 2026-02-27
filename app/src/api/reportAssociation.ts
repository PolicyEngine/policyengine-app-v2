import {
  createUserReportAssociationV2,
  deleteUserReportAssociationV2,
  fetchUserReportAssociationByIdV2,
  fetchUserReportAssociationsV2,
  updateUserReportAssociationV2,
} from '@/api/v2/userReportAssociations';
import { UserReport } from '../types/ingredients/UserReport';

export interface UserReportStore {
  create: (report: Omit<UserReport, 'id' | 'createdAt'>) => Promise<UserReport>;
  createWithId: (report: Omit<UserReport, 'createdAt'>) => Promise<UserReport>;
  findByUser: (userId: string, countryId?: string) => Promise<UserReport[]>;
  findById: (userId: string, reportId: string) => Promise<UserReport | null>;
  findByUserReportId: (userReportId: string) => Promise<UserReport | null>;
  update: (
    userReportId: string,
    userId: string,
    updates: Partial<UserReport>
  ) => Promise<UserReport>;
  delete: (userReportId: string, userId: string) => Promise<void>;
}

export class ApiReportStore implements UserReportStore {
  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    return createUserReportAssociationV2(report);
  }

  async createWithId(report: Omit<UserReport, 'createdAt'>): Promise<UserReport> {
    // v2 API generates its own UUIDs; pass as a normal create
    return createUserReportAssociationV2(report);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserReport[]> {
    return fetchUserReportAssociationsV2(userId, countryId);
  }

  async findById(userId: string, reportId: string): Promise<UserReport | null> {
    // v2 API has no composite-key endpoint; list by user and filter
    const associations = await fetchUserReportAssociationsV2(userId);
    return associations.find((a) => a.reportId === reportId) ?? null;
  }

  async findByUserReportId(userReportId: string): Promise<UserReport | null> {
    return fetchUserReportAssociationByIdV2(userReportId);
  }

  async update(
    userReportId: string,
    userId: string,
    updates: Partial<UserReport>
  ): Promise<UserReport> {
    return updateUserReportAssociationV2(userReportId, userId, {
      label: updates.label ?? null,
      last_run_at: updates.lastRunAt ?? null,
    });
  }

  async delete(userReportId: string, userId: string): Promise<void> {
    return deleteUserReportAssociationV2(userReportId, userId);
  }
}

export class LocalStorageReportStore implements UserReportStore {
  private readonly STORAGE_KEY = 'user-report-associations';

  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
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
    this.setStoredReports([...reports, newReport]);

    return newReport;
  }

  async createWithId(report: Omit<UserReport, 'createdAt'>): Promise<UserReport> {
    const existing = await this.findByUserReportId(report.id);
    if (existing) {
      throw new Error(`Association with id ${report.id} already exists`);
    }

    const newReport: UserReport = {
      ...report,
      id: report.id,
      createdAt: new Date().toISOString(),
      isCreated: true,
    };

    const reports = this.getStoredReports();
    this.setStoredReports([...reports, newReport]);

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

  async update(
    userReportId: string,
    _userId: string,
    updates: Partial<UserReport>
  ): Promise<UserReport> {
    const reports = this.getStoredReports();
    const index = reports.findIndex((r) => r.id === userReportId);

    if (index === -1) {
      throw new Error(`UserReport with id ${userReportId} not found`);
    }

    const updated: UserReport = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    reports[index] = updated;
    this.setStoredReports(reports);

    return updated;
  }

  async delete(userReportId: string, _userId: string): Promise<void> {
    const reports = this.getStoredReports();
    const filtered = reports.filter((r) => r.id !== userReportId);

    if (filtered.length === reports.length) {
      throw new Error(`Association with id ${userReportId} not found`);
    }

    this.setStoredReports(filtered);
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
}
