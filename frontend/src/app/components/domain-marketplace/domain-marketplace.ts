import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface TaxonomyItem {
  id: string;
  name: string;
  nameFr: string;
  count: number;
  checked: boolean;
}

interface BrandItem {
  name: string;
  checked: boolean;
}

interface LocationItem {
  name: string;
  checked: boolean;
}

interface MockListing {
  id: string;
  title: string;
  brand: string;
  type: string;
  year: number;
  hoursOrMileage: string;
  loadCap: string;
  liftingHeight: string;
  additionalSpecs: string[];
  price: string;
  location: string;
  imagesCount: number;
  activeImageIndex: number;
  sellerName: string;
  sellerBadge: string;
  sellerExperience: string;
  gradientSeed: number;
  taxonomyId?: string;
}

@Component({
  selector: 'app-domain-marketplace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <main class="domain-marketplace-page">
      <!-- BREADCRUMBS (OmniLogix > Parent > Subcategory) -->
      <div class="breadcrumbs-nav">
        <a [routerLink]="['/']" class="breadcrumb-link">OmniLogix</a>
        <span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>
        <span class="breadcrumb-current-parent">{{ parentDesignationFr }}</span>
        <span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>
        <span class="breadcrumb-current">{{ domainDesignationFr }}</span>
      </div>

      <!-- MAIN PAGE HEADER -->
      <div class="domain-page-header">
        <div class="header-title-row">
          <h1 class="domain-title">{{ domainDesignationFr }}</h1>
          <button class="btn-favorite-domain" (click)="toggleDomainFavorite()" [class.favorited]="isDomainFavorited">
            <i class="fa-star" [class.fas]="isDomainFavorited" [class.far]="!isDomainFavorited"></i>
          </button>
        </div>
      </div>

      <!-- DIRECTORY COUNT AND ACTION SUBBAR -->
      <div class="directory-action-subbar">
        <div class="subbar-left">
          <span class="total-ads-badge">{{ filteredListings.length }} annonce(s)</span>
          <span class="subbar-tagline">
            {{ domainDesignationFr }} d'occasion et neufs en stock au Maroc.
          </span>
        </div>
        <div class="subbar-right">
          <button class="btn-subscribe-subbar" (click)="subscribeToAlerts()">
            <i class="far fa-bell"></i> S'abonner
          </button>
          <div class="sort-dropdown-container">
            <select class="sort-select" (change)="onSortChange($event)">
              <option value="recent">Date de publication</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="year_desc">Année récente</option>
            </select>
          </div>
        </div>
      </div>

      <div class="marketplace-body-layout">
        <!-- LEFT FILTER SIDEBAR -->
        <aside class="filter-sidebar">
          <!-- CATEGORY / TAXONOMY FILTER -->
          <div class="filter-card">
            <h3 class="filter-card-title">Catégorie</h3>
            
            <div class="filter-search-box">
              <i class="fas fa-search filter-search-icon"></i>
              <input 
                type="text" 
                class="filter-search-input" 
                placeholder="Rechercher une catégorie..." 
                [(ngModel)]="taxonomyQuery"
                (input)="filterTaxonomies()">
            </div>

            <div class="checkbox-list-container" [class.expanded]="showAllTaxonomies">
              @for (tax of filteredTaxonomies; track tax.id) {
                <label class="filter-checkbox-label">
                  <input 
                    type="checkbox" 
                    class="filter-checkbox-input"
                    [checked]="tax.checked"
                    (change)="onTaxonomyToggle(tax.id)">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text-group">
                    <span class="checkbox-name">{{ tax.nameFr }}</span>
                    <span class="checkbox-count">({{ tax.count }})</span>
                  </span>
                </label>
              } @empty {
                <p class="checkbox-list-empty">Aucune catégorie trouvée.</p>
              }
            </div>

            @if (taxonomies.length > 5) {
              <button class="btn-toggle-show-all" (click)="toggleShowAllTaxonomies()">
                {{ showAllTaxonomies ? 'Voir moins' : 'Afficher tout (' + taxonomies.length + ')' }}
              </button>
            }
          </div>

          <!-- BRAND FILTER -->
          <div class="filter-card">
            <h3 class="filter-card-title">Marque</h3>

            <div class="filter-search-box">
              <i class="fas fa-search filter-search-icon"></i>
              <input 
                type="text" 
                class="filter-search-input" 
                placeholder="Rechercher une marque..." 
                [(ngModel)]="brandQuery"
                (input)="filterBrands()">
            </div>

            <div class="checkbox-list-container">
              @for (brand of filteredBrands; track brand.name) {
                <label class="filter-checkbox-label">
                  <input 
                    type="checkbox" 
                    class="filter-checkbox-input"
                    [checked]="brand.checked"
                    (change)="onBrandToggle(brand.name)">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text-group">
                    <span class="checkbox-name">{{ brand.name }}</span>
                  </span>
                </label>
              } @empty {
                <p class="checkbox-list-empty">Aucune marque trouvée.</p>
              }
            </div>
          </div>

          <!-- REGION / LOCATION FILTER -->
          <div class="filter-card">
            <h3 class="filter-card-title">Localisation (Maroc)</h3>

            <div class="checkbox-list-container">
              @for (loc of locations; track loc.name) {
                <label class="filter-checkbox-label">
                  <input 
                    type="checkbox" 
                    class="filter-checkbox-input"
                    [checked]="loc.checked"
                    (change)="onLocationToggle(loc.name)">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text-group">
                    <span class="checkbox-name">{{ loc.name }}</span>
                  </span>
                </label>
              }
            </div>
          </div>
        </aside>

        <!-- RIGHT LISTINGS GRID -->
        <section class="listings-container">
          @if (loading) {
            <div class="loading-state-box">
              <div class="custom-spinner"></div>
              <p>Chargement des annonces en cours...</p>
            </div>
          } @else {
            @for (list of filteredListings; track list.id) {
              <!-- HORIZONTAL AD CARD (MACHINERYLINE STYLE) -->
              <article class="machinery-ad-card">
                <!-- 1. LEFT COLUMN: PHOTOS & MINI GALLERY -->
                <div class="ad-media-panel">
                  <div class="primary-image-viewport" [style.background]="getGradient(list, list.activeImageIndex)">
                    <!-- Emoji icon placeholder tailored by vehicle type -->
                    <span class="primary-image-emoji">{{ getCategoryEmoji(list.type) }}</span>
                    <!-- Image Count Badge -->
                    <div class="media-count-tag">
                      <i class="fas fa-camera"></i> {{ list.imagesCount }}
                    </div>
                  </div>
                  <!-- Thumbnails row for interactive gallery preview -->
                  <div class="media-thumbnails-strip">
                    @for (idx of [0, 1, 2]; track idx) {
                      <div 
                        class="thumbnail-frame" 
                        [class.active]="list.activeImageIndex === idx"
                        [style.background]="getGradient(list, idx)"
                        (mouseenter)="list.activeImageIndex = idx">
                        <span class="thumbnail-emoji">{{ getCategoryEmoji(list.type) }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- 2. MIDDLE COLUMN: TEXT DETAILS & TECHNICAL SPECS -->
                <div class="ad-details-panel">
                  <h2 class="ad-listing-title" (click)="consultListing(list)">
                    {{ list.title }}
                  </h2>
                  <p class="ad-listing-subtitle">{{ list.type }}</p>

                  <!-- Technical chips divider row -->
                  <div class="ad-tech-divider-row">
                    <span class="tech-chip">📅 {{ list.year }}</span>
                    <span class="tech-chip">⏱️ {{ list.hoursOrMileage }}</span>
                  </div>

                  <!-- Expanded technical specifications block -->
                  <div class="ad-expanded-specs-grid">
                    @if (list.loadCap) {
                      <div class="spec-metric">
                        <span class="metric-label">Capacité :</span>
                        <span class="metric-value">{{ list.loadCap }}</span>
                      </div>
                    }
                    @if (list.liftingHeight) {
                      <div class="spec-metric">
                        <span class="metric-label">Hauteur levage :</span>
                        <span class="metric-value">{{ list.liftingHeight }}</span>
                      </div>
                    }
                    @for (extra of list.additionalSpecs; track extra) {
                      <div class="spec-metric">
                        <span class="metric-label">{{ extra.split(':')[0] }} :</span>
                        <span class="metric-value">{{ extra.split(':')[1] }}</span>
                      </div>
                    }
                  </div>

                  <!-- Location tag with flag -->
                  <div class="ad-location-tag">
                    <span class="flag-icon">🇲🇦</span>
                    <span class="location-text">{{ list.location }}, Maroc</span>
                  </div>

                  <!-- Seller Info Bar -->
                  <div class="ad-seller-bar">
                    <div class="seller-logo-box">
                      {{ list.sellerName.substring(0, 3).toUpperCase() }}
                    </div>
                    <div class="seller-meta">
                      <div class="seller-name-row">
                        <span class="seller-name">{{ list.sellerName }}</span>
                        <span class="seller-badge-pro"><i class="fas fa-check-circle"></i> {{ list.sellerBadge }}</span>
                      </div>
                      <span class="seller-experience">{{ list.sellerExperience }} sur OmniLogix</span>
                    </div>
                  </div>
                </div>

                <!-- 3. RIGHT COLUMN: PRICING & CALL TO ACTIONS -->
                <div class="ad-pricing-panel">
                  <div class="pricing-container">
                    <div class="price-val">{{ list.price }}</div>
                    @if (list.price !== 'Sur demande') {
                      <div class="price-tax-note">Hors Taxes (HT)</div>
                    }
                  </div>

                  <div class="action-buttons-group">
                    <button class="btn-primary-contact" (click)="contactSeller(list)">
                      <i class="far fa-envelope"></i> Contacter
                    </button>
                    
                    <div class="utility-buttons-row">
                      <button class="btn-utility-star" (click)="toggleListingFavorite(list)" [class.active]="isListingFavorited(list.id)">
                        <i class="fa-star" [class.fas]="isListingFavorited(list.id)" [class.far]="!isListingFavorited(list.id)"></i>
                      </button>
                      <button class="btn-utility-compare" (click)="compareListing(list)">
                        <i class="fas fa-scales-balanced"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="listings-empty-state">
                <span class="empty-icon-glyph">🔍</span>
                <h3>Aucune annonce ne correspond à ces critères</h3>
                <p>Essayez de réinitialiser vos filtres ou d'élargir votre recherche.</p>
                <button class="btn-reset-filters" (click)="resetAllFilters()">
                  Réinitialiser les filtres
                </button>
              </div>
            }
          }
        </section>
      </div>
    </main>
  `,
  styles: [`
    /* ===== PREMIUM HORIZONTAL DOMAIN MARKETPLACE LAYOUT ===== */
    .domain-marketplace-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 7.5rem 2rem 5rem;
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
      min-height: 100vh;
      color: #1e293b;
    }

    /* ===== BREADCRUMBS ===== */
    .breadcrumbs-nav {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .breadcrumb-link {
      color: #0d52b9;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .breadcrumb-link:hover {
      color: #083c8d;
      text-decoration: underline;
    }
    .breadcrumb-separator {
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .breadcrumb-current-parent {
      color: #64748b;
    }
    .breadcrumb-current {
      color: #1e293b;
    }

    /* ===== HEADER ROW ===== */
    .domain-page-header {
      margin-bottom: 1.5rem;
    }
    .header-title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .domain-title {
      font-size: 2.2rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.8px;
      margin: 0;
    }
    .btn-favorite-domain {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #94a3b8;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }
    .btn-favorite-domain:hover {
      border-color: #ff5a00;
      color: #ff5a00;
      transform: scale(1.03);
    }
    .btn-favorite-domain.favorited {
      background-color: #fffaf0;
      border-color: #ffd8a8;
      color: #ff922b;
    }

    /* ===== DIRECTORY SUBBAR ===== */
    .directory-action-subbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.01);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .subbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .total-ads-badge {
      background-color: #f1f5f9;
      color: #0f172a;
      font-size: 0.85rem;
      font-weight: 800;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .subbar-tagline {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 600;
    }
    .subbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .btn-subscribe-subbar {
      background-color: #ff5a00;
      color: #ffffff;
      border: none;
      padding: 0.5rem 1.2rem;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background-color 0.2s ease;
    }
    .btn-subscribe-subbar:hover {
      background-color: #e04f00;
    }
    .sort-select {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: #334155;
      outline: none;
      cursor: pointer;
    }

    /* ===== BODY LAYOUT ===== */
    .marketplace-body-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 2rem;
    }

    /* ===== SIDEBAR FILTERS ===== */
    .filter-sidebar {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.01);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .filter-card {
      padding: 1.5rem;
    }
    .filter-card:not(:last-child) {
      padding-bottom: 0.5rem;
    }
    .filter-card:not(:first-child) {
      padding-top: 0.5rem;
    }
    .filter-card-title {
      font-size: 1rem;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 1rem;
      color: #0f172a;
    }
    .filter-search-box {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }
    .filter-search-icon {
      position: absolute;
      left: 0.8rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .filter-search-input {
      width: 100%;
      padding: 0.5rem 0.8rem 0.5rem 2.2rem;
      font-size: 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background-color: #f8fafc;
      color: #1e293b;
      transition: all 0.15s ease;
    }
    .filter-search-input:focus {
      border-color: #0d52b9;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(13,82,185,0.05);
    }
    .checkbox-list-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 250px;
      overflow-y: auto;
      padding-right: 0.3rem;
    }
    .checkbox-list-container.expanded {
      max-height: none;
      overflow-y: visible;
      padding-right: 0;
    }
    /* Custom Scrollbar for Checkboxes */
    .checkbox-list-container::-webkit-scrollbar {
      width: 5px;
    }
    .checkbox-list-container::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .checkbox-list-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .checkbox-list-empty {
      font-size: 0.8rem;
      color: #64748b;
      font-style: italic;
      margin: 0;
    }
    .filter-checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 600;
      color: #475569;
      position: relative;
      user-select: none;
      padding: 0.2rem 0;
      transition: color 0.15s ease;
    }
    .filter-checkbox-label:hover {
      color: #0d52b9;
    }
    .filter-checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkbox-custom {
      width: 17px;
      height: 17px;
      background-color: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      display: inline-block;
      flex-shrink: 0;
      position: relative;
      transition: all 0.15s ease;
    }
    .filter-checkbox-label:hover .checkbox-custom {
      border-color: #0d52b9;
    }
    .filter-checkbox-input:checked ~ .checkbox-custom {
      background-color: #0d52b9;
      border-color: #0d52b9;
    }
    .checkbox-custom::after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 1.5px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .filter-checkbox-input:checked ~ .checkbox-custom::after {
      display: block;
    }
    .checkbox-text-group {
      display: flex;
      justify-content: space-between;
      width: 100%;
      line-height: 1.15;
    }
    .checkbox-count {
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }
    .btn-toggle-show-all {
      background: none;
      border: none;
      color: #0d52b9;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      margin-top: 1rem;
      padding: 0;
      text-decoration: underline;
    }
    .btn-toggle-show-all:hover {
      color: #083c8d;
    }

    /* ===== RIGHT LISTINGS LIST ===== */
    .listings-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .loading-state-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4rem 2rem;
      text-align: center;
      color: #64748b;
    }
    .custom-spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid #cbd5e1;
      border-top-color: #0d52b9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ===== DYNAMIC HORIZONTAL LISTING CARD ===== */
    .machinery-ad-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.01);
      display: grid;
      grid-template-columns: 260px 1fr 220px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .machinery-ad-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 20px rgba(15,23,42,0.04);
      transform: translateY(-1px);
    }

    /* 1. MEDIA COLUMN */
    .ad-media-panel {
      padding: 12px;
      background-color: #fafbfc;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-right: 1px solid #f1f5f9;
    }
    .primary-image-viewport {
      height: 150px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      transition: filter 0.3s ease;
    }
    .primary-image-emoji {
      font-size: 3.8rem;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
      transition: transform 0.3s ease;
    }
    .machinery-ad-card:hover .primary-image-emoji {
      transform: scale(1.06);
    }
    .media-count-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(15,23,42,0.65);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .media-thumbnails-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .thumbnail-frame {
      height: 38px;
      border-radius: 4px;
      border: 1.5px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.65;
      transition: all 0.2s ease;
      overflow: hidden;
    }
    .thumbnail-frame:hover {
      opacity: 1;
      border-color: #cbd5e1;
    }
    .thumbnail-frame.active {
      opacity: 1;
      border-color: #0d52b9;
      box-shadow: 0 0 0 2px rgba(13,82,185,0.08);
    }
    .thumbnail-emoji {
      font-size: 1.1rem;
    }

    /* 2. SPECIFICATION COLUMN */
    .ad-details-panel {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #f1f5f9;
    }
    .ad-listing-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.2rem 0;
      line-height: 1.25;
      cursor: pointer;
      transition: color 0.15s ease;
      display: inline-block;
    }
    .ad-listing-title:hover {
      color: #0d52b9;
      text-decoration: underline;
    }
    .ad-listing-subtitle {
      font-size: 0.82rem;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 0.8rem 0;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .ad-tech-divider-row {
      display: flex;
      gap: 0.4rem;
      margin-bottom: 0.8rem;
    }
    .tech-chip {
      background-color: #f1f5f9;
      color: #334155;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .ad-expanded-specs-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1.2rem;
      margin-bottom: 1rem;
      background-color: #fafbfc;
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      border: 1px solid #f1f5f9;
    }
    .spec-metric {
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      gap: 0.3rem;
    }
    .metric-label {
      color: #64748b;
    }
    .metric-value {
      color: #0f172a;
      font-weight: 700;
    }
    .ad-location-tag {
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .flag-icon {
      font-size: 1.05rem;
    }
    .ad-seller-bar {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-top: auto;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.8rem;
    }
    .seller-logo-box {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background-color: #f1f5f9;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #cbd5e1;
    }
    .seller-meta {
      display: flex;
      flex-direction: column;
    }
    .seller-name-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .seller-name {
      font-size: 0.82rem;
      font-weight: 800;
      color: #1e293b;
    }
    .seller-badge-pro {
      color: #22c55e;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .seller-experience {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
    }

    /* 3. PRICING & ACTIONS COLUMN */
    .ad-pricing-panel {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      background-color: #fafbfc;
    }
    .pricing-container {
      text-align: right;
    }
    .price-val {
      font-size: 1.6rem;
      font-weight: 900;
      color: #0d52b9;
      letter-spacing: -0.5px;
    }
    .price-tax-note {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 700;
    }
    .action-buttons-group {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .btn-primary-contact {
      background-color: #0d52b9;
      color: #ffffff;
      border: none;
      width: 100%;
      padding: 0.65rem;
      font-size: 0.88rem;
      font-weight: 800;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background-color 0.2s ease, transform 0.1s ease;
      box-shadow: 0 2px 4px rgba(13,82,185,0.06);
    }
    .btn-primary-contact:hover {
      background-color: #083c8d;
      transform: translateY(-1px);
    }
    .utility-buttons-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    }
    .btn-utility-star, .btn-utility-compare {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.88rem;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-utility-star:hover {
      border-color: #ff5a00;
      color: #ff5a00;
    }
    .btn-utility-star.active {
      border-color: #ffd8a8;
      background-color: #fffaf0;
      color: #ff922b;
    }
    .btn-utility-compare:hover {
      border-color: #0d52b9;
      color: #0d52b9;
    }

    /* ===== EMPTY STATE ===== */
    .listings-empty-state {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 5rem 2rem;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.01);
    }
    .empty-icon-glyph {
      font-size: 3.5rem;
      display: block;
      margin-bottom: 1.2rem;
      opacity: 0.7;
    }
    .listings-empty-state h3 {
      font-size: 1.2rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      color: #0f172a;
    }
    .listings-empty-state p {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: 0;
      margin-bottom: 1.8rem;
    }
    .btn-reset-filters {
      background-color: #0d52b9;
      color: #ffffff;
      border: none;
      padding: 0.6rem 1.5rem;
      font-weight: 700;
      font-size: 0.88rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-reset-filters:hover {
      background-color: #083c8d;
    }

    /* ===== RESPONSIVE GRID LAYOUT ===== */
    @media (max-width: 1200px) {
      .marketplace-body-layout {
        grid-template-columns: 1fr;
      }
      .filter-sidebar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
    }
    @media (max-width: 900px) {
      .machinery-ad-card {
        grid-template-columns: 1fr;
      }
      .ad-media-panel {
        border-right: none;
        border-bottom: 1px solid #f1f5f9;
        flex-direction: row;
        align-items: center;
      }
      .primary-image-viewport {
        width: 150px;
        height: 100px;
      }
      .media-thumbnails-strip {
        display: none;
      }
      .ad-details-panel {
        border-right: none;
        border-bottom: 1px solid #f1f5f9;
      }
      .ad-pricing-panel {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
      .action-buttons-group {
        width: 250px;
      }
    }
    @media (max-width: 600px) {
      .domain-marketplace-page {
        padding: 6.5rem 1rem 3rem;
      }
      .filter-sidebar {
        grid-template-columns: 1fr;
      }
      .ad-media-panel {
        flex-direction: column;
        align-items: stretch;
      }
      .primary-image-viewport {
        width: 100%;
        height: 140px;
      }
      .ad-pricing-panel {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .action-buttons-group {
        width: 100%;
      }
    }
  `]
})
export class DomainMarketplaceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  domainCode = '';
  domainDesignation = '';
  domainDesignationFr = '';
  parentDesignationFr = 'Espace Commercial';
  isDomainFavorited = false;

  // Database loading states
  loading = true;
  domains: any[] = [];
  dbTaxonomies: any[] = [];

  // Sidebar filters states
  taxonomies: TaxonomyItem[] = [];
  filteredTaxonomies: TaxonomyItem[] = [];
  taxonomyQuery = '';
  showAllTaxonomies = false;

  brands: BrandItem[] = [];
  filteredBrands: BrandItem[] = [];
  brandQuery = '';

  locations: LocationItem[] = [
    { name: 'Casablanca-Settat', checked: false },
    { name: 'Tanger-Tétouan-Al Hoceïma', checked: false },
    { name: 'Rabat-Salé-Kénitra', checked: false },
    { name: 'Marrakech-Safi', checked: false },
    { name: 'Souss-Massa', checked: false },
    { name: 'L\'Oriental', checked: false }
  ];

  // Listings data
  listings: MockListing[] = [];
  filteredListings: MockListing[] = [];
  activeSort = 'recent';
  favoritedListings = new Set<string>();

  // Full lookup data reflecting homepage structure (48 categories mapping to their parents)
  private readonly categoriesDataMap: Record<string, { parentFr: string; parentEn: string; nameFr: string; nameEn: string; code: string; defaultAdsCount: string; dbDomainId?: string }> = {
    // Poids lourds & Autobus
    'trucks': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Camions', nameEn: 'Trucks', code: 'trucks', defaultAdsCount: '29,588', dbDomainId: 'd3a469af77a2399d69b779d5' },
    'truck-tractors': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Tracteurs routiers', nameEn: 'Truck tractors', code: 'truck-tractors', defaultAdsCount: '20,151', dbDomainId: 'fd91b7bc0069f40cf1adbb4f' },
    'commercial-vehicles': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Utilitaires', nameEn: 'Commercial vehicles', code: 'commercial-vehicles', defaultAdsCount: '4,708', dbDomainId: 'bd9e19005ca4c937a3fb1f4a' },
    'vans': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Fourgonnettes', nameEn: 'Vans', code: 'vans', defaultAdsCount: '8,245' },
    'semi-trailers': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Semi-remorques', nameEn: 'Semi-trailers', code: 'semi-trailers', defaultAdsCount: '15,819' },
    'trailers': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Remorques', nameEn: 'Trailers', code: 'trailers', defaultAdsCount: '8,591', dbDomainId: '250dac0ab7103ca09a3de55f' },
    'tank-transports': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Citernes', nameEn: 'Tank transports', code: 'tank-transports', defaultAdsCount: '3,498', dbDomainId: '569d56a5043d19bca57f8db8' },
    'buses': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Autobus / Autocars', nameEn: 'Buses', code: 'buses', defaultAdsCount: '6,187', dbDomainId: '43144269a0ca9179fc78ab00' },
    'municipal-vehicles': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Véhicules de voirie', nameEn: 'Municipal vehicles', code: 'municipal-vehicles', defaultAdsCount: '6,428', dbDomainId: 'c3ea28cd2634d0ddc0701c16' },
    'airport-equipment': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Équipement aéroportuaire', nameEn: 'Airport equipment', code: 'airport-equipment', defaultAdsCount: '142', dbDomainId: '46ad4c1e75c9d9d3afc013df' },
    'railway-equipment': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Matériel ferroviaire', nameEn: 'Railway equipment', code: 'railway-equipment', defaultAdsCount: '99', dbDomainId: '06b6871d02854b07b47d833d' },
    'containers': { parentFr: 'Poids lourds & Autobus', parentEn: 'Trucks, buses', nameFr: 'Conteneurs', nameEn: 'Containers', code: 'containers', defaultAdsCount: '732', dbDomainId: '23b9e10370ebfc9b5006b957' },

    // Voitures & Motos
    'cars': { parentFr: 'Voitures & Motos', parentEn: 'Cars, motorhomes and motorcycles', nameFr: 'Voitures', nameEn: 'Cars', code: 'cars', defaultAdsCount: '12,557', dbDomainId: '545e96ae18f1dedfc258923d' },
    'campers': { parentFr: 'Voitures & Motos', parentEn: 'Cars, motorhomes and motorcycles', nameFr: 'Camping-cars', nameEn: 'Campers', code: 'campers', defaultAdsCount: '1,279', dbDomainId: '2b8015bd253217d086899365' },
    'motorcycles': { parentFr: 'Voitures & Motos', parentEn: 'Cars, motorhomes and motorcycles', nameFr: 'Motos', nameEn: 'Motorcycles', code: 'motorcycles', defaultAdsCount: '810', dbDomainId: '5f75591426a93df389a6ba45' },
    'water-transport': { parentFr: 'Voitures & Motos', parentEn: 'Cars, motorhomes and motorcycles', nameFr: 'Bateaux', nameEn: 'Water transport', code: 'water-transport', defaultAdsCount: '182', dbDomainId: '5fff5ce09cda01210d1a1935' },
    'air-transport': { parentFr: 'Voitures & Motos', parentEn: 'Cars, motorhomes and motorcycles', nameFr: 'Aéronefs', nameEn: 'Air transport', code: 'air-transport', defaultAdsCount: '2', dbDomainId: '13359332cf985ae19d341e08' },

    // Matériel de construction
    'excavators': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Pelles / Excavatrices', nameEn: 'Excavators', code: 'excavators', defaultAdsCount: '33,266', dbDomainId: 'feb6e3eeeb24446f956a51b5' },
    'cranes': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Grues', nameEn: 'Cranes', code: 'cranes', defaultAdsCount: '6,839', dbDomainId: '13e24dcafcd1479080eedc30' },
    'concrete-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Matériel de béton', nameEn: 'Concrete equipment', code: 'concrete-equipment', defaultAdsCount: '3,809' },
    'surface-finishing-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Traitement de surface', nameEn: 'Surface finishing equipment', code: 'surface-finishing-equipment', defaultAdsCount: '246' },
    'building-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Équipement de bâtiment', nameEn: 'Building equipment', code: 'building-equipment', defaultAdsCount: '758', dbDomainId: 'af67e8eb26ec9fdce01543b5' },
    'drilling-machinery': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Foreuses', nameEn: 'Drilling machinery', code: 'drilling-machinery', defaultAdsCount: '3,258' },
    'road-construction-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Matériel routier', nameEn: 'Road construction equipment', code: 'road-construction-equipment', defaultAdsCount: '3,187', dbDomainId: '07e6b4b1feb846cfba10b862' },
    'construction-rollers': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Compacteurs', nameEn: 'Construction rollers', code: 'construction-rollers', defaultAdsCount: '3,579' },
    'earthmoving-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Engins de terrassement', nameEn: 'Earthmoving equipment', code: 'earthmoving-equipment', defaultAdsCount: '5,650' },
    'aerial-platforms': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Nacelles élévatrices', nameEn: 'Aerial platforms', code: 'aerial-platforms', defaultAdsCount: '8,078' },
    'modular-containers': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Bâtiments modulaires', nameEn: 'Modular containers', code: 'modular-containers', defaultAdsCount: '723' },
    'construction-loaders': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Chargeuses', nameEn: 'Construction loaders', code: 'construction-loaders', defaultAdsCount: '10,034' },
    'other-construction-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Autre matériel BTP', nameEn: 'Other construction equipment', code: 'other-construction-equipment', defaultAdsCount: '156' },
    'construction-equipment-repairs': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Réparation', nameEn: 'Construction equipment repairs', code: 'construction-equipment-repairs', defaultAdsCount: '1,402' },
    'construction-equipment-parts': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Pièces détachées BTP', nameEn: 'Construction equipment parts', code: 'construction-equipment-parts', defaultAdsCount: '113,116' },
    'attachments-for-construction-equipment': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Accessoires BTP', nameEn: 'Attachments for construction equipment', code: 'attachments-for-construction-equipment', defaultAdsCount: '12,810' },
    'special-tires': { parentFr: 'Matériel de construction', parentEn: 'Construction equipment', nameFr: 'Pneus spéciaux', nameEn: 'Special tires', code: 'special-tires', defaultAdsCount: '874' },

    // Matériel de manutention
    'forklifts': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Chariots élévateurs', nameEn: 'Forklifts', code: 'forklifts', defaultAdsCount: '20,973', dbDomainId: '1882699d1c0cfb06962f50df' },
    'warehouse-equipment': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Matériel d\'entrepôt', nameEn: 'Warehouse equipment', code: 'warehouse-equipment', defaultAdsCount: '1,157', dbDomainId: 'ebbc986dd24ff3ebfc7b13cc' },
    'cleaning-machinery': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Machines de nettoyage', nameEn: 'Cleaning machinery', code: 'cleaning-machinery', defaultAdsCount: '448' },
    'port-equipment': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Équipement portuaire', nameEn: 'Port equipment', code: 'port-equipment', defaultAdsCount: '743' },
    'warehouse-cranes': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Grues d\'atelier', nameEn: 'Warehouse cranes', code: 'warehouse-cranes', defaultAdsCount: '764' },
    'loading-dock-equipment': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Équipements de quai', nameEn: 'Loading dock equipment', code: 'loading-dock-equipment', defaultAdsCount: '187' },
    'forklift-attachments': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Accessoires chariots', nameEn: 'Forklift attachments', code: 'forklift-attachments', defaultAdsCount: '3,044' },
    'material-handling-equipment-parts': { parentFr: 'Matériel de manutention', parentEn: 'Material handling equipment', nameFr: 'Pièces manutention', nameEn: 'Material handling equipment parts', code: 'material-handling-equipment-parts', defaultAdsCount: '8,107' },

    // Équipements & Pièces
    'equipment': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Équipement BTP', nameEn: 'Equipment', code: 'equipment', defaultAdsCount: '5,317', dbDomainId: 'af67e8eb26ec9fdce01543b5' },
    'tires-and-wheels': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Pneus & Roues', nameEn: 'Tires and wheels', code: 'tires-and-wheels', defaultAdsCount: '5,880', dbDomainId: '61c9297cecbe43dfbdb896b9' },
    'spare-parts': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Pièces de rechange', nameEn: 'Spare parts', code: 'spare-parts', defaultAdsCount: '319,414', dbDomainId: '66323c2a0000000000000003' },
    'services': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Services pro', nameEn: 'Services', code: 'services', defaultAdsCount: '201', dbDomainId: '3fbf73a2044cc89f14f14c05' },
    'rent': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Location', nameEn: 'Rent', code: 'rent', defaultAdsCount: '889', dbDomainId: '32339d60c883ff7fd779ad0e' },
    'companies': { parentFr: 'Équipements & Pièces', parentEn: 'Attachments, spare parts, services', nameFr: 'Entreprises', nameEn: 'Companies', code: 'companies', defaultAdsCount: '8,528' }
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.domainCode = params.get('domainCode') || '';
      this.loadComponentData();
    });
  }

  loadComponentData() {
    this.loading = true;
    this.isDomainFavorited = false;
    
    // 1. Resolve subcategory details from static map
    const activeSub = this.categoriesDataMap[this.domainCode.toLowerCase()];
    if (activeSub) {
      this.domainDesignation = activeSub.nameEn;
      this.domainDesignationFr = activeSub.nameFr;
      this.parentDesignationFr = activeSub.parentFr;
    } else {
      // Fallback
      this.domainDesignation = this.domainCode;
      this.domainDesignationFr = this.domainCode;
      this.parentDesignationFr = 'Espace Commercial';
    }

    // 2. Fetch domains & taxonomies from ApiService
    this.api.getDomains().subscribe({
      next: (domainsData) => {
        this.domains = domainsData;
        
        this.api.getTaxonomies().subscribe({
          next: (taxonomiesData) => {
            this.dbTaxonomies = taxonomiesData;
            this.setupSidebarFilters(activeSub?.dbDomainId);
            this.generateMockListings();
            this.loading = false;
          },
          error: () => {
            this.setupSidebarFilters(activeSub?.dbDomainId);
            this.generateMockListings();
            this.loading = false;
          }
        });
      },
      error: () => {
        this.setupSidebarFilters(activeSub?.dbDomainId);
        this.generateMockListings();
        this.loading = false;
      }
    });
  }

  setupSidebarFilters(dbDomainId?: string) {
    this.taxonomies = [];
    this.brands = [];
    
    // Find dynamic taxonomies for this domain if linked in the database
    let linkedTaxIds: string[] = [];
    if (dbDomainId && this.domains.length > 0) {
      const activeDbDom = this.domains.find(d => d._id === dbDomainId);
      if (activeDbDom && activeDbDom.taxonomies) {
        linkedTaxIds = activeDbDom.taxonomies.map((t: any) => typeof t === 'string' ? t : t._id || t.$oid);
      }
    }

    // Load matching taxonomies
    if (linkedTaxIds.length > 0 && this.dbTaxonomies.length > 0) {
      linkedTaxIds.forEach(id => {
        const taxMatch = this.dbTaxonomies.find(t => t._id === id);
        if (taxMatch) {
          const transFr = taxMatch.translations?.find((tr: any) => tr.language === 'fr')?.designation || taxMatch.code;
          const transEn = taxMatch.translations?.find((tr: any) => tr.language === 'en')?.designation || taxMatch.code;
          this.taxonomies.push({
            id: taxMatch._id,
            name: transEn,
            nameFr: transFr,
            count: Math.floor(Math.random() * 200) + 120, // realistic counts
            checked: false
          });
        }
      });
    }

    // Fallback static taxonomies if database has none (or domain is a newer one)
    if (this.taxonomies.length === 0) {
      const fallbacks: Record<string, string[]> = {
        'forklifts': ['Diesel forklifts', 'Electric forklifts', 'LPG forklifts', 'Three-wheel forklifts', 'High capacity forklifts', 'Reach trucks', 'Pallet stackers'],
        'excavators': ['Crawler excavators', 'Wheel excavators', 'Mini excavators', 'Long reach excavators', 'Demolition excavators'],
        'trucks': ['Box trucks', 'Flatbed trucks', 'Tipper trucks', 'Refrigerated trucks', 'Hook lift trucks', 'Curtainside trucks'],
        'spare-parts': ['Engines', 'Gearboxes', 'Axles & final drives', 'Cabs & body parts', 'Hydraulic pumps', 'Brake systems'],
        'campers': ['Integrated motorhomes', 'Semi-integrated motorhomes', 'Alcove campers', 'Camper vans']
      };

      const items = fallbacks[this.domainCode.toLowerCase()] || ['Modèles standards', 'Options premium', 'Accessoires compatibles', 'Matériel neuf'];
      items.forEach((item, idx) => {
        this.taxonomies.push({
          id: 'mock_tax_' + idx,
          name: item,
          nameFr: item,
          count: Math.floor(Math.random() * 100) + 40,
          checked: false
        });
      });
    }

    this.filteredTaxonomies = this.taxonomies;

    // Load typical Brands depending on domain
    const typicalBrands: Record<string, string[]> = {
      'forklifts': ['Linde', 'Toyota', 'Manitou', 'Still', 'Jungheinrich', 'Caterpillar', 'Nissan', 'Komatsu'],
      'excavators': ['Caterpillar', 'Komatsu', 'JCB', 'Volvo', 'Liebherr', 'Hitachi', 'Doosan', 'Kobelco'],
      'trucks': ['Scania', 'Volvo', 'Mercedes-Benz', 'DAF', 'MAN', 'Renault Trucks', 'IVECO'],
      'truck-tractors': ['Scania', 'Volvo', 'Mercedes-Benz', 'DAF', 'MAN', 'Renault Trucks', 'IVECO'],
      'trailers': ['Schmitz Cargobull', 'Krone', 'Kogel', 'Lamberet', 'Fruehauf'],
      'cars': ['Dacia', 'Renault', 'Peugeot', 'Volkswagen', 'Toyota', 'Hyundai', 'BMW', 'Mercedes-Benz']
    };

    const brandList = typicalBrands[this.domainCode.toLowerCase()] || ['Générique', 'OEM Premium', 'Autre marque'];
    this.brands = brandList.map(b => ({ name: b, checked: false }));
    this.filteredBrands = this.brands;
  }

  generateMockListings() {
    this.listings = [];
    
    // Generate 6 tailored mock listings
    const brandPool = this.brands.map(b => b.name);
    const cities = ['Casablanca', 'Tanger Med', 'Rabat', 'Agadir Port', 'Marrakech', 'Fès'];
    
    const listingModels: Record<string, { model: string; cap: string; height: string; extras: string[] }[]> = {
      'forklifts': [
        { model: 'H30D Diesel Forklift', cap: '3,000 kg', height: '4.5 m', extras: ['Moteur: Kubota', 'Mât: Triplex', 'Positionneur: Oui'] },
        { model: 'R16HD-01 Reach Truck', cap: '1,600 kg', height: '7.0 m', extras: ['Mât: Rétractable', 'Batterie: 48V (85%)', 'Forks: 1.2 m'] },
        { model: '8FGF25 LPG Forklift', cap: '2,500 kg', height: '4.0 m', extras: ['Moteur: Toyota 4Y', 'Cabine: Demi-cabine', 'Pneus: PPS'] },
        { model: 'E20 Electric 3-Wheel', cap: '2,000 kg', height: '3.8 m', extras: ['Technologie: AC', 'Mât: Duplex', 'Batterie: Neuve 2025'] },
        { model: 'D15 High Capacity', cap: '15,000 kg', height: '6.2 m', extras: ['Usage: Lourd / Portuaire', 'Moteur: Cummins', 'Cabine: Climatisée'] },
        { model: 'L12 Pallet Stacker', cap: '1,200 kg', height: '2.9 m', extras: ['Type: Accompagnant', 'Direction: Électrique', 'Chargeur: Intégré'] }
      ],
      'excavators': [
        { model: '320D Crawler Excavator', cap: '20,000 kg', height: '6.5 m', extras: ['Godet: 1.2 m³', 'Chenilles: 600 mm', 'Lignes hydr.: Oui'] },
        { model: 'JS145 Wheel Excavator', cap: '14,500 kg', height: '5.2 m', extras: ['Lame: Stabilisatrice', 'Attache rapide: Oui', 'Climatisation: Oui'] },
        { model: 'ZX26 Mini Excavator', cap: '2,600 kg', height: '2.8 m', extras: ['Voie variable: Oui', 'Moteur: Yanmar', 'Canopy: Confort'] },
        { model: 'R924 Demolition Rig', cap: '26,000 kg', height: '12.0 m', extras: ['Mât: Démolition', 'Brise roche: Dispo', 'Lignes auxiliaires: 2'] },
        { model: 'PC200-8 Hybrid Heavy', cap: '21,000 kg', height: '6.4 m', extras: ['Usage: Terrassement', 'Moteur: Komatsu Tier 3', 'Attache: Geith'] },
        { model: 'SK210 Super Long Reach', cap: '22,000 kg', height: '15.5 m', extras: ['Flèche: Longue portée', 'Godet curage: Inclus', 'Caméra recul: Oui'] }
      ],
      'trucks': [
        { model: 'R450 Streamline (6x2)', cap: '26 T', height: 'N/A', extras: ['Essieux: 6x2', 'Boîte: Opticruise', 'Norme: Euro 6'] },
        { model: 'FH 500 Globetrotter', cap: '19 T', height: 'N/A', extras: ['Cabine: Grand Volume', 'Frein: VEB+', 'Réservoir: 850L'] },
        { model: 'Actros 1845 MP4', cap: '18 T', height: 'N/A', extras: ['Moteur: OM471', 'Freins: Retarder Voith', 'Suspension: Air'] },
        { model: 'XF 460 Space Cab', cap: '19 T', height: 'N/A', extras: ['Ralentisseur: Intarder', 'Pneus: 315/70 (80%)', 'Clim de nuit: Oui'] },
        { model: 'TGS 33.400 Tipper (6x4)', cap: '33 T', height: 'N/A', extras: ['Type: Benne MEILLER', 'Usage: Carrière BTP', 'Moyeux réducteurs: Oui'] },
        { model: 'Premium 380 dXi Box', cap: '19 T', height: 'N/A', extras: ['Caisse: Fourgon 8.5m', 'Hayon: Dhollandia 2T', 'Boîte: Manuelle'] }
      ]
    };

    const models = listingModels[this.domainCode.toLowerCase()] || [
      { model: 'Série Standard X1', cap: 'N/A', height: 'N/A', extras: ['Usage: Professionnel', 'Qualité: Certifié', 'Normes: CE'] },
      { model: 'Gamme Pro Titan', cap: 'N/A', height: 'N/A', extras: ['Usage: Industriel', 'Puissance: Élevée', 'Garantie: 12 mois'] },
      { model: 'Édition Spéciale Atlas', cap: 'N/A', height: 'N/A', extras: ['Usage: BTP / Carrière', 'Châssis: Renforcé', 'Technologie: IA Ready'] },
      { model: 'Modèle Compact Eco', cap: 'N/A', height: 'N/A', extras: ['Usage: Urbain', 'Consommation: Basse', 'Maintenance: Facile'] },
      { model: 'Série Lourd HD', cap: 'N/A', height: 'N/A', extras: ['Usage: Portuaire / Logistique', 'Capacité: Renforcée', 'Moteur: Premium'] },
      { model: 'Gamme Access Plus', cap: 'N/A', height: 'N/A', extras: ['Usage: Polyvalent', 'Accessoires: Fournis', 'Contrôle: Ergonomique'] }
    ];

    const companies = ['MAROC ELEVATION', 'ATLAS MACHINES', 'SAHARA LOGISTICS', 'SOCIETE DU FREt CHERIFIEN', 'SUD TRUCKS MA', 'OMNI-SERVICES LOGISTIQUES'];

    models.forEach((mod, idx) => {
      const brand = brandPool[idx % brandPool.length] || 'Générique';
      const city = cities[idx % cities.length];
      const years = [2014, 2015, 2016, 2017, 2018, 2019];
      const hours = [3660, 4820, 2900, 6120, 850, 10200];
      const prices = ['145 000 DH', '98 000 DH', 'Sur demande', '185 000 DH', '240 000 DH', '65 000 DH'];

      // Assign matching taxonomyId from our sidebar categories
      const taxMatch = this.taxonomies[idx % this.taxonomies.length];

      this.listings.push({
        id: 'list_ad_' + idx,
        title: `${brand} ${mod.model}`,
        brand: brand,
        type: `${this.domainDesignation} — ${taxMatch ? taxMatch.name : 'Standard'}`,
        year: years[idx],
        hoursOrMileage: this.domainCode.toLowerCase().includes('truck') ? `${hours[idx] * 40} km` : `${hours[idx]} h`,
        loadCap: mod.cap,
        liftingHeight: mod.height,
        additionalSpecs: mod.extras,
        price: prices[idx],
        location: city,
        imagesCount: Math.floor(Math.random() * 8) + 4,
        activeImageIndex: 0,
        sellerName: companies[idx % companies.length],
        sellerBadge: 'Vendeur Pro',
        sellerExperience: `${idx + 2} ans`,
        gradientSeed: idx,
        taxonomyId: taxMatch ? taxMatch.id : undefined
      });
    });

    this.applyFilters();
  }

  getGradient(list: MockListing, viewIndex: number): string {
    const gradients = [
      ['#1e3a8a', '#3b82f6'], // deep blue
      ['#ff5a00', '#ff922b'], // orange
      ['#0f172a', '#334155'], // dark slate
      ['#115e59', '#14b8a6'], // teal
      ['#15803d', '#22c55e'], // green
      ['#6b21a8', '#a855f7']  // purple
    ];
    
    // Scramble by seed and active thumbnail index
    const pairIdx = (list.gradientSeed + viewIndex) % gradients.length;
    const pair = gradients[pairIdx];
    return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
  }

  getCategoryEmoji(type: string): string {
    const lType = type.toLowerCase();
    if (lType.includes('forklift') || lType.includes('chariot') || lType.includes('manutention')) return '🚜';
    if (lType.includes('excavator') || lType.includes('pelle') || lType.includes('btp')) return '🏗️';
    if (lType.includes('truck') || lType.includes('camion')) return '🚛';
    if (lType.includes('car') || lType.includes('voiture')) return '🚗';
    if (lType.includes('moto')) return '🏍️';
    if (lType.includes('boat') || lType.includes('maritime')) return '🚢';
    return '⚙️';
  }

  onSortChange(event: Event) {
    this.activeSort = (event.target as HTMLSelectElement).value;
    this.sortListings();
  }

  sortListings() {
    if (this.activeSort === 'price_asc') {
      this.filteredListings.sort((a, b) => {
        const pa = parseInt(a.price.replace(/[^0-9]/g, '')) || 99999999;
        const pb = parseInt(b.price.replace(/[^0-9]/g, '')) || 99999999;
        return pa - pb;
      });
    } else if (this.activeSort === 'price_desc') {
      this.filteredListings.sort((a, b) => {
        const pa = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
        const pb = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
        return pb - pa;
      });
    } else if (this.activeSort === 'year_desc') {
      this.filteredListings.sort((a, b) => b.year - a.year);
    } else {
      // Default: recent (by seed index)
      this.filteredListings.sort((a, b) => a.id.localeCompare(b.id));
    }
  }

  // Real-time Sidebar Filtering Implementation
  onTaxonomyToggle(id: string) {
    const tax = this.taxonomies.find(t => t.id === id);
    if (tax) {
      tax.checked = !tax.checked;
      this.applyFilters();
    }
  }

  onBrandToggle(name: string) {
    const brand = this.brands.find(b => b.name === name);
    if (brand) {
      brand.checked = !brand.checked;
      this.applyFilters();
    }
  }

  onLocationToggle(name: string) {
    const loc = this.locations.find(l => l.name === name);
    if (loc) {
      loc.checked = !loc.checked;
      this.applyFilters();
    }
  }

  applyFilters() {
    const selectedTaxIds = this.taxonomies.filter(t => t.checked).map(t => t.id);
    const selectedBrands = this.brands.filter(b => b.checked).map(b => b.name);
    const selectedLocations = this.locations.filter(l => l.checked).map(l => l.name);

    this.filteredListings = this.listings.filter(list => {
      // 1. Category Filter
      if (selectedTaxIds.length > 0) {
        if (!list.taxonomyId || !selectedTaxIds.includes(list.taxonomyId)) {
          return false;
        }
      }
      
      // 2. Brand Filter
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(list.brand)) {
          return false;
        }
      }

      // 3. Location Filter
      if (selectedLocations.length > 0) {
        if (!selectedLocations.includes(list.location)) {
          return false;
        }
      }

      return true;
    });

    this.sortListings();
  }

  // Sidebar text searches
  filterTaxonomies() {
    const query = this.taxonomyQuery.toLowerCase().trim();
    if (!query) {
      this.filteredTaxonomies = this.showAllTaxonomies ? this.taxonomies : this.taxonomies.slice(0, 5);
    } else {
      this.filteredTaxonomies = this.taxonomies.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.nameFr.toLowerCase().includes(query)
      );
    }
  }

  toggleShowAllTaxonomies() {
    this.showAllTaxonomies = !this.showAllTaxonomies;
    this.filterTaxonomies();
  }

  filterBrands() {
    const query = this.brandQuery.toLowerCase().trim();
    if (!query) {
      this.filteredBrands = this.brands;
    } else {
      this.filteredBrands = this.brands.filter(b => b.name.toLowerCase().includes(query));
    }
  }

  resetAllFilters() {
    this.taxonomies.forEach(t => t.checked = false);
    this.brands.forEach(b => b.checked = false);
    this.locations.forEach(l => l.checked = false);
    this.taxonomyQuery = '';
    this.brandQuery = '';
    
    this.filterTaxonomies();
    this.filterBrands();
    this.applyFilters();
  }

  // Page Actions
  toggleDomainFavorite() {
    this.isDomainFavorited = !this.isDomainFavorited;
    alert(this.isDomainFavorited 
      ? `Le domaine "${this.domainDesignationFr}" a été ajouté à vos favoris OMNILOGIX.`
      : `Le domaine "${this.domainDesignationFr}" a été retiré de vos favoris.`);
  }

  subscribeToAlerts() {
    alert(`Abonnement activé ! Vous recevrez des alertes par email dès qu'une nouvelle annonce de "${this.domainDesignationFr}" sera publiée.`);
  }

  toggleListingFavorite(list: MockListing) {
    if (this.favoritedListings.has(list.id)) {
      this.favoritedListings.delete(list.id);
    } else {
      this.favoritedListings.add(list.id);
    }
  }

  isListingFavorited(id: string): boolean {
    return this.favoritedListings.has(id);
  }

  compareListing(list: MockListing) {
    alert(`Annonce "${list.title}" ajoutée au module de comparaison.`);
  }

  contactSeller(list: MockListing) {
    alert(`Formulaire de contact rapide ouvert pour ${list.sellerName} concernant l'annonce "${list.title}".`);
  }

  consultListing(list: MockListing) {
    this.router.navigate(['/marketplace'], { queryParams: { search: list.title } });
  }
}
