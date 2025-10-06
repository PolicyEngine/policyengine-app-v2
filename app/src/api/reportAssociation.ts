import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import { UserReportCreationPayload } from '@/types/payloads';
import { UserReport } from '../types/ingredients/UserReport';

export interface UserReportStore {
  create: (report: Omit<UserReport, 'id' | 'createdAt'>) => Promise<UserReport>;
  findByUser: (userId: string) => Promise<UserReport[]>;
  findById: (userId: string, reportId: string) => Promise<UserReport | null>;
  // The below are not yet implemented, but keeping for future use
  // update(userId: string, reportId: string, updates: Partial<UserReport>): Promise<UserReport>;
  // delete(userId: string, reportId: string): Promise<void>;
}

export class ApiReportStore implements UserReportStore {
  // TODO: Modify value to match to-be-created API endpoint structure
  private readonly BASE_URL = '/api/user-report-associations';

  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    const payload: UserReportCreationPayload = UserReportAdapter.toCreationPayload(report);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create report association');
    }

    const apiResponse = await response.json();
    return UserReportAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string): Promise<UserReport[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserReport
    return apiResponses.map((apiData: any) => UserReportAdapter.fromApiResponse(apiData));
  }

  async findById(userId: string, reportId: string): Promise<UserReport | null> {
    const response = await fetch(`${this.BASE_URL}/${userId}/${reportId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch association');
    }

    const apiData = await response.json();
    return UserReportAdapter.fromApiResponse(apiData);
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, reportId: string, updates: Partial<UserReport>): Promise<UserReport> {
    const response = await fetch(`/api/user-report-associations/${userId}/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update association');
    }

    return response.json();
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, reportId: string): Promise<void> {
    const response = await fetch(`/api/user-report-associations/${userId}/${reportId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete association');
    }
  }
  */
}

export class SessionStorageReportStore implements UserReportStore {
  private readonly STORAGE_KEY = 'user-report-associations';

  async create(report: Omit<UserReport, 'id' | 'createdAt'>): Promise<UserReport> {
    // Generate a unique ID for session storage
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

    // Check for duplicates
    const exists = reports.some(
      (r) => r.userId === report.userId && r.reportId === report.reportId
    );

    if (exists) {
      throw new Error('Association already exists');
    }

    const updatedReports = [...reports, newReport];
    this.setStoredReports(updatedReports);

    return newReport;
  }

  async findByUser(userId: string): Promise<UserReport[]> {
    const reports = this.getStoredReports();
    return reports.filter((r) => r.userId === userId);
  }

  async findById(userId: string, reportId: string): Promise<UserReport | null> {
    const reports = this.getStoredReports();
    return reports.find((r) => r.userId === userId && r.reportId === reportId) || null;
  }

  private getStoredReports(): UserReport[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private setStoredReports(reports: UserReport[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
  }

  // Not yet implemented, but keeping for future use
  /*
  async update(userId: string, reportId: string, updates: Partial<UserReport>): Promise<UserReport> {
    const reports = this.getStoredReports();
    const index = reports.findIndex(
      a => a.userId === userId && a.reportId === reportId
    );

    if (index === -1) {
      throw new Error('Association not found');
    }

    const updated = { ...reports[index], ...updates };
    reports[index] = updated;
    this.setStoredReports(reports);

    return updated;
  }
  */

  // Not yet implemented, but keeping for future use
  /*
  async delete(userId: string, reportId: string): Promise<void> {
    const reports = this.getStoredReports();
    const filtered = reports.filter(
      a => !(a.userId === userId && a.reportId === reportId)
    );
    this.setStoredReports(filtered);
  }
  */
}
