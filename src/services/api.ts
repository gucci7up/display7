import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = '/api-proxy';
const DEFAULT_EMAIL = 'display@mbsport.com';
const DEFAULT_PASSWORD = '20260615';
const AGENCY_STORAGE_KEY = 'display_agency_id';

// Modo: 'pc' lee MP4 desde carpeta local C:\videos\
//       'apk' lee MP4 desde servidor
const getMode = (): 'pc' | 'apk' => {
  const params = new URLSearchParams(window.location.search);
  return (params.get('mode') as 'pc' | 'apk') ?? 'apk';
};

const PC_VIDEO_PATH = 'C:/videos/';
const SERVER_VIDEO_URL = 'https://api.mbsport.lat/videos-new/';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private isAuthenticating: Promise<string> | null = null;
  private displayAgencyId: string | null = null;

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlAgencyId = urlParams.get('agencyId');
    if (urlAgencyId) {
      this.displayAgencyId = urlAgencyId;
      localStorage.setItem(AGENCY_STORAGE_KEY, urlAgencyId);
    } else {
      this.displayAgencyId = localStorage.getItem(AGENCY_STORAGE_KEY);
    }

    this.client = axios.create({
      baseURL: API_URL,
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (config.url?.includes('/auth/login')) return config;
        if (!this.token) {
          try {
            const token = await this.authenticate();
            if (config.headers) config.headers.Authorization = `Bearer ${token}`;
          } catch (err) {
            console.error('Auth failed:', err);
          }
        } else {
          if (config.headers) config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          this.token = null;
          try {
            const token = await this.authenticate();
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (authError) {
            return Promise.reject(authError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async authenticate(): Promise<string> {
    if (this.isAuthenticating) return this.isAuthenticating;
    this.isAuthenticating = (async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: DEFAULT_EMAIL,
          password: DEFAULT_PASSWORD,
        });
        this.token = response.data.accessToken;
        return this.token!;
      } catch (error) {
        throw error;
      } finally {
        this.isAuthenticating = null;
      }
    })();
    return this.isAuthenticating;
  }

  // Retorna URL del MP4 según modo PC o APK
  public getVideoUrl(archivo: string): string {
    const filename = archivo.split('/').pop() || archivo;
    const name = filename.replace(/\.[^.]+$/, '');
    if (getMode() === 'pc') {
      return `file:///${PC_VIDEO_PATH}${name}.mp4`;
    }
    return `${SERVER_VIDEO_URL}${name}.mp4`;
  }

  public getToken(): string | null { return this.token; }

  public getDisplayAgencyId(): string | null { return this.displayAgencyId; }

  public setDisplayAgencyId(id: string | null): void {
    this.displayAgencyId = id;
    if (id) localStorage.setItem(AGENCY_STORAGE_KEY, id);
    else localStorage.removeItem(AGENCY_STORAGE_KEY);
  }

  public async getAgencies() {
    const response = await this.client.get('/agencies');
    return response.data;
  }

  public async getCurrentRace() {
    const response = await this.client.get('/races/current');
    return response.data;
  }

  public async getRaceHistory(limit = 5, agencyId?: string) {
    const effectiveId = agencyId ?? this.displayAgencyId ?? undefined;
    const params = new URLSearchParams({ limit: String(limit) });
    if (effectiveId) params.set('agencyId', effectiveId);
    const response = await this.client.get(`/races/history?${params.toString()}`);
    return response.data;
  }

  public async getLiveOdds(raceId: string) {
    const response = await this.client.get(`/odds/race/${raceId}/live`);
    return response.data;
  }

  public async getGameStatus(agencyId?: string) {
    const effectiveId = agencyId ?? this.displayAgencyId ?? undefined;
    const url = effectiveId ? `/race-engine/status?agencyId=${effectiveId}` : '/race-engine/status';
    const response = await this.client.get(url);
    return response.data;
  }
}

export const api = new ApiService();
