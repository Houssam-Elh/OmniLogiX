import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api';

  // Products Marketplace
  getProducts(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<any[]>(`${this.baseUrl}/products`, { params });
  }

  // Bourses listings
  getBourses(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<any[]>(`${this.baseUrl}/bourses`, { params });
  }

  createBourse(listing: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/bourses`, listing);
  }

  // Devis Express
  createDevis(devis: {
    productName: string;
    userName: string;
    company: string;
    email: string;
    phone: string;
    message: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/devis`, devis);
  }

  getDevisList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/devis`);
  }

  // Chatbot IA (Simulated RAG)
  sendChatMessage(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.baseUrl}/chat`, { message });
  }

  // Payment Checkout (Stripe checkout url)
  createCheckoutSession(planName: string, amount: number): Observable<{ url: string; sessionId: string }> {
    return this.http.post<{ url: string; sessionId: string }>(`${this.baseUrl}/stripe/checkout`, { planName, amount });
  }
}
