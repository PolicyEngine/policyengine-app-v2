/**
 * User Report Associations Store
 *
 * MIGRATION NOTE: When API v2 alpha adds user-report-association endpoints,
 * this file should be migrated to use the v2 API. Follow the pattern established in:
 * - householdAssociation.ts (ApiHouseholdStore)
 * - v2/userHouseholdAssociations.ts (API functions)
 *
 * Key migration steps:
 * 1. Create a new v2/userReportAssociations.ts module with:
 *    - Type definitions for API request/response (snake_case)
 *    - Conversion functions (toV2CreateRequest, fromV2Response)
 *    - API functions (create, fetch, update, delete)
 * 2. Update ApiReportStore to delegate to the v2 API functions
 * 3. Add delete method to UserReportStore interface
 * 4. Update the interface's update signature to use associationId instead of composite keys
 */
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import { UserReportCreationPayload } from '@/types/payloads';
import { UserReport } from '../types/ingredients/UserReport';

export interface UserReportStore {
  create: (report: Omit<UserReport, 'id' | 'createdAt'>) => Promise<UserReport>;
  createWithId: (report: Omit<UserReport, 'createdAt'>) => Promise<UserReport>;
  findByUser: (userId: string, countryId?: string) => Promise<UserReport[]>;
  findById: (userId: string, reportId: string) => Promise<UserReport | null>;
  findByUserReportId: (userReportId: string) => Promise<UserReport | null>;
  update: (userReportId: string, updates: Partial<UserReport>) => Promise<UserReport>;
  // The below are not yet implemented, but keeping for future use
  // delete(userReportId: string): Promise<void>;
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

  // Added for interface consistency; may be removed when user auth is implemented
  async createWithId(report: Omit<UserReport, 'createdAt'>): Promise<UserReport> {
    // For API store, we pass the ID to the backend and let it handle idempotency
    const payload: UserReportCreationPayload = UserReportAdapter.toCreationPayload(report);

    const response = await fetch(`${this.BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: report.id }),
    });

    if (!response.ok) {
      throw new Error('Failed to create report association');
    }

    const apiResponse = await response.json();
    return UserReportAdapter.fromApiResponse(apiResponse);
  }

  async findByUser(userId: string, countryId?: string): Promise<UserReport[]> {
    const response = await fetch(`${this.BASE_URL}/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user associations');
    }

    const apiResponses = await response.json();

    // Convert each API response to UserReport and filter by country if specified
    const reports = apiResponses.map((apiData: any) => UserReportAdapter.fromApiResponse(apiData));
    return countryId ? reports.filter((r: UserReport) => r.countryId === countryId) : reports;
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

  // Note: This method relies on as-of-yet unimplemented API endpoint; will alter once available
  async findByUserReportId(userReportId: string): Promise<UserReport | null> {
    const response = await fetch(`${this.BASE_URL}/${userReportId}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user report');
    }

    const apiData = await response.json();
    return UserReportAdapter.fromApiResponse(apiData);
  }

  async update(_userReportId: string, _updates: Partial<UserReport>): Promise<UserReport> {
    // TODO: Implement when backend API endpoint is available
    // Expected endpoint: PUT /api/user-report-associations/:userReportId
    // Expected payload: UserReportUpdatePayload (to be created)

    console.warn(
      '[ApiReportStore.update] API endpoint not yet implemented. ' +
        'This method will be activated when user authentication is added.'
    );

    throw new Error(
      'Report updates via API are not yet supported. ' +
        'Please ensure you are using localStorage mode.'
    );
  }

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
