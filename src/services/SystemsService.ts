import { AuthUser, SystemsOverviewResponse, BackendSystemStatus } from '../types';

export interface WorkflowItem {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: string;
  lastRun: string;
  executions: number;
}

export interface SystemsListener {
  (overview: SystemsOverviewResponse | null): void;
}

export interface AuthListener {
  (user: AuthUser | null): void;
}

class SystemsService {
  private overview: SystemsOverviewResponse | null = null;
  private currentUser: AuthUser | null = null;
  private systemsListeners: Set<SystemsListener> = new Set();
  private authListeners: Set<AuthListener> = new Set();
  private pollTimer: any = null;

  constructor() {
    this.checkSession();
    this.fetchOverview();
    // Poll live telemetry every 2.5 seconds
    this.pollTimer = setInterval(() => {
      this.fetchOverview();
    }, 2500);
  }

  public subscribeSystems(listener: SystemsListener): () => void {
    this.systemsListeners.add(listener);
    if (this.overview) listener(this.overview);
    return () => this.systemsListeners.delete(listener);
  }

  public subscribeAuth(listener: AuthListener): () => void {
    this.authListeners.add(listener);
    listener(this.currentUser);
    return () => this.authListeners.delete(listener);
  }

  public getOverview(): SystemsOverviewResponse | null {
    return this.overview;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public async fetchOverview(): Promise<SystemsOverviewResponse | null> {
    try {
      const res = await fetch('/api/systems/overview');
      if (res.ok) {
        const data = await res.json();
        this.overview = data;
        this.systemsListeners.forEach(fn => fn(this.overview));
        return data;
      }
    } catch {
      // Offline fallback telemetry if needed
    }
    return null;
  }

  public async checkSession(): Promise<AuthUser | null> {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          this.authListeners.forEach(fn => fn(this.currentUser));
          return data.user;
        }
      }
    } catch {
      // Non-blocking
    }
    return null;
  }

  public async signIn(params: {
    traderId: string;
    role: string;
    desk: string;
    clearanceLevel: string;
  }): Promise<AuthUser> {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Authentication rejected (${res.status})`);
    }

    const data = await res.json();
    this.currentUser = data.user;
    this.authListeners.forEach(fn => fn(this.currentUser));
    return data.user;
  }

  public async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Continue
    }
    this.currentUser = null;
    this.authListeners.forEach(fn => fn(null));
  }

  public async createWorkflow(name: string, trigger: string, action: string): Promise<any> {
    const res = await fetch('/api/systems/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, trigger, action })
    });
    if (res.ok) {
      const data = await res.json();
      await this.fetchOverview();
      return data;
    }
    throw new Error('Failed to create workflow');
  }

  public async fetchRoutingDiagnostic(): Promise<any> {
    try {
      const res = await fetch('/api/systems/diagnostic/routing');
      if (res.ok) {
        const data = await res.json();
        return data.report;
      }
    } catch (err) {
      console.warn('Routing diagnostic fetch warning:', err);
    }
    return null;
  }
}

export const systemsService = new SystemsService();
