import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api/auth';

  // Signals for state management
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor() {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('omnilog_token');
    const savedUser = localStorage.getItem('omnilog_user');
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(credentials: { email: string; password?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, {
      email: credentials.email,
      password: credentials.password || 'password123'
    }).pipe(
      tap(res => {
        if (res.token) {
          this.token.set(res.token);
          this.currentUser.set(res.user);
          localStorage.setItem('omnilog_token', res.token);
          localStorage.setItem('omnilog_user', JSON.stringify(res.user));
        }
      })
    );
  }

  register(user: { name: string; email: string; role: string; password?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, {
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || 'password123'
    });
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('omnilog_token');
    localStorage.removeItem('omnilog_user');
  }
}
