import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, SlicePipe],
  template: `
    <section class="marketplace-page">
      <div class="page-header">
        <span class="page-tag">🏪 Espace Commercial</span>
        <h1>Marketplace <span class="hl">OMNILOG</span></h1>
        <p>Parcourez notre catalogue de véhicules, engins, équipements de manutention et solutions d'entreposage.</p>
      </div>

      <div class="marketplace-layout">
        <!-- SIDEBAR -->
        <aside class="sidebar">
          <div class="sidebar-inner">
            <h3>Catégories</h3>
            <ul class="filter-list">
              <li *ngFor="let cat of categories"
                  [ngClass]="{'active': selectedCategory === cat}"
                  (click)="filterByCategory(cat)">
                <span class="filter-icon">{{ getCatIcon(cat) }}</span>
                {{ cat }}
              </li>
            </ul>
          </div>
          <div class="sidebar-inner" style="margin-top: 1.5rem;">
            <h3>Recherche</h3>
            <input type="text" class="search-input" placeholder="Rechercher un produit..."
                   (input)="onSearch($event)">
          </div>
        </aside>

        <!-- PRODUCTS GRID -->
        <div class="products-area">
          <div class="results-bar">
            <span class="results-count">{{ filteredProducts.length }} résultat(s)</span>
            <span class="results-cat">{{ selectedCategory }}</span>
          </div>
          <div *ngIf="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des produits...</p>
          </div>
          <div class="products-grid" *ngIf="!loading">
            <div class="product-card" *ngFor="let product of filteredProducts">
              <div class="product-img" [style.background]="getGradient(product)">
                <span class="product-cat-badge">{{ product.category }}</span>
              </div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <p class="product-brand">{{ product.brand }}</p>
                <p class="product-desc">{{ product.description | slice:0:80 }}...</p>
                <div class="product-footer">
                  <span class="product-price">{{ product.price }}</span>
                  <button class="btn-devis" (click)="requestDevis(product)">Devis Express</button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!loading && filteredProducts.length === 0" class="empty-state">
            <span class="empty-icon">📦</span>
            <p>Aucun produit trouvé pour cette catégorie.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .marketplace-page {
      min-height: 100vh; padding: 6rem 2rem 4rem;
      background: linear-gradient(180deg, #f3f7fd 0%, #ffffff 100%);
    }
    .page-header {
      text-align: center; max-width: 700px; margin: 0 auto 3rem; padding-top: 2rem;
    }
    .page-tag {
      display: inline-block; padding: 0.4rem 1.2rem; border-radius: 30px;
      background: rgba(0, 86, 224, 0.08); border: 1px solid rgba(0, 86, 224, 0.2);
      color: var(--primary); font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;
    }
    .page-header h1 { font-size: 2.5rem; font-weight: 800; color: var(--dark); margin-bottom: 0.8rem; }
    .hl {
      background: linear-gradient(135deg, var(--primary), #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-header p { color: var(--secondary); font-size: 1rem; }
    .marketplace-layout {
      max-width: 1400px; margin: 0 auto;
      display: grid; grid-template-columns: 260px 1fr; gap: 2rem;
    }
    /* Sidebar */
    .sidebar-inner {
      background: var(--white); border: 1px solid rgba(0, 86, 224, 0.08);
      border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(10px);
      box-shadow: var(--shadow);
    }
    .sidebar-inner h3 {
      color: var(--dark); font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem;
      padding-bottom: 0.7rem; border-bottom: 1px solid rgba(0, 86, 224, 0.08);
    }
    .filter-list { list-style: none; padding: 0; margin: 0; }
    .filter-list li {
      padding: 0.7rem 1rem; border-radius: 10px; color: var(--secondary);
      font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease;
      display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;
    }
    .filter-list li:hover { background: rgba(0, 86, 224, 0.04); color: var(--primary); }
    .filter-list li.active {
      background: rgba(0, 86, 224, 0.08); color: var(--primary);
      border: 1px solid rgba(0, 86, 224, 0.15);
      font-weight: 600;
    }
    .filter-icon { font-size: 1.1rem; }
    .search-input {
      width: 100%; padding: 0.7rem 1rem; border-radius: 10px; border: 1px solid rgba(0, 86, 224, 0.15);
      background: #f8fafc; color: var(--dark); font-size: 0.88rem;
      outline: none; transition: all 0.3s ease;
    }
    .search-input:focus { border-color: var(--primary); background: var(--white); box-shadow: 0 0 0 3px rgba(0, 86, 224, 0.1); }
    .search-input::placeholder { color: #94a3b8; }
    /* Results Bar */
    .results-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem; padding: 0.8rem 1.2rem; border-radius: 12px;
      background: var(--white); border: 1px solid rgba(0, 86, 224, 0.08);
      box-shadow: var(--shadow);
    }
    .results-count { color: var(--secondary); font-size: 0.88rem; }
    .results-cat {
      padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
      background: rgba(124,58,237,0.1); color: #7c3aed;
      border: 1px solid rgba(124,58,237,0.2);
    }
    /* Grid */
    .products-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;
    }
    .product-card {
      background: var(--white); border: 1px solid rgba(0, 86, 224, 0.08);
      border-radius: 18px; overflow: hidden; transition: all 0.4s ease;
      box-shadow: var(--shadow);
    }
    .product-card:hover {
      transform: translateY(-6px); border-color: rgba(0, 86, 224, 0.2);
      box-shadow: var(--shadow-lg);
    }
    .product-img {
      height: 180px; display: flex; align-items: flex-start; justify-content: flex-end;
      padding: 1rem; position: relative;
    }
    .product-cat-badge {
      padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
      background: rgba(255, 255, 255, 0.85); color: var(--primary); backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 86, 224, 0.15);
    }
    .product-info { padding: 1.3rem; }
    .product-info h4 { color: var(--dark); font-size: 1rem; font-weight: 700; margin-bottom: 0.3rem; }
    .product-brand { color: #7c3aed; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.5rem; }
    .product-desc { color: var(--secondary); font-size: 0.82rem; line-height: 1.5; margin-bottom: 1rem; }
    .product-footer { display: flex; justify-content: space-between; align-items: center; }
    .product-price {
      font-size: 1.1rem; font-weight: 800;
      background: linear-gradient(135deg, var(--primary), #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .btn-devis {
      padding: 0.5rem 1.2rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700;
      background: linear-gradient(135deg, var(--primary), #7c3aed); color: #fff;
      border: none; cursor: pointer; transition: all 0.3s ease;
    }
    .btn-devis:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(0, 86, 224, 0.25); }
    /* Loading */
    .loading-state { text-align: center; padding: 4rem 0; }
    .loading-state p { color: var(--secondary); margin-top: 1rem; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid rgba(0, 86, 224, 0.1);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* Empty */
    .empty-state { text-align: center; padding: 4rem 0; }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .empty-state p { color: var(--secondary); }
    @media (max-width: 900px) {
      .marketplace-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class MarketplaceComponent implements OnInit {
  private api = inject(ApiService);
  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  selectedCategory = 'Tous';
  searchQuery = '';
  categories = ['Tous', 'Manutention', 'Entreposage', 'Véhicules', 'Engins'];

  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.loading = true;
    const cat = this.selectedCategory === 'Tous' ? undefined : this.selectedCategory;
    this.api.getProducts(cat).subscribe({
      next: (data) => { this.products = data; this.applySearch(); this.loading = false; },
      error: () => { this.products = []; this.filteredProducts = []; this.loading = false; }
    });
  }

  filterByCategory(cat: string) {
    this.selectedCategory = cat;
    this.loadProducts();
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applySearch();
  }

  applySearch() {
    if (!this.searchQuery) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p =>
        (p.name || '').toLowerCase().includes(this.searchQuery) ||
        (p.brand || '').toLowerCase().includes(this.searchQuery)
      );
    }
  }

  getCatIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Tous': '📋', 'Manutention': '🏗️', 'Entreposage': '🏭', 'Véhicules': '🚛', 'Engins': '⚙️'
    };
    return icons[cat] || '📦';
  }

  getGradient(product: any): string {
    const gradients: Record<string, string> = {
      'Manutention': 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
      'Entreposage': 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
      'Véhicules': 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      'Engins': 'linear-gradient(135deg, #fef3c7, #fde68a)'
    };
    return gradients[product.category] || 'linear-gradient(135deg, #e0e7ff, #c7d2fe)';
  }

  requestDevis(product: any) {
    alert(`Demande de devis pour : ${product.name}\nContactez-nous ou remplissez le formulaire dans la section Devis Express.`);
  }
}
