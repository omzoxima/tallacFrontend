/**
 * API Client for Tallac CRM
 * Handles all API calls to the Node.js backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        // Unauthorized - clear token but don't redirect automatically
        // Let the component handle the redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; max-age=0';
        }
        return { success: false, message: 'Unauthorized' };
      }

      const data = await response.json();
      console.log('API raw response data:', data);

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || 'Request failed',
          error: data.error,
        };
      }

      // Backend returns { success: true, token: "...", user: {...} }
      // We spread it to include all fields
      const result = { success: true, ...data };
      console.log('API processed response:', result);
      return result;
    } catch (error: any) {
      console.error('API request error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
        error: error.message,
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('API login response:', response);

    // Backend returns { success: true, token: "...", user: {...} }
    // After request() it becomes { success: true, token: "...", user: {...} }
    const token = (response as any).token || (response as any).data?.token;
    if (response.success && token) {
      if (typeof window !== 'undefined') {
        // Save to localStorage for API calls
        localStorage.setItem('auth_token', token);
        // Also save to cookie for middleware
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        console.log('Token saved to localStorage and cookie');
      }
    }

    return response;
  }

  async register(userData: any): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Prospects endpoints
  async getProspects(filters?: any, limit = 1000, page = 1): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    params.append('limit', String(limit));
    params.append('page', String(page));
    return this.request(`/prospects?${params.toString()}`);
  }

  async getProspect(id: string): Promise<ApiResponse<any>> {
    return this.request(`/prospects/${id}`);
  }

  async createProspect(data: any): Promise<ApiResponse<any>> {
    return this.request('/prospects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProspect(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/prospects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProspect(id: string): Promise<ApiResponse> {
    return this.request(`/prospects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProspectDetails(id: string): Promise<ApiResponse<any>> {
    return this.request(`/prospects/${id}`);
  }

  async createCallLog(prospectId: string, logData: any): Promise<ApiResponse<any>> {
    return this.request(`/prospects/${prospectId}/call-log`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async manageOrganizationLinks(organizationId: string, action: string, linkData: any): Promise<ApiResponse> {
    return this.request(`/prospects/organization/${organizationId}/links`, {
      method: 'POST',
      body: JSON.stringify({ action, link_data: linkData }),
    });
  }

  async setOrganizationPrimaryContact(organizationId: string, contactId: string): Promise<ApiResponse> {
    return this.request(`/prospects/organization/${organizationId}/primary-contact`, {
      method: 'PUT',
      body: JSON.stringify({ contact_id: contactId }),
    });
  }

  async updateContact(contactId: string, contactData: any): Promise<ApiResponse<any>> {
    return this.request(`/prospects/contact/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async getOrganizationContacts(organizationId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/prospects/organization/${organizationId}/contacts`);
  }

  async searchOrganizations(query: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', '20');
    return this.request(`/prospects/organizations/search?${params.toString()}`);
  }

  // Activities endpoints
  async getActivities(filters?: any): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/activities?${params.toString()}`);
  }

  async getActivity(id: string): Promise<ApiResponse<any>> {
    return this.request(`/activities/${id}`);
  }

  async createActivity(data: any): Promise<ApiResponse<any>> {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivity(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: string): Promise<ApiResponse> {
    return this.request(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  async getProspectActivities(prospectId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/activities?prospect_id=${prospectId}`);
  }

  async getScheduledActivities(prospectId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/activities/prospect/${prospectId}/scheduled`);
  }

  async createScheduledActivity(data: any): Promise<ApiResponse<any>> {
    return this.request('/activities/scheduled', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createNoteActivity(data: any): Promise<ApiResponse<any>> {
    return this.request('/activities/note', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCallLog(prospectId: string, logData: any): Promise<ApiResponse<any>> {
    return this.request(`/activities/call-log`, {
      method: 'POST',
      body: JSON.stringify({ prospect: prospectId, ...logData }),
    });
  }

  async updateCallLog(callLogId: string, logData: any): Promise<ApiResponse<any>> {
    return this.request(`/activities/${callLogId}`, {
      method: 'PUT',
      body: JSON.stringify(logData),
    });
  }

  // Territories endpoints
  async getTerritories(filters?: any): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request(`/territories${queryString ? `?${queryString}` : ''}`);
  }

  async searchTerritories(query: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    return this.request(`/territories?search=${encodeURIComponent(query)}&limit_page_length=${limit}`);
  }

  async getTerritory(id: string): Promise<ApiResponse<any>> {
    return this.request(`/territories/${id}`);
  }

  async createTerritory(data: any): Promise<ApiResponse<any>> {
    return this.request('/territories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTerritory(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/territories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTerritory(id: string): Promise<ApiResponse> {
    return this.request(`/territories/${id}`, {
      method: 'DELETE',
    });
  }

  async getTerritoryDetails(idOrName: string): Promise<ApiResponse<any>> {
    return this.request(`/territories/${idOrName}`);
  }

  async getTerritoryZipcodeDetails(territoryName: string): Promise<ApiResponse<any[]>> {
    return this.request(`/territories/${territoryName}/zipcodes`);
  }

  async getTerritoryFilters(): Promise<ApiResponse<{ regions: string[]; states: string[] }>> {
    return this.request('/territories/filters');
  }

  // Partners endpoints
  async getPartners(filters?: any): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/partners?${params.toString()}`);
  }

  async getPartner(id: string): Promise<ApiResponse<any>> {
    return this.request(`/partners/${id}`);
  }

  async getPartnerDetails(id: string): Promise<ApiResponse<any>> {
    return this.request(`/partners/${id}`);
  }

  async createPartner(data: any): Promise<ApiResponse<any>> {
    return this.request('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartner(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePartner(id: string): Promise<ApiResponse> {
    return this.request(`/partners/${id}`, {
      method: 'DELETE',
    });
  }

  async addTerritoriesToPartner(partnerId: string, territoryIds: string[]): Promise<ApiResponse> {
    return this.request(`/partners/${partnerId}/territories`, {
      method: 'POST',
      body: JSON.stringify({ territories: territoryIds }),
    });
  }

  async createTeamMember(partnerId: string, userData: any): Promise<ApiResponse> {
    return this.request(`/partners/${partnerId}/team-members`, {
      method: 'POST',
      body: JSON.stringify({ user_data: userData }),
    });
  }

  async getStates(): Promise<ApiResponse<any[]>> {
    return this.request('/partners/states');
  }

  // Users endpoints
  async getUsers(filters?: any): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    return this.request(`/users?${params.toString()}`);
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`);
  }

  async createUser(data: any): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ user_data: data }),
    });
  }

  async updateUser(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsersForAssignment(territory?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (territory) params.append('territory', territory);
    return this.request(`/users/assignment/list?${params.toString()}`);
  }

  async assignTerritoryToUser(userId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/${userId}/territories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Industries endpoints
  async getIndustries(): Promise<ApiResponse<any[]>> {
    return this.request('/industries');
  }

  // Dashboard endpoints
  async getDashboardAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/dashboard/analytics');
  }

  // Import endpoints
  async importProspects(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/import/prospects`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return { success: false, message: 'Unauthorized' };
    }

    const data = await response.json();
    return { success: response.ok, ...data };
  }
}

export const api = new ApiClient();

