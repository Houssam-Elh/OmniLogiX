import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface SubCategory {
  name: string;
  nameFr: string;
  count: string;
  iconPath: string;
}

interface CategoryTab {
  id: string;
  title: string;
  titleFr: string;
  count: string;
  subcategories: SubCategory[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `


    <!-- MAIN BODY PORTAL -->
    <main class="autoline-main">
      
      <!-- MAIN BODY HEADER (IMAGE 2 style) -->
      <div class="homepage-main-header">
        <h1 class="main-heading">Rechercher des camions, bus et pièces de rechange</h1>
        <div class="main-stats-group">
          <span class="stats-count-badge">448 936 annonces</span>
          <a class="btn-place-ad-header" [routerLink]="['/contact']">+ Placer une annonce</a>
        </div>
      </div>

      <!-- DOMAINS QUICK NAVIGATION BAR (IMAGE 3 style) -->
      <div class="domains-nav-section">
        <div class="domains-nav-container">
          <button class="domain-nav-link" (click)="scrollToSection('section-trucks-buses')">
            Poids lourds & Autobus
          </button>
          <button class="domain-nav-link" (click)="scrollToSection('section-cars-motorcycles')">
            Voitures & Motos
          </button>
          <button class="domain-nav-link" (click)="scrollToSection('section-construction-equipment')">
            Matériel de construction
          </button>
          <button class="domain-nav-link" (click)="scrollToSection('section-material-handling')">
            Matériel de manutention
          </button>
          <button class="domain-nav-link" (click)="scrollToSection('section-equipment-btp')">
            Équipements & Pièces
          </button>
          <button class="domain-nav-link" (click)="scrollToSection('section-spare-parts-search')">
            Recherche Pièces
          </button>
        </div>
      </div>

      <!-- FLAT WHITE CONTAINER BLOCK -->
      <div class="content-container">

        <!-- SECTION 1: TRUCKS & BUSES (IMAGE 4 STYLE) -->
        <div id="section-trucks-buses" class="domain-section">
          <div class="domain-section-header">
            <h2 class="domain-section-title">Poids lourds & Autobus</h2>
          </div>

          <div class="directory-flat-grid">
            @for (sub of getSubcategories('trucks_buses'); track sub.name) {
              <a class="flat-category-card" [routerLink]="['/-', slugify(sub.name)]">
                <span class="card-count-top">{{ sub.count }}</span>
                <div class="card-icon-container">
                  @if (hasSvgIcon(sub.name)) {
                    <img [src]="getSvgIconPath(sub.name)" class="line-icon-flat" [alt]="sub.nameFr">
                  } @else {
                    <div class="card-icon-placeholder-box">
                      <span class="placeholder-icon-symbol">🚛</span>
                    </div>
                  }
                </div>
                <span class="category-name">{{ sub.nameFr }}</span>
              </a>
            }

            <!-- Box 1: ads database count -->
            <div class="ads-db-box">
              <span class="db-box-label">Le nombre d'annonces dans notre base :</span>
              <span class="db-box-count-badge">448 936</span>
              <a class="db-box-link" [routerLink]="['/contact']">Placer votre annonce</a>
            </div>

            <!-- Box 2: selling banner -->
            <div class="selling-banner-autoline">
              <div class="selling-banner-left">
                <div class="selling-camera-circle">
                  <i class="fas fa-camera"></i>
                </div>
                <div class="selling-banner-text">
                  <h3>Vendre des machines ou des véhicules ?</h3>
                  <p>Vous pouvez le faire avec nous !</p>
                </div>
              </div>
              <button class="btn-selling-banner" [routerLink]="['/contact']">
                Placer une annonce
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 2: CARS & MOTORCYCLES (IMAGE 5 STYLE) -->
        <div id="section-cars-motorcycles" class="domain-section">
          <div class="domain-section-header">
            <h2 class="domain-section-title">Voitures & Motos</h2>
          </div>

          <div class="directory-flat-grid">
            @for (sub of getSubcategories('cars_motorhomes_motorcycles'); track sub.name) {
              <a class="flat-category-card" [routerLink]="['/-', slugify(sub.name)]">
                <span class="card-count-top">{{ sub.count }}</span>
                <div class="card-icon-container">
                  @if (hasSvgIcon(sub.name)) {
                    <img [src]="getSvgIconPath(sub.name)" class="line-icon-flat" [alt]="sub.nameFr">
                  } @else {
                    <div class="card-icon-placeholder-box">
                      <span class="placeholder-icon-symbol">🚗</span>
                    </div>
                  }
                </div>
                <span class="category-name">{{ sub.nameFr }}</span>
              </a>
            }
          </div>
        </div>

        <!-- SECTION 4: CONSTRUCTION EQUIPMENT (NEW SECTION) -->
        <div id="section-construction-equipment" class="domain-section">
          <div class="domain-section-header">
            <h2 class="domain-section-title">Matériel de construction</h2>
          </div>

          <div class="directory-flat-grid">
            @for (sub of getSubcategories('construction_equipment'); track sub.name) {
              <a class="flat-category-card" [routerLink]="['/-', slugify(sub.name)]">
                <span class="card-count-top">{{ sub.count }}</span>
                <div class="card-icon-container">
                  @if (hasSvgIcon(sub.name)) {
                    <img [src]="getSvgIconPath(sub.name)" class="line-icon-flat" [alt]="sub.nameFr">
                  } @else {
                    <div class="card-icon-placeholder-box">
                      <span class="placeholder-icon-symbol">🏗️</span>
                    </div>
                  }
                </div>
                <span class="category-name">{{ sub.nameFr }}</span>
              </a>
            }
          </div>
        </div>

        <!-- SECTION 5: MATERIAL HANDLING EQUIPMENT (NEW SECTION) -->
        <div id="section-material-handling" class="domain-section">
          <div class="domain-section-header">
            <h2 class="domain-section-title">Matériel de manutention</h2>
          </div>

          <div class="directory-flat-grid">
            @for (sub of getSubcategories('material_handling_equipment'); track sub.name) {
              <a class="flat-category-card" [routerLink]="['/-', slugify(sub.name)]">
                <span class="card-count-top">{{ sub.count }}</span>
                <div class="card-icon-container">
                  @if (hasSvgIcon(sub.name)) {
                    <img [src]="getSvgIconPath(sub.name)" class="line-icon-flat" [alt]="sub.nameFr">
                  } @else {
                    <div class="card-icon-placeholder-box">
                      <span class="placeholder-icon-symbol">⚙️</span>
                    </div>
                  }
                </div>
                <span class="category-name">{{ sub.nameFr }}</span>
              </a>
            }
          </div>
        </div>

        <!-- SECTION 3: ATTACHMENTS, SPARE PARTS, SERVICES (IMAGE 5 BOTTOM STYLE) -->
        <div id="section-equipment-btp" class="domain-section">
          <div class="domain-section-header">
            <h2 class="domain-section-title">Équipements & Pièces</h2>
          </div>

          <div class="directory-flat-grid">
            @for (sub of getSubcategories('attachments_spare_parts_services'); track sub.name) {
              <a 
                [id]="getCategoryElementId(sub.name)"
                class="flat-category-card" 
                [routerLink]="['/-', slugify(sub.name)]">
                <span class="card-count-top">{{ sub.count }}</span>
                <div class="card-icon-container">
                  @if (hasSvgIcon(sub.name)) {
                    <img [src]="getSvgIconPath(sub.name)" class="line-icon-flat" [alt]="sub.nameFr">
                  } @else {
                    <div class="card-icon-placeholder-box">
                      <span class="placeholder-icon-symbol">⚙️</span>
                    </div>
                  }
                </div>
                <span class="category-name">{{ sub.nameFr }}</span>
              </a>
            }
          </div>
        </div>

        <!-- SPECIAL SPARE PARTS SEARCH + BRAND GRID -->
        <div id="section-spare-parts-search" class="flat-spare-parts-section">
          <div class="spare-header">
            <div class="spare-title-group">
              <div class="gears-icon-wrapper">
                <i class="fas fa-gears gears-icon"></i>
              </div>
              <div>
                <h3>Recherche Spécifique de Pièces de Rechange</h3>
                <p>Parcourez plus de 319 000 pièces industrielles indexées</p>
              </div>
            </div>
            <span class="spare-count-badge">319 414 pièces en stock</span>
          </div>

          <div class="spare-search-bar-flat">
            <div class="spare-input-wrapper">
              <i class="fas fa-search spare-search-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="spareSearchQuery" 
                placeholder="Référence de pièce, marque, modèle ou nom (Ex: DAF Engine, Scania Cabin...)" 
                (keyup.enter)="triggerSpareSearch()"
                class="spare-search-input-flat">
            </div>
            <button class="btn-spare-search-flat" (click)="triggerSpareSearch()">Rechercher</button>
            <button class="btn-spare-order-flat" (click)="triggerSpareSearch()">Commander une pièce</button>
          </div>

          <div class="spare-examples-flat">
            Recherches populaires : 
            <span class="example-tag" (click)="setSpareQuery('DAF Engine')">DAF Engine</span>
            <span class="example-tag" (click)="setSpareQuery('Scania R410')">Scania R410</span>
            <span class="example-tag" (click)="setSpareQuery('Volvo Gearbox')">Volvo Gearbox</span>
            <span class="example-tag" (click)="setSpareQuery('ZF Retarder')">ZF Retarder</span>
          </div>

          <h4 class="brand-grid-title">Marques de pièces détachées populaires :</h4>
          <div class="spare-brand-grid-flat">
            @for (brand of popularSparePartsBrands; track brand.name) {
              <div class="spare-brand-card-flat" (click)="setSpareQuery(brand.name)">
                <span class="brand-name-flat">{{ brand.name }}</span>
                <span class="brand-count-flat">{{ brand.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- FEATURED ADS SECTION -->
        <div class="flat-featured-section">
          <div class="featured-header-flat">
            <h3>Annonces Vedettes Premium</h3>
            <button class="btn-view-all-flat" [routerLink]="['/marketplace']">
              Voir tout le catalogue <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          <div class="featured-grid-flat">
            @for (item of getFeaturedListings(); track item.id) {
              <div class="flat-listing-card">
                <div class="listing-img-box">
                  <span class="listing-emoji-box">{{ getVehicleEmoji(item.type) }}</span>
                  <div class="listing-badge-price">{{ item.price }}</div>
                  <div class="listing-vip-tag"><i class="fas fa-crown"></i> Vedette</div>
                </div>
                
                <div class="listing-content-box">
                  <h4 class="listing-title-text">{{ item.title }}</h4>
                  <p class="listing-location-text">
                    <i class="fas fa-map-marker-alt"></i> {{ item.location }} — Maroc
                  </p>

                  <div class="listing-specs-flat">
                    <span class="spec-chip">📅 {{ item.year }}</span>
                    <span class="spec-chip">🛣️ {{ item.mileage }}</span>
                    <span class="spec-chip">⚡ {{ item.power }}</span>
                    <span class="spec-chip">⚙️ {{ item.axle }}</span>
                  </div>

                  <div class="listing-footer-flat">
                    <span class="flat-verified"><i class="fas fa-check-circle"></i> Annonce Vérifiée</span>
                    <button class="btn-consult-flat" [routerLink]="['/marketplace']" [queryParams]="{ id: item.id }">
                      Consulter <i class="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- DOUBLE CTA CARDS -->
        <div class="double-cta-grid">
          <div class="cta-flat-card cta-blue-flat">
            <div class="cta-icon-flat">🚛</div>
            <div class="cta-content-flat">
              <h4>Estimer la valeur de mon véhicule industriel</h4>
              <p>Obtenez gratuitement une estimation professionnelle en ligne de la valeur de vos camions et semi-remorques au Maroc.</p>
              <button class="btn-cta-flat-white" [routerLink]="['/contact']">Estimer mon camion</button>
            </div>
          </div>
          
          <div class="cta-flat-card cta-orange-flat">
            <div class="cta-icon-flat">🤖</div>
            <div class="cta-content-flat">
              <h4>Assistant Intelligent RAG OMNILOGIX</h4>
              <p>Notre chatbot IA vous conseille en temps réel sur la réglementation des transports au Maroc, le malus écologique et le sourcing de pièces.</p>
              <button class="btn-cta-flat-white" [routerLink]="['/marketplace']">Essayer l'assistant IA</button>
            </div>
          </div>
        </div>

      </div>
    </main>
  `,
  styles: [`
    /* ===== PREMIUM HIGH-DENSITY FLAT DESIGN SYSTEM ===== */
    :host {
      --color-primary: #0d52b9;   /* Official Autoline dark blue */
      --color-accent: #ff5a00;    /* Autoline signature orange */
      --color-green: #22c55e;     /* Positive active green */
      --color-border: #e1e6eb;    /* Clean bordered divider style */
      --color-bg-light: #f5f6f9;  /* Standard flat light grey body */
      --color-text-dark: #2c3e50;
      --color-text-muted: #7f8c8d;
      
      display: block;
      font-family: 'Inter', 'Outfit', sans-serif;
      background-color: var(--color-bg-light);
      color: var(--color-text-dark);
      min-height: 100vh;
    }

    /* ===== MAIN CONTAINER ===== */
    .autoline-main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 7.5rem 2rem 5rem;
    }

    /* ===== HOMEPAGE MAIN HEADER (IMAGE 2 style) ===== */
    .homepage-main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .main-heading {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-text-dark);
      margin: 0;
      letter-spacing: -0.5px;
    }
    .main-stats-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stats-count-badge {
      background-color: #f1f2f6;
      color: var(--color-text-dark);
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }
    .btn-place-ad-header {
      color: var(--color-primary);
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .btn-place-ad-header:hover {
      color: #0b439c;
      text-decoration: underline;
    }

    /* QUICK NAVIGATION MENU BAR (IMAGE 3 style) */
    .domains-nav-section {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 0.8rem 1.5rem;
      margin-bottom: 2.5rem;
    }
    .domains-nav-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: space-between;
      align-items: center;
    }
    .domain-nav-link {
      background: transparent;
      border: none;
      color: var(--color-text-dark);
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .domain-nav-link:hover {
      color: var(--color-primary);
      background-color: #f8fafc;
    }

    /* FLAT INNER BOX CONTAINER */
    .content-container {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      padding: 2.5rem;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.01);
    }

    /* DOMAIN DIRECTORY SECTIONS */
    .domain-section {
      margin-bottom: 3.5rem;
    }
    .domain-section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 0.6rem;
      margin-bottom: 1.2rem;
    }
    .domain-section-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--color-text-dark);
      margin: 0;
    }
    .domain-section-count {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    /* HIGH DENSITY CATEGORY GRID (IMAGE 4 & 5 STYLE) - SEPARATED CARDS */
    .directory-flat-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 2rem;
    }

    .card-icon-placeholder-box {
      width: 90px;
      height: 75px;
      background-color: #fafbfc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .flat-category-card:hover .card-icon-placeholder-box {
      background-color: #eff6ff;
      border-color: var(--color-primary);
    }
    .placeholder-icon-symbol {
      font-size: 2rem;
      opacity: 0.7;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .flat-category-card:hover .placeholder-icon-symbol {
      transform: scale(1.1);
      opacity: 1;
    }
    .db-box-count-badge.orange-badge {
      background-color: var(--color-accent);
    }
    @media (max-width: 1200px) {
      .directory-flat-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    @media (max-width: 768px) {
      .directory-flat-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .flat-category-card {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 1.2rem 0.8rem 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      text-decoration: none;
      position: relative;
      min-height: 120px;
      height: 145px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
    }
    .flat-category-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(13, 82, 185, 0.08);
      transform: translateY(-2px);
      z-index: 10;
    }
    .card-count-top {
      position: absolute;
      top: 0.5rem;
      right: 0.6rem;
      font-size: 0.75rem;
      color: #888888;
      font-weight: 600;
    }
    .card-icon-container {
      width: 100%;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.2rem;
    }
    .line-icon-flat {
      width: 90px;
      height: 75px;
      object-fit: contain;
      display: block;
      transition: transform 0.2s ease;
    }
    .flat-category-card:hover .line-icon-flat {
      transform: scale(1.08);
    }
    .category-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: #484848;
      margin-top: auto;
      margin-bottom: 0.6rem;
      line-height: 1.15;
    }
    .flat-category-card:hover .category-name {
      color: var(--color-primary);
      text-decoration: underline;
    }

    /* SECTION 1 BOTTOM BANNERS & DATABASE COUNT */
    .ads-db-box {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 1.2rem 0.8rem 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 120px;
      height: 145px;
    }
    .db-box-label {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-bottom: 0.4rem;
      font-weight: 600;
    }
    .db-box-count-badge {
      background-color: var(--color-green);
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 800;
      padding: 0.2rem 0.8rem;
      border-radius: 4px;
      margin-bottom: 0.4rem;
      display: inline-block;
    }
    .db-box-link {
      font-size: 0.8rem;
      color: var(--color-primary);
      font-weight: 700;
      text-decoration: underline;
    }
    .db-box-link:hover {
      color: #0b439c;
    }
    .selling-banner-autoline {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 1.2rem 1.8rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      grid-column: span 2;
      height: 145px;
    }
    .selling-banner-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .selling-camera-circle {
      color: #2c3e50;
      font-size: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .selling-banner-text h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #2c3e50;
      margin: 0 0 0.2rem 0;
    }
    .selling-banner-text p {
      font-size: 0.82rem;
      color: var(--color-text-muted);
      margin: 0;
    }
    .btn-selling-banner {
      background-color: #22c55e;
      color: #ffffff;
      border: none;
      padding: 0.7rem 1.4rem;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }
    .btn-selling-banner:hover {
      background-color: #16a34a;
    }
    @media (max-width: 768px) {
      .selling-banner-autoline {
        grid-column: span 2;
        flex-direction: column;
        text-align: center;
        align-items: center;
        padding: 1.5rem;
        gap: 1.2rem;
        height: auto;
      }
      .flat-category-card, .ads-db-box {
        height: auto;
      }
      .selling-banner-left {
        flex-direction: column;
        gap: 0.8rem;
      }
    }

    /* INTEGRATED UNIVERSAL SEARCH PANEL */
    .flat-search-panel {
      background-color: #fafbfc;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .search-panel-title {
      font-size: 1.1rem;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 1.2rem;
      color: var(--color-text-dark);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search-grid-flat {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      align-items: flex-end;
    }
    .search-col-flat {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .search-col-flat label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-dark);
    }
    .flat-select, .flat-input {
      width: 100%;
      padding: 0.7rem 0.8rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background-color: #ffffff;
      color: var(--color-text-dark);
      font-size: 0.9rem;
      outline: none;
    }
    .flat-select:focus, .flat-input:focus {
      border-color: var(--color-primary);
    }
    .price-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .price-input-container .flat-input {
      padding-right: 3rem;
    }
    .flat-currency {
      position: absolute;
      right: 0.8rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-muted);
    }
    .btn-flat-search {
      width: 100%;
      background-color: var(--color-primary);
      color: #ffffff;
      border: none;
      padding: 0.75rem 1rem;
      font-weight: 700;
      font-size: 0.9rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-flat-search:hover {
      background-color: #0b439c;
    }
    .invisible-label {
      visibility: hidden;
    }

    /* FLAT SPARE PARTS SEARCH SECTION */
    .flat-spare-parts-section {
      background-color: #f1f5fa;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 2rem;
      margin-bottom: 2.5rem;
    }
    .spare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .spare-title-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .gears-icon-wrapper {
      background-color: var(--color-primary);
      color: #ffffff;
      width: 45px;
      height: 45px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .spare-title-group h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 0.1rem 0;
      color: var(--color-text-dark);
    }
    .spare-title-group p {
      font-size: 0.85rem;
      margin: 0;
      color: var(--color-text-muted);
    }
    .spare-count-badge {
      background-color: var(--color-primary);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
    }
    .spare-search-bar-flat {
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
      margin-bottom: 0.8rem;
    }
    .spare-input-wrapper {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .spare-search-icon {
      position: absolute;
      left: 1rem;
      color: var(--color-text-muted);
    }
    .spare-search-input-flat {
      width: 100%;
      padding: 0.8rem 1rem 0.8rem 2.5rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 0.95rem;
      outline: none;
    }
    .btn-spare-search-flat {
      background-color: var(--color-primary);
      color: #ffffff;
      border: none;
      padding: 0.8rem 1.8rem;
      font-weight: 700;
      font-size: 0.92rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-spare-search-flat:hover {
      background-color: #0b439c;
    }
    .btn-spare-order-flat {
      background-color: #ffffff;
      color: var(--color-primary);
      border: 1.5px solid var(--color-primary);
      padding: 0.8rem 1.8rem;
      font-weight: 700;
      font-size: 0.92rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-spare-order-flat:hover {
      background-color: rgba(13, 82, 185, 0.05);
    }
    .spare-examples-flat {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-bottom: 1.5rem;
    }
    .example-tag {
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      margin-left: 0.4rem;
    }
    .brand-grid-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-text-dark);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .spare-brand-grid-flat {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.8rem;
    }
    .spare-brand-card-flat {
      background-color: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 0.8rem 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.1s ease;
    }
    .spare-brand-card-flat:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
    }
    .brand-name-flat {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--color-text-dark);
    }
    .brand-count-flat {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-green);
    }

    /* FLAT FEATURED SECTION */
    .flat-featured-section {
      margin-bottom: 2.5rem;
    }
    .featured-header-flat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .featured-header-flat h3 {
      font-size: 1.3rem;
      font-weight: 800;
      margin: 0;
      color: var(--color-text-dark);
    }
    .btn-view-all-flat {
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-view-all-flat:hover {
      color: #0b439c;
      text-decoration: underline;
    }
    .featured-grid-flat {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .flat-listing-card {
      background: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .flat-listing-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0,0,0,0.03);
    }
    .listing-img-box {
      height: 160px;
      background-color: #f1f2f6;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .listing-emoji-box {
      font-size: 3.5rem;
    }
    .listing-badge-price {
      position: absolute;
      bottom: 0.8rem;
      left: 0.8rem;
      background-color: var(--color-primary);
      color: #ffffff;
      padding: 0.3rem 0.8rem;
      font-weight: 800;
      font-size: 0.9rem;
      border-radius: 2px;
    }
    .listing-vip-tag {
      position: absolute;
      top: 0.8rem;
      right: 0.8rem;
      background-color: var(--color-accent);
      color: #ffffff;
      padding: 0.2rem 0.6rem;
      font-weight: 700;
      font-size: 0.7rem;
      border-radius: 2px;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .listing-content-box {
      padding: 1.2rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .listing-title-text {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--color-text-dark);
      margin: 0 0 0.3rem 0;
      line-height: 1.3;
    }
    .listing-location-text {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .listing-specs-flat {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.2rem;
    }
    .spec-chip {
      background-color: #f1f2f6;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-dark);
      border-radius: 4px;
    }
    .listing-footer-flat {
      border-top: 1px solid var(--color-border);
      padding-top: 0.8rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .flat-verified {
      font-size: 0.75rem;
      color: var(--color-green);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .btn-consult-flat {
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
    .btn-consult-flat:hover {
      color: #0b439c;
      text-decoration: underline;
    }

    /* DOUBLE CTA GRID */
    .double-cta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .cta-flat-card {
      border-radius: 4px;
      padding: 2.2rem;
      display: flex;
      gap: 1.5rem;
      color: #ffffff;
    }
    .cta-blue-flat {
      background: linear-gradient(135deg, #0d52b9 0%, #1a365d 100%);
      border: 1px solid #0b439c;
    }
    .cta-orange-flat {
      background: linear-gradient(135deg, var(--color-accent) 0%, #d35400 100%);
      border: 1px solid #d35400;
    }
    .cta-icon-flat {
      font-size: 2.8rem;
      line-height: 1;
    }
    .cta-content-flat {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .cta-content-flat h4 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
    }
    .cta-content-flat p {
      font-size: 0.9rem;
      margin: 0 0 1.5rem 0;
      opacity: 0.9;
      line-height: 1.5;
    }
    .btn-cta-flat-white {
      background-color: #ffffff;
      color: var(--color-text-dark);
      border: none;
      padding: 0.6rem 1.4rem;
      font-weight: 700;
      font-size: 0.85rem;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    .btn-cta-flat-white:hover {
      transform: scale(1.02);
    }

    /* RESPONSIVE DESIGN */
    @media (max-width: 992px) {
      .autoline-main { padding: 6.5rem 1rem 3rem; }
      .content-container { padding: 1.5rem; }
    }
    @media (max-width: 768px) {
      .domains-nav-container { justify-content: center; }
      .flat-selling-banner { padding: 1.2rem; }
      .cta-flat-card { flex-direction: column; gap: 1rem; padding: 1.5rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  activeTabId = 'trucks_buses';
  globalSearchQuery: string = '';
  spareSearchQuery: string = '';

  ngOnInit() {
    this.loadDbDomains();
  }

  loadDbDomains() {
    this.api.getDomains().subscribe({
      next: (domains) => {
        if (domains && domains.length > 0) {
          console.log('Successfully loaded domains from database:', domains);
          domains.forEach(dbDom => {
            const dbDesignation = dbDom.translations?.find((t: any) => t.language === 'en')?.designation || dbDom.code;
            for (const tab of this.categoriesData) {
              const sub = tab.subcategories.find(s => s.name.toLowerCase() === dbDesignation.toLowerCase());
              if (sub) {
                sub.count = dbDom.totalAds.toLocaleString('fr-FR');
              }
            }
          });
        }
      },
      error: (err) => {
        console.warn('Could not fetch domains from API, using premium frontend fallback counts.', err);
      }
    });
  }

  hasSvgIcon(subName: string): boolean {
    return true;
  }

  getSvgIconPath(subName: string): string {
    if (subName.toLowerCase() === 'semi-trailers') {
      return 'svgs/Semi-Trailers.svg';
    }
    if (subName.toLowerCase() === 'air transport') {
      return 'svgs/Air Transport.svg';
    }
    // Match with case correctness from original svgs list
    const originalNamesMap: Record<string, string> = {
      'aerial platforms': 'Aerial platforms',
      'air transport': 'Air Transport',
      'airport equipment': 'Airport equipment',
      'attachments for construction equipment': 'Attachments for construction equipment',
      'building equipment': 'Building equipment',
      'buses': 'Buses',
      'campers': 'Campers',
      'cars': 'Cars',
      'cleaning machinery': 'Cleaning machinery',
      'commercial vehicles': 'Commercial vehicles',
      'companies': 'Companies',
      'concrete equipment': 'Concrete equipment',
      'construction equipment parts': 'Construction equipment parts',
      'construction equipment repairs': 'Construction equipment repairs',
      'construction loaders': 'Construction loaders',
      'construction rollers': 'Construction rollers',
      'containers': 'Containers',
      'cranes': 'Cranes',
      'drilling machinery': 'Drilling machinery',
      'earthmoving equipment': 'Earthmoving equipment',
      'equipment': 'Equipment',
      'excavators': 'Excavators',
      'forklift attachments': 'Forklift attachments',
      'forklifts': 'Forklifts',
      'loading dock equipment': 'Loading dock equipment',
      'material handling equipment parts': 'Material handling equipment parts',
      'modular containers': 'Modular containers',
      'motorcycles': 'Motorcycles',
      'municipal vehicles': 'Municipal vehicles',
      'other construction equipment': 'Other construction equipment',
      'port equipment': 'Port equipment',
      'railway equipment': 'Railway equipment',
      'rent': 'Rent',
      'road construction equipment': 'Road construction equipment',
      'semi-trailers': 'Semi-Trailers',
      'services': 'Services',
      'spare parts': 'Spare parts',
      'special tires': 'Special tires',
      'surface finishing equipment': 'Surface finishing equipment',
      'tank transports': 'Tank transports',
      'tires and wheels': 'Tires and wheels',
      'trailers': 'Trailers',
      'truck tractors': 'Truck tractors',
      'trucks': 'Trucks',
      'vans': 'Vans',
      'warehouse cranes': 'Warehouse cranes',
      'warehouse equipment': 'Warehouse equipment',
      'water transport': 'Water transport'
    };
    const mapped = originalNamesMap[subName.toLowerCase()] || subName;
    return `svgs/${mapped}.svg`;
  }

  scrollToSection(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      const headerOffset = 110;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  getCategoryElementId(subName: string): string {
    if (subName === 'Equipment') return 'section-equipment-btp';
    if (subName === 'Spare parts') return 'section-spare-parts';
    if (subName === 'Rent') return 'section-rent';
    if (subName === 'Companies') return 'section-companies';
    return '';
  }

  searchFilters = {
    parentCategory: 'trucks_buses',
    brand: '',
    type: '',
    region: '',
    maxPrice: null as number | null
  };

  computedResultsCount = 1420;

  moroccanRegions = [
    'Casablanca-Settat',
    'Tanger-Tétouan-Al Hoceïma',
    'Rabat-Salé-Kénitra',
    'Marrakech-Safi',
    'Fès-Meknès',
    'Souss-Massa',
    'L\'Oriental',
    'Béni Mellal-Khénifra',
    'Drâa-Tafilalet',
    'Guelmim-Oued Noun'
  ];

  popularSparePartsBrands = [
    { name: 'Scania parts', count: '58 374' },
    { name: 'Volvo Trucks parts', count: '49 882' },
    { name: 'IVECO parts', count: '17 941' },
    { name: 'Renault Trucks parts', count: '15 413' },
    { name: 'ZF parts', count: '3 577' },
    { name: 'Solaris parts', count: '2 584' }
  ];

  categoriesData: CategoryTab[] = [
    {
      id: 'trucks_buses',
      title: 'Trucks, buses',
      titleFr: 'Poids lourds & Autobus',
      count: '448 936',
      subcategories: [
        { name: 'Trucks', nameFr: 'Camions', count: '29,588', iconPath: '' },
        { name: 'Truck tractors', nameFr: 'Tracteurs routiers', count: '20,151', iconPath: '' },
        { name: 'Commercial vehicles', nameFr: 'Utilitaires', count: '4,708', iconPath: '' },
        { name: 'Vans', nameFr: 'Fourgonnettes', count: '8,245', iconPath: '' },
        { name: 'Semi-trailers', nameFr: 'Semi-remorques', count: '15,819', iconPath: '' },
        { name: 'Trailers', nameFr: 'Remorques', count: '8,591', iconPath: '' },
        { name: 'Tank transports', nameFr: 'Citernes', count: '3,498', iconPath: '' },
        { name: 'Buses', nameFr: 'Autobus / Autocars', count: '6,187', iconPath: '' },
        { name: 'Municipal vehicles', nameFr: 'Véhicules de voirie', count: '6,428', iconPath: '' },
        { name: 'Airport equipment', nameFr: 'Équipement aéroportuaire', count: '142', iconPath: '' },
        { name: 'Railway equipment', nameFr: 'Matériel ferroviaire', count: '99', iconPath: '' },
        { name: 'Containers', nameFr: 'Conteneurs', count: '732', iconPath: '' }
      ]
    },
    {
      id: 'cars_motorhomes_motorcycles',
      title: 'Cars, motorhomes and motorcycles',
      titleFr: 'Voitures & Motos',
      count: '14 830',
      subcategories: [
        { name: 'Cars', nameFr: 'Voitures', count: '12,557', iconPath: '' },
        { name: 'Campers', nameFr: 'Camping-cars', count: '1,279', iconPath: '' },
        { name: 'Motorcycles', nameFr: 'Motos', count: '810', iconPath: '' },
        { name: 'Water transport', nameFr: 'Bateaux', count: '182', iconPath: '' },
        { name: 'Air transport', nameFr: 'Aéronefs', count: '2', iconPath: '' }
      ]
    },
    {
      id: 'construction_equipment',
      title: 'Construction equipment',
      titleFr: 'Matériel de construction',
      count: '356 747',
      subcategories: [
        { name: 'Excavators', nameFr: 'Pelles / Excavatrices', count: '33,266', iconPath: '' },
        { name: 'Cranes', nameFr: 'Grues', count: '6,839', iconPath: '' },
        { name: 'Concrete equipment', nameFr: 'Matériel de béton', count: '3,809', iconPath: '' },
        { name: 'Surface finishing equipment', nameFr: 'Traitement de surface', count: '246', iconPath: '' },
        { name: 'Building equipment', nameFr: 'Équipement de bâtiment', count: '758', iconPath: '' },
        { name: 'Drilling machinery', nameFr: 'Foreuses', count: '3,258', iconPath: '' },
        { name: 'Road construction equipment', nameFr: 'Matériel routier', count: '3,187', iconPath: '' },
        { name: 'Construction rollers', nameFr: 'Compacteurs', count: '3,579', iconPath: '' },
        { name: 'Earthmoving equipment', nameFr: 'Engins de terrassement', count: '5,650', iconPath: '' },
        { name: 'Aerial platforms', nameFr: 'Nacelles élévatrices', count: '8,078', iconPath: '' },
        { name: 'Modular containers', nameFr: 'Bâtiments modulaires', count: '723', iconPath: '' },
        { name: 'Construction loaders', nameFr: 'Chargeuses', count: '10,034', iconPath: '' },
        { name: 'Other construction equipment', nameFr: 'Autre matériel BTP', count: '156', iconPath: '' },
        { name: 'Construction equipment repairs', nameFr: 'Réparation', count: '1,402', iconPath: '' },
        { name: 'Construction equipment parts', nameFr: 'Pièces détachées BTP', count: '113,116', iconPath: '' },
        { name: 'Attachments for construction equipment', nameFr: 'Accessoires BTP', count: '12,810', iconPath: '' },
        { name: 'Special tires', nameFr: 'Pneus spéciaux', count: '874', iconPath: '' }
      ]
    },
    {
      id: 'material_handling_equipment',
      title: 'Material handling equipment',
      titleFr: 'Matériel de manutention',
      count: '35 423',
      subcategories: [
        { name: 'Forklifts', nameFr: 'Chariots élévateurs', count: '20,973', iconPath: '' },
        { name: 'Warehouse equipment', nameFr: 'Matériel d\'entrepôt', count: '1,157', iconPath: '' },
        { name: 'Cleaning machinery', nameFr: 'Machines de nettoyage', count: '448', iconPath: '' },
        { name: 'Port equipment', nameFr: 'Équipement portuaire', count: '743', iconPath: '' },
        { name: 'Warehouse cranes', nameFr: 'Grues d\'atelier', count: '764', iconPath: '' },
        { name: 'Loading dock equipment', nameFr: 'Équipements de quai', count: '187', iconPath: '' },
        { name: 'Forklift attachments', nameFr: 'Accessoires chariots', count: '3,044', iconPath: '' },
        { name: 'Material handling equipment parts', nameFr: 'Pièces manutention', count: '8,107', iconPath: '' }
      ]
    },
    {
      id: 'attachments_spare_parts_services',
      title: 'Attachments, spare parts, services',
      titleFr: 'Équipements & Pièces',
      count: '340 417',
      subcategories: [
        { name: 'Equipment', nameFr: 'Équipement BTP', count: '5,317', iconPath: '' },
        { name: 'Tires and wheels', nameFr: 'Pneus & Roues', count: '5,880', iconPath: '' },
        { name: 'Spare parts', nameFr: 'Pièces de rechange', count: '319,414', iconPath: '' },
        { name: 'Services', nameFr: 'Services pro', count: '201', iconPath: '' },
        { name: 'Rent', nameFr: 'Location', count: '889', iconPath: '' },
        { name: 'Companies', nameFr: 'Entreprises', count: '8,528', iconPath: '' }
      ]
    }
  ];

  moroccanFeaturedListings = [
    {
      id: '1',
      title: 'Scania R450 Streamline (6x2)',
      type: 'Truck tractors',
      price: '480 000 DH',
      location: 'Casablanca Port',
      year: '2017',
      mileage: '620 000 km',
      power: '450 ch',
      axle: '6x2'
    },
    {
      id: '2',
      title: 'Volvo FH 500 Globetrotter',
      type: 'Truck tractors',
      price: '580 000 DH',
      location: 'Tanger Med',
      year: '2018',
      mileage: '540 000 km',
      power: '500 ch',
      axle: '4x2'
    },
    {
      id: '3',
      title: 'Caterpillar 320D Series 2',
      type: 'Equipment',
      price: '850 000 DH',
      location: 'Marrakech-Safi',
      year: '2016',
      mileage: '8 500 heures',
      power: '148 ch',
      axle: 'Chenilles BTP'
    },
    {
      id: '4',
      title: 'Semi-Remorque Frigorifique Schmitz',
      type: 'Semi-trailers',
      price: '320 000 DH',
      location: 'Agadir Port',
      year: '2015',
      mileage: 'N/A',
      power: 'Thermo King SLX',
      axle: '3 Essieux'
    },
    {
      id: '5',
      title: 'DAF XF 460 Space Cab',
      type: 'Truck tractors',
      price: '410 000 DH',
      location: 'Fès Ville',
      year: '2016',
      mileage: '680 000 km',
      power: '460 ch',
      axle: '4x2'
    },
    {
      id: '6',
      title: 'Mercedes-Benz Sprinter 316 CDI',
      type: 'Commercial vehicles',
      price: '195 000 DH',
      location: 'Rabat Ville',
      year: '2017',
      mileage: '185 000 km',
      power: '163 ch',
      axle: 'Fourgon L2H2'
    }
  ];

  get activeTabAdsCount(): string {
    return this.categoriesData.find(t => t.id === this.searchFilters.parentCategory)?.count || '0';
  }

  selectTab(tabId: string) {
    this.searchFilters.parentCategory = tabId;
    this.onParentCategoryChange();
  }

  onParentCategoryChange() {
    this.searchFilters.brand = '';
    this.searchFilters.type = '';
    if (this.searchFilters.parentCategory === 'trucks_buses') {
      this.computedResultsCount = 1420;
    } else if (this.searchFilters.parentCategory === 'cars_motorhomes_motorcycles') {
      this.computedResultsCount = 285;
    } else {
      this.computedResultsCount = 3890;
    }
  }

  getTabEmoji(tabId: string): string {
    if (tabId === 'trucks_buses') return '🚛';
    if (tabId === 'cars_motorhomes_motorcycles') return '🚗';
    return '⚙️';
  }

  getActiveTabTitleFr(): string {
    return this.categoriesData.find(t => t.id === this.searchFilters.parentCategory)?.titleFr || '';
  }

  getActiveSubcategories(): SubCategory[] {
    return this.categoriesData.find(t => t.id === this.searchFilters.parentCategory)?.subcategories || [];
  }

  getSubcategories(tabId: string): SubCategory[] {
    return this.categoriesData.find(t => t.id === tabId)?.subcategories || [];
  }

  getSubcategoriesCount(tabId: string): string {
    return this.categoriesData.find(t => t.id === tabId)?.count || '0';
  }

  getContextualBrands(): string[] {
    if (this.searchFilters.parentCategory === 'trucks_buses') {
      return ['Scania', 'Volvo', 'Mercedes-Benz', 'DAF', 'MAN', 'Renault Trucks', 'IVECO', 'Sinotruk'];
    } else if (this.searchFilters.parentCategory === 'cars_motorhomes_motorcycles') {
      return ['Dacia', 'Renault', 'Peugeot', 'Volkswagen', 'Toyota', 'BMW', 'Yamaha', 'Kawasaki'];
    } else {
      return ['Caterpillar', 'JCB', 'Komatsu', 'Liebherr', 'Michelin', 'Bridgestone', 'Bosch', 'ZF'];
    }
  }

  getFeaturedListings() {
    return this.moroccanFeaturedListings;
  }

  getVehicleEmoji(type: string): string {
    if (type === 'Truck tractors') return '🚜';
    if (type === 'Semi-trailers') return '🚛';
    if (type === 'Equipment') return '🏗️';
    if (type === 'Commercial vehicles') return '🚐';
    return '🚗';
  }

  triggerSearch() {
    console.log('Searching listings with filters:', this.searchFilters);
    alert(`Recherche en cours... Filtres appliqués : \n- Domaine: ${this.searchFilters.parentCategory}\n- Constructeur: ${this.searchFilters.brand || 'Tous'}\n- Type: ${this.searchFilters.type || 'Tous'}\n- Région: ${this.searchFilters.region || 'Toutes'}\n- Budget: ${this.searchFilters.maxPrice ? this.searchFilters.maxPrice + ' DH' : 'Illimité'}`);
  }

  triggerGlobalSearch() {
    console.log('Global search query:', this.globalSearchQuery);
    alert(`Recherche globale pour : "${this.globalSearchQuery}"`);
  }

  triggerSpareSearch() {
    console.log('Spare parts search query:', this.spareSearchQuery);
    alert(`Recherche de pièces détachées pour : "${this.spareSearchQuery}"`);
  }

  setSpareQuery(query: string) {
    this.spareSearchQuery = query;
    this.triggerSpareSearch();
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
