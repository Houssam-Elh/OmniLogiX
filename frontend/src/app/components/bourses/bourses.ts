import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-bourses',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section class="bourses-page">
      <div class="page-header">
        <span class="page-tag">📦 Bourses en Temps Réel</span>
        <h1>Bourses <span class="hl">Logistiques</span></h1>
        <p>Consultez les offres de fret, messagerie express, capacité de transport, entreposage et chauffeurs disponibles au Maroc.</p>
      </div>

      <!-- CATEGORY TABS -->
      <div class="tabs-container">
        <div class="tabs-scroll">
          <button *ngFor="let cat of categories"
                  class="tab-btn"
                  [ngClass]="{'active': selectedCategory === cat}"
                  (click)="filterByCategory(cat)">
            <span class="tab-icon">{{ getCatIcon(cat) }}</span>
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- LISTINGS -->
      <div class="listings-container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des annonces...</p>
        </div>

        <div class="listings-grid" *ngIf="!loading">
          <div class="listing-card" *ngFor="let bourse of filteredBourses; let i = index"
               [style.animation-delay]="i * 0.08 + 's'">
            <div class="listing-header">
              <span class="listing-category" [ngClass]="getCatClass(bourse.category)">{{ bourse.category }}</span>
              <span class="listing-date">{{ bourse.date }}</span>
            </div>
            <h3 class="listing-title">{{ bourse.title }}</h3>
            <div class="listing-route">
              <div class="route-point">
                <span class="route-dot origin"></span>
                <div>
                  <span class="route-label">Départ</span>
                  <span class="route-city">{{ bourse.origin }}</span>
                </div>
              </div>
              <div class="route-arrow">
                <span class="arrow-line"></span>
                <span class="arrow-head">›</span>
              </div>
              <div class="route-point">
                <span class="route-dot destination"></span>
                <div>
                  <span class="route-label">Arrivée</span>
                  <span class="route-city">{{ bourse.destination }}</span>
                </div>
              </div>
            </div>
            <div class="listing-details">
              <div class="detail-item">
                <span class="detail-label">Marchandise</span>
                <span class="detail-value">{{ bourse.cargo }}</span>
              </div>
            </div>
            <div class="listing-footer">
              <span class="listing-price">{{ bourse.price }}</span>
              <button class="btn-contact">Contacter</button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && filteredBourses.length === 0" class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>Aucune annonce disponible dans cette catégorie.</p>
        </div>
      </div>

      <!-- FAB -->
      <button class="fab" (click)="publishAnnonce()">
        <span>+</span>
      </button>
    </section>
  `,
  styles: [`
    .bourses-page {
      min-height: 100vh; padding: 6rem 2rem 4rem;
      background: linear-gradient(180deg, #ffffff 0%, #f3f7fd 100%);
    }
    .page-header {
      text-align: center; max-width: 700px; margin: 0 auto 2.5rem; padding-top: 2rem;
    }
    .page-tag {
      display: inline-block; padding: 0.4rem 1.2rem; border-radius: 30px;
      background: rgba(0, 86, 224, 0.08); border: 1px solid rgba(0, 86, 224, 0.15);
      color: #0056e0; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;
    }
    .page-header h1 { font-size: 2.5rem; font-weight: 800; color: #0a1128; margin-bottom: 0.8rem; }
    .hl {
      background: linear-gradient(135deg, #0056e0, #00c0f0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-header p { color: #4b5563; font-size: 1rem; }

    /* TABS */
    .tabs-container {
      max-width: 1200px; margin: 0 auto 2.5rem; overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .tabs-scroll {
      display: flex; gap: 0.5rem; padding: 0.5rem;
      min-width: max-content;
    }
    .tab-btn {
      padding: 0.6rem 1.3rem; border-radius: 30px; border: 1px solid rgba(0, 86, 224, 0.08);
      background: #ffffff; color: #5a6b82; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; transition: all 0.3s ease;
      white-space: nowrap; display: flex; align-items: center; gap: 0.4rem;
      box-shadow: 0 4px 15px rgba(0, 86, 224, 0.02);
    }
    .tab-btn:hover { background: rgba(0, 86, 224, 0.06); color: #0056e0; border-color: rgba(0, 86, 224, 0.15); }
    .tab-btn.active {
      background: rgba(0, 86, 224, 0.1); color: #0056e0;
      border-color: rgba(0, 86, 224, 0.3); box-shadow: 0 4px 15px rgba(0, 86, 224, 0.1);
    }
    .tab-icon { font-size: 1rem; }

    /* LISTINGS */
    .listings-container { max-width: 1200px; margin: 0 auto; }
    .listings-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;
    }
    .listing-card {
      background: #ffffff; border: 1px solid rgba(0, 86, 224, 0.08);
      border-radius: 20px; padding: 1.8rem; transition: all 0.4s ease;
      box-shadow: 0 4px 20px rgba(0, 86, 224, 0.02);
      animation: fadeInUp 0.5s ease both;
    }
    .listing-card:hover {
      transform: translateY(-5px); border-color: rgba(0, 86, 224, 0.2);
      box-shadow: 0 20px 40px rgba(0, 86, 224, 0.08);
    }
    .listing-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .listing-category {
      padding: 0.25rem 0.8rem; border-radius: 20px; font-size: 0.72rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .cat-fret { background: rgba(0, 86, 224, 0.08); color: #0056e0; border: 1px solid rgba(0, 86, 224, 0.15); }
    .cat-messagerie { background: rgba(245,158,11,0.08); color: #f59e0b; border: 1px solid rgba(245,158,11,0.15); }
    .cat-capacite { background: rgba(16,185,129,0.08); color: #10b981; border: 1px solid rgba(16,185,129,0.15); }
    .cat-entreposage { background: rgba(124,58,237,0.08); color: #7c3aed; border: 1px solid rgba(124,58,237,0.15); }
    .cat-chauffeurs { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }
    .cat-default { background: rgba(0, 86, 224, 0.08); color: #0056e0; border: 1px solid rgba(0, 86, 224, 0.15); }
    .listing-date { color: #7a8fa6; font-size: 0.8rem; }
    .listing-title { color: #0a1128; font-size: 1.05rem; font-weight: 700; margin-bottom: 1.2rem; line-height: 1.4; }

    /* ROUTE */
    .listing-route {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem;
      padding: 1rem; border-radius: 12px; background: #f3f7fd;
    }
    .route-point { display: flex; align-items: center; gap: 0.6rem; }
    .route-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .route-dot.origin { background: #0056e0; box-shadow: 0 0 8px rgba(0, 86, 224, 0.3); }
    .route-dot.destination { background: #00c0f0; box-shadow: 0 0 8px rgba(0, 192, 240, 0.3); }
    .route-label { display: block; font-size: 0.7rem; color: #7a8fa6; text-transform: uppercase; letter-spacing: 0.5px; }
    .route-city { display: block; color: #0a1128; font-size: 0.88rem; font-weight: 600; }
    .route-arrow { display: flex; align-items: center; flex: 1; min-width: 40px; }
    .arrow-line { flex: 1; height: 1px; background: linear-gradient(90deg, #0056e0, #00c0f0); }
    .arrow-head { color: #00c0f0; font-size: 1.5rem; font-weight: 800; margin-left: -2px; }

    /* DETAILS */
    .listing-details { margin-bottom: 1.2rem; }
    .detail-item { display: flex; justify-content: space-between; padding: 0.4rem 0; }
    .detail-label { color: #5a6b82; font-size: 0.82rem; }
    .detail-value { color: #0a1128; font-size: 0.82rem; font-weight: 600; text-align: right; max-width: 60%; }

    /* FOOTER */
    .listing-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 1rem; border-top: 1px solid rgba(0, 86, 224, 0.08);
    }
    .listing-price {
      font-size: 1.15rem; font-weight: 800;
      background: linear-gradient(135deg, #0056e0, #00c0f0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .btn-contact {
      padding: 0.5rem 1.3rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
      background: transparent; color: #0056e0; border: 1.5px solid rgba(0, 86, 224, 0.3);
      cursor: pointer; transition: all 0.3s ease;
    }
    .btn-contact:hover {
      background: rgba(0, 86, 224, 0.08); border-color: #0056e0;
      box-shadow: 0 0 15px rgba(0, 86, 224, 0.1);
    }

    /* FAB */
    .fab {
      position: fixed; bottom: 2rem; right: 6rem; width: 56px; height: 56px;
      border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(135deg, #0056e0, #00c0f0); color: #fff;
      font-size: 1.8rem; font-weight: 300; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 30px rgba(0, 86, 224, 0.3); transition: all 0.3s ease;
      z-index: 100;
    }
    .fab:hover { transform: scale(1.1) rotate(90deg); box-shadow: 0 12px 40px rgba(0, 86, 224, 0.4); }

    /* LOADING & EMPTY */
    .loading-state { text-align: center; padding: 4rem 0; }
    .loading-state p { color: #5a6b82; margin-top: 1rem; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid rgba(0, 86, 224, 0.1);
      border-top-color: #0056e0; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 4rem 0; }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .empty-state p { color: #5a6b82; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 600px) {
      .listings-grid { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 1.8rem; }
    }
  `]
})
export class BoursesComponent implements OnInit {
  private api = inject(ApiService);
  bourses: any[] = [];
  filteredBourses: any[] = [];
  loading = true;
  selectedCategory = 'Tous';
  categories = ['Tous', 'Bourse de Fret', 'Bourse Messagerie & Express', 'Bourse de Capacité', 'Bourse Entreposage', 'Bourse des Chauffeurs'];

  ngOnInit() { this.loadBourses(); }

  loadBourses() {
    this.loading = true;
    const cat = this.selectedCategory === 'Tous' ? undefined : this.selectedCategory;
    this.api.getBourses(cat).subscribe({
      next: (data) => { this.bourses = data; this.filteredBourses = data; this.loading = false; },
      error: () => { this.bourses = []; this.filteredBourses = []; this.loading = false; }
    });
  }

  filterByCategory(cat: string) {
    this.selectedCategory = cat;
    this.loadBourses();
  }

  getCatIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Tous': '📋', 'Bourse de Fret': '🚛', 'Bourse Messagerie & Express': '📮',
      'Bourse de Capacité': '📐', 'Bourse Entreposage': '🏭', 'Bourse des Chauffeurs': '👷'
    };
    return icons[cat] || '📦';
  }

  getCatClass(category: string): string {
    if (category?.includes('Fret')) return 'cat-fret';
    if (category?.includes('Messagerie')) return 'cat-messagerie';
    if (category?.includes('Capacité')) return 'cat-capacite';
    if (category?.includes('Entreposage')) return 'cat-entreposage';
    if (category?.includes('Chauffeurs')) return 'cat-chauffeurs';
    return 'cat-default';
  }

  publishAnnonce() {
    alert('Fonctionnalité de publication d\'annonce. Connectez-vous pour publier une annonce sur la bourse logistique.');
  }
}
