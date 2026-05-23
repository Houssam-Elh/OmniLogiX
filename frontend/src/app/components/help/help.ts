import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
  group: string; // links each FAQ to a shortLink filter
}

interface ShortLink {
  label: string;
  groupId: string;
}

interface HelpCategory {
  id: string;
  label: string;
  icon: string;
  iconClass: string;
  shortLinks: ShortLink[];
  faqItems: FaqItem[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass],
  template: `
    <!-- ===== DETAIL VIEW (after "Voir tout" or shortLink click) ===== -->
    @if (activeCategory) {
      <!-- BREADCRUMB -->
      <div class="breadcrumb-container">
        <div class="container">
          <ul class="breadcrumb">
            <li><a routerLink="/">OMNILOG</a></li>
            <li class="separator">/</li>
            <li><a href="javascript:void(0)" (click)="backToMain()">Aide</a></li>
            <li class="separator">/</li>
            @if (activeFilter) {
              <li><a href="javascript:void(0)" (click)="clearFilter()">{{ activeCategory.label }}</a></li>
              <li class="separator">/</li>
              <li class="active">{{ activeFilterLabel }}</li>
            } @else {
              <li class="active">{{ activeCategory.label }}</li>
            }
          </ul>
        </div>
      </div>

      <!-- DETAIL LAYOUT -->
      <section class="detail-section">
        <div class="container">
          <div class="detail-layout">

            <!-- LEFT: FAQ LIST -->
            <div class="detail-main">
              <h2 class="detail-title">{{ activeFilter ? activeFilterLabel : activeCategory.label }}</h2>

              <!-- FILTER PILLS (the 3 shortLinks as clickable filters) -->
              <div class="filter-pills">
                <button
                  class="filter-pill"
                  [ngClass]="{ 'filter-pill-active': !activeFilter }"
                  (click)="clearFilter()"
                >
                  Tout
                </button>
                @for (sl of activeCategory.shortLinks; track sl.groupId) {
                  <button
                    class="filter-pill"
                    [ngClass]="{ 'filter-pill-active': activeFilter === sl.groupId }"
                    (click)="setFilter(sl.groupId)"
                  >
                    {{ sl.label }}
                  </button>
                }
              </div>

              <!-- FAQ items (filtered) -->
              <div class="faq-list">
                @for (item of displayedFaqItems; track item.question) {
                  <div class="faq-item" [ngClass]="{ 'faq-open': item.open }">
                    <button class="faq-question" (click)="toggleFaq(item)">
                      <span class="faq-chevron">›</span>
                      <span>{{ item.question }}</span>
                    </button>
                    @if (item.open) {
                      <div class="faq-answer">
                        <p>{{ item.answer }}</p>
                      </div>
                    }
                  </div>
                }
              </div>

              @if (displayedFaqItems.length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">📭</span>
                  <p>Aucune question trouvée pour ce filtre.</p>
                </div>
              }

              <!-- BOTTOM HELP LINK -->
              <div class="not-found-box">
                <span>Vous n'avez pas trouvé l'information recherchée ?</span>
                <a routerLink="/about" class="feel-free-link">N'hésitez pas à nous contacter</a>
              </div>
            </div>

            <!-- RIGHT: CATEGORIES SIDEBAR -->
            <aside class="detail-sidebar">
              <div class="sidebar-card">
                <h4 class="sidebar-title">Catégories</h4>
                <ul class="sidebar-links">
                  @for (cat of categories; track cat.id) {
                    <li>
                      <a
                        href="javascript:void(0)"
                        (click)="viewAll(cat.id)"
                        [ngClass]="{ 'sidebar-active': activeCategory.id === cat.id }"
                      >
                        {{ cat.label }}
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </aside>

          </div>
        </div>
      </section>
    }

    <!-- ===== MAIN HELP VIEW (cards grid) ===== -->
    @if (!activeCategory) {
      <!-- BREADCRUMB -->
      <div class="breadcrumb-container">
        <div class="container">
          <ul class="breadcrumb">
            <li><a routerLink="/">OMNILOG</a></li>
            <li class="separator">/</li>
            <li class="active">Aide</li>
          </ul>
        </div>
      </div>

      <!-- MAIN HELP SECTION -->
      <section class="help-hero">
        <div class="container text-center">
          <h1 class="help-title">Comment pouvons-nous vous aider ?</h1>

          <!-- SEARCH BAR -->
          <div class="help-search-container">
            <div class="help-search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Rechercher par mot-clé, sujet ou question..."
                (keyup.enter)="onSearch()"
              >
              <button class="btn-search-red" (click)="onSearch()">Rechercher</button>
            </div>
          </div>
        </div>
      </section>

      <!-- GRID CATEGORIES SECTION -->
      <section class="help-categories">
        <div class="container">
          <div class="help-grid">

            @for (cat of categories; track cat.id) {
              <div class="help-card">
                <div class="card-header">
                  <div class="help-icon-wrapper" [ngClass]="cat.iconClass">
                    <span class="icon-span">{{ cat.icon }}</span>
                  </div>
                  <h3>{{ cat.label }}</h3>
                </div>
                <ul class="help-links">
                  @for (sl of cat.shortLinks; track sl.groupId) {
                    <li><a href="javascript:void(0)" (click)="openTopicFilter(cat.id, sl.groupId)">{{ sl.label }}</a></li>
                  }
                </ul>
                <a href="javascript:void(0)" class="view-all-link" (click)="viewAll(cat.id)">Voir tout →</a>
              </div>
            }

          </div>
        </div>
      </section>

      <!-- CONTACT BANNER -->
      <section class="help-contact">
        <div class="container">
          <div class="contact-box">
            <div class="contact-glow"></div>
            <h2>Vous n'avez pas trouvé de réponse ?</h2>
            <p>Notre équipe de support client est disponible 24/7 pour vous aider dans vos démarches logistiques.</p>
            <div class="contact-actions">
              <a routerLink="/about" class="btn btn-red">Envoyer un message</a>
              <a href="tel:+212522123456" class="btn btn-outline-white">📞 +212 5 22 12 34 56</a>
            </div>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding-top: 70px;
      font-family: 'Inter', sans-serif;
      background-color: #f7f9fc;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .text-center {
      text-align: center;
    }

    /* ==================== BREADCRUMB ==================== */
    .breadcrumb-container {
      background: #ffffff;
      border-bottom: 1px solid #edf2f7;
      padding: 0.75rem 0;
    }

    .breadcrumb {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #718096;
    }

    .breadcrumb a {
      color: #e53e3e;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .breadcrumb a:hover {
      color: #b91c1c;
      text-decoration: underline;
    }

    .breadcrumb .separator {
      color: #cbd5e1;
    }

    .breadcrumb .active {
      color: #4a5568;
    }

    /* ==================== HERO SECTION ==================== */
    .help-hero {
      background: #ffffff;
      padding: 4rem 0 3.5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    }

    .help-title {
      font-size: 2.5rem;
      font-weight: 850;
      color: #1a202c;
      margin-bottom: 2rem;
      letter-spacing: -0.5px;
    }

    /* ==================== SEARCH BOX ==================== */
    .help-search-container {
      max-width: 650px;
      margin: 0 auto;
    }

    .help-search-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 50px;
      padding: 0.4rem 0.4rem 0.4rem 1.2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }

    .help-search-box:focus-within {
      border-color: #e53e3e;
      background: #ffffff;
      box-shadow: 0 10px 25px rgba(229, 62, 62, 0.08);
    }

    .search-icon {
      font-size: 1.1rem;
      color: #a0aec0;
      margin-right: 0.75rem;
    }

    .help-search-box input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.95rem;
      color: #2d3748;
      width: 100%;
    }

    .btn-search-red {
      background: #e53e3e;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.75rem;
      border-radius: 50px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }

    .btn-search-red:hover {
      background: #c53030;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(229, 62, 62, 0.2);
    }

    /* ==================== CATEGORIES GRID ==================== */
    .help-categories {
      padding: 4rem 0;
    }

    .help-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .help-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 2.5rem;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 15px rgba(0,0,0,0.01);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .help-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
      border-color: rgba(229, 62, 62, 0.2);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .help-icon-wrapper {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .profile-icon { background: rgba(229, 62, 62, 0.08); color: #e53e3e; }
    .details-icon { background: rgba(229, 62, 62, 0.08); color: #e53e3e; }
    .safety-icon { background: rgba(229, 62, 62, 0.08); color: #e53e3e; }
    .tips-icon { background: rgba(229, 62, 62, 0.08); color: #e53e3e; }

    .help-card h3 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
    }

    .help-links {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .help-links li a {
      color: #4a5568;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s ease;
      line-height: 1.5;
    }

    .help-links li a:hover {
      color: #e53e3e;
      padding-left: 4px;
    }

    .view-all-link {
      align-self: flex-start;
      color: #e53e3e;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .view-all-link:hover {
      color: #b91c1c;
      text-decoration: underline;
    }

    /* ==================== CONTACT BOX BANNER ==================== */
    .help-contact {
      padding: 2rem 0 5rem 0;
    }

    .contact-box {
      background: #0f172a;
      border-radius: 24px;
      padding: 4rem 3rem;
      text-align: center;
      position: relative;
      overflow: hidden;
      color: #ffffff;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .contact-glow {
      position: absolute;
      top: -50%;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 300px;
      background: radial-gradient(circle, rgba(229, 62, 62, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .contact-box h2 {
      font-size: 2rem;
      font-weight: 850;
      margin-bottom: 0.75rem;
      position: relative;
      z-index: 2;
    }

    .contact-box p {
      color: #94a3b8;
      font-size: 1.05rem;
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.6;
      position: relative;
      z-index: 2;
    }

    .contact-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      position: relative;
      z-index: 2;
    }

    .btn {
      padding: 0.85rem 2rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-red {
      background: #e53e3e;
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(229, 62, 62, 0.25);
    }

    .btn-red:hover {
      background: #c53030;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(229, 62, 62, 0.35);
    }

    .btn-outline-white {
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    .btn-outline-white:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: #ffffff;
      transform: translateY(-2px);
    }

    /* ==================== DETAIL VIEW ==================== */
    .detail-section {
      padding: 2.5rem 0 5rem 0;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 2.5rem;
      align-items: start;
    }

    /* --- Main FAQ panel --- */
    .detail-main {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem 3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }

    .detail-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0 0 1.5rem 0;
      padding-bottom: 1.25rem;
      border-bottom: 2px solid #f1f5f9;
    }

    /* --- Filter pills --- */
    .filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .filter-pill {
      padding: 0.5rem 1.1rem;
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.25s ease;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      white-space: nowrap;
    }

    .filter-pill:hover {
      border-color: #e53e3e;
      color: #e53e3e;
      background: rgba(229, 62, 62, 0.04);
      transform: translateY(-1px);
    }

    .filter-pill-active {
      background: #e53e3e !important;
      color: #ffffff !important;
      border-color: #e53e3e !important;
      box-shadow: 0 4px 12px rgba(229, 62, 62, 0.25);
    }

    .filter-pill-active:hover {
      background: #c53030 !important;
      color: #ffffff !important;
    }

    /* --- FAQ accordion --- */
    .faq-list {
      display: flex;
      flex-direction: column;
    }

    .faq-item {
      border-bottom: 1px solid #f1f5f9;
      animation: fadeIn 0.3s ease;
    }

    .faq-item:last-child {
      border-bottom: none;
    }

    .faq-question {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      width: 100%;
      background: none;
      border: none;
      padding: 1.1rem 0;
      font-size: 0.95rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      text-align: left;
      transition: color 0.2s ease;
      font-family: 'Inter', sans-serif;
      line-height: 1.5;
    }

    .faq-question:hover {
      color: #e53e3e;
    }

    .faq-chevron {
      font-size: 1.3rem;
      color: #94a3b8;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
      flex-shrink: 0;
      display: inline-block;
      width: 18px;
      text-align: center;
    }

    .faq-open .faq-chevron {
      transform: rotate(90deg);
      color: #e53e3e;
    }

    .faq-open .faq-question {
      color: #e53e3e;
      font-weight: 600;
    }

    .faq-answer {
      padding: 0 0 1.25rem 2rem;
      animation: fadeSlideDown 0.3s ease;
    }

    .faq-answer p {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.75;
      margin: 0;
    }

    @keyframes fadeSlideDown {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* --- Empty state --- */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }

    .empty-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    .empty-state p {
      font-size: 0.95rem;
      margin: 0;
    }

    /* --- Bottom "not found" link --- */
    .not-found-box {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 2px solid #f1f5f9;
      font-size: 0.9rem;
      color: #64748b;
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .feel-free-link {
      color: #e53e3e;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .feel-free-link:hover {
      color: #b91c1c;
      text-decoration: underline;
    }

    /* --- Sidebar --- */
    .detail-sidebar {
      position: sticky;
      top: 90px;
    }

    .sidebar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }

    .sidebar-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0 0 1.25rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .sidebar-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-links li {
      position: relative;
    }

    .sidebar-links li a {
      display: block;
      padding: 0.7rem 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #64748b;
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: all 0.2s ease;
      border-radius: 0 8px 8px 0;
    }

    .sidebar-links li a:hover {
      color: #e53e3e;
      background: rgba(229, 62, 62, 0.04);
      border-left-color: rgba(229, 62, 62, 0.3);
    }

    .sidebar-links li a.sidebar-active {
      color: #e53e3e;
      font-weight: 700;
      background: rgba(229, 62, 62, 0.06);
      border-left-color: #e53e3e;
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 900px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }

      .detail-sidebar {
        position: static;
        order: -1;
      }

      .sidebar-links {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .sidebar-links li a {
        border-left: none;
        border-bottom: 3px solid transparent;
        border-radius: 8px 8px 0 0;
        padding: 0.5rem 1rem;
      }

      .sidebar-links li a.sidebar-active {
        border-bottom-color: #e53e3e;
        border-left-color: transparent;
      }

      .sidebar-links li a:hover {
        border-left-color: transparent;
        border-bottom-color: rgba(229, 62, 62, 0.3);
      }
    }

    @media (max-width: 768px) {
      .help-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .help-title {
        font-size: 2rem;
      }
      .contact-box {
        padding: 3rem 1.5rem;
      }
      .contact-box h2 {
        font-size: 1.6rem;
      }
      .detail-main {
        padding: 1.5rem;
      }
      .filter-pills {
        gap: 0.35rem;
      }
      .filter-pill {
        font-size: 0.75rem;
        padding: 0.4rem 0.85rem;
      }
    }
  `]
})
export class HelpComponent {
  searchQuery: string = '';
  activeCategory: HelpCategory | null = null;
  activeFilter: string | null = null; // groupId of the active shortLink filter
  displayedFaqItems: FaqItem[] = [];

  get activeFilterLabel(): string {
    if (!this.activeCategory || !this.activeFilter) return '';
    const sl = this.activeCategory.shortLinks.find(s => s.groupId === this.activeFilter);
    return sl ? sl.label : '';
  }

  categories: HelpCategory[] = [
    {
      id: 'profil',
      label: 'Profil & Compte',
      icon: '👤',
      iconClass: 'profile-icon',
      shortLinks: [
        { label: 'Créer un compte sur OMNILOG', groupId: 'compte' },
        { label: 'Comment restaurer l\'accès à mon compte ?', groupId: 'acces' },
        { label: 'Modifier mes coordonnées (email, téléphone, raison sociale)', groupId: 'coordonnees' },
      ],
      faqItems: [
        // ---- groupe: compte ----
        { question: 'Créer un compte sur OMNILOG', answer: 'Pour créer un compte, cliquez sur "Inscription" en haut à droite, remplissez le formulaire avec vos informations professionnelles (raison sociale, adresse e-mail, numéro de téléphone) et validez votre inscription via le lien envoyé par e-mail.', open: false, group: 'compte' },
        { question: 'Comment s\'inscrire en tant que particulier sur le site ?', answer: 'OMNILOG est principalement destiné aux professionnels du transport et de la logistique. Cependant, vous pouvez créer un compte particulier en sélectionnant le type "Particulier" lors de l\'inscription.', open: false, group: 'compte' },
        { question: 'Comment supprimer un compte si je me suis inscrit par erreur ?', answer: 'Contactez notre support client à support@omnilog.com ou appelez le +212 5 22 12 34 56 pour demander la suppression de votre compte. Celle-ci sera effective sous 48 heures.', open: false, group: 'compte' },
        { question: 'Comment me connecter immédiatement après l\'activation (si non autorisé auparavant et que je me connecte pour la première fois) ?', answer: 'Après avoir cliqué sur le lien d\'activation reçu par e-mail, vous serez automatiquement redirigé vers la page de connexion. Utilisez vos identifiants pour accéder à votre compte.', open: false, group: 'compte' },
        { question: 'Comment gérer mes abonnements ?', answer: 'Consultez la rubrique "Mon compte" > "Abonnements" pour voir vos formules actives, modifier ou résilier vos abonnements.', open: false, group: 'compte' },
        { question: 'Comment créer/supprimer/modifier des abonnements ?', answer: 'Rendez-vous dans "Mon compte" > "Abonnements" pour gérer vos formules. Vous pouvez upgrader, downgrader ou annuler votre abonnement à tout moment.', open: false, group: 'compte' },

        // ---- groupe: acces ----
        { question: 'Comment restaurer l\'accès à un compte ?', answer: 'Si vous avez perdu l\'accès à votre compte, cliquez sur "Mot de passe oublié" sur la page de connexion. Un lien de réinitialisation sera envoyé à votre adresse e-mail enregistrée.', open: false, group: 'acces' },
        { question: 'Comment me connecter si j\'ai oublié mon mot de passe ?', answer: 'Utilisez la fonctionnalité "Mot de passe oublié" sur la page de connexion. Vous recevrez un e-mail avec un lien pour créer un nouveau mot de passe.', open: false, group: 'acces' },
        { question: 'Comment me connecter à mon compte si j\'ai oublié mon mot de passe ?', answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion, saisissez votre adresse e-mail, puis suivez les instructions dans l\'e-mail de réinitialisation.', open: false, group: 'acces' },
        { question: 'Pourquoi mon solde n\'est-il pas crédité alors que j\'ai payé mon rechargement de compte ?', answer: 'Le traitement des paiements peut prendre jusqu\'à 24 heures selon votre moyen de paiement. Si le délai est dépassé, contactez notre service de facturation avec votre preuve de paiement.', open: false, group: 'acces' },

        // ---- groupe: coordonnees ----
        { question: 'Comment modifier les coordonnées de contact (adresse e-mail, numéro de téléphone, etc.) ?', answer: 'Rendez-vous dans "Mon compte" > "Paramètres" > "Informations personnelles" pour mettre à jour vos coordonnées de contact.', open: false, group: 'coordonnees' },
        { question: 'Comment modifier les numéros de téléphone, l\'adresse e-mail, la raison sociale et le logo ?', answer: 'Connectez-vous à votre compte, puis accédez à "Paramètres du profil" pour modifier chacune de ces informations. Le logo doit être au format JPG ou PNG, de 200x200 pixels minimum.', open: false, group: 'coordonnees' },
        { question: 'Comment consulter les statistiques de mes annonces ?', answer: 'Accédez à votre tableau de bord via "Mon compte" pour consulter le nombre de vues, de clics et de contacts reçus pour chacune de vos annonces.', open: false, group: 'coordonnees' },
        { question: 'Où trouver et comment obtenir une facture acquittée (facture/acte de services rendus) ?', answer: 'Vos factures sont disponibles dans "Mon compte" > "Facturation". Vous pouvez les télécharger au format PDF à tout moment.', open: false, group: 'coordonnees' },
        { question: 'Pourquoi les annonces mettent-elles du temps à apparaître sur le site (lorsque le service "Import Ads" est activé) ?', answer: 'Le traitement des annonces importées peut prendre jusqu\'à 30 minutes en fonction du volume. Assurez-vous que le format de votre fichier d\'import est correct pour accélérer le processus.', open: false, group: 'coordonnees' },
        { question: 'Où sont stockées les demandes reçues par les entreprises de location/livraison de véhicules ?', answer: 'Les demandes sont visibles dans votre espace "Mon compte" > "Demandes reçues". Vous recevrez également une notification par e-mail pour chaque nouvelle demande.', open: false, group: 'coordonnees' },
        { question: 'Pourquoi une annonce publiée ne s\'affiche pas dans la section "Inactive" ?', answer: 'Les annonces inactives sont celles qui ont expiré ou ont été désactivées manuellement. Vérifiez les dates de validité et l\'état de publication dans votre tableau de bord.', open: false, group: 'coordonnees' },
        { question: 'Après avoir publié une annonce, elle apparaît sur le site mais pas dans mon tableau de bord. Où la trouver ?', answer: 'Il peut y avoir un délai de synchronisation. Rafraîchissez votre page ou déconnectez-vous puis reconnectez-vous. Si le problème persiste, contactez le support technique.', open: false, group: 'coordonnees' },
        { question: 'Pourquoi une annonce met-elle du temps à apparaître sur le site ?', answer: 'Nos équipes modèrent chaque annonce pour garantir la qualité du contenu. Ce processus peut prendre entre 15 minutes et 2 heures en heures ouvrables.', open: false, group: 'coordonnees' },
      ]
    },
    {
      id: 'details',
      label: 'Informations & Détails',
      icon: 'ℹ️',
      iconClass: 'details-icon',
      shortLinks: [
        { label: 'Contacter le support d\'OMNILOG', groupId: 'support' },
        { label: 'Avis et témoignages des utilisateurs', groupId: 'avis' },
        { label: 'Conditions Générales d\'Utilisation', groupId: 'cgu' },
      ],
      faqItems: [
        { question: 'Comment contacter le support d\'OMNILOG ?', answer: 'Vous pouvez nous contacter par e-mail à support@omnilog.com, par téléphone au +212 5 22 12 34 56, ou via le formulaire de contact accessible depuis la page "À propos".', open: false, group: 'support' },
        { question: 'Quels types de transport sont couverts par OMNILOG ?', answer: 'OMNILOG couvre le transport routier national et international, le fret maritime, le fret aérien et la logistique de dernière mile au Maroc et dans toute l\'Afrique.', open: false, group: 'support' },

        { question: 'Quels sont les avis des utilisateurs sur OMNILOG ?', answer: 'Consultez la section "Avis" de notre site pour lire les témoignages de transporteurs et expéditeurs qui utilisent notre plateforme au quotidien.', open: false, group: 'avis' },
        { question: 'Comment fonctionne le système de notation des transporteurs ?', answer: 'Chaque transaction terminée permet aux deux parties de se noter mutuellement. Les notes et commentaires sont publics et contribuent à la réputation de chaque membre.', open: false, group: 'avis' },

        { question: 'Où trouver les Conditions Générales d\'Utilisation ?', answer: 'Les CGU sont accessibles en bas de chaque page du site dans le lien "Conditions Générales". Elles détaillent les droits et obligations de chaque utilisateur.', open: false, group: 'cgu' },
        { question: 'OMNILOG est-il disponible dans d\'autres pays ?', answer: 'Actuellement, OMNILOG est actif au Maroc, en Tunisie, en Algérie et dans plusieurs pays d\'Afrique de l\'Ouest. Nous étendons régulièrement notre couverture géographique.', open: false, group: 'cgu' },
      ]
    },
    {
      id: 'securite',
      label: 'Sécurité & Confidentialité',
      icon: '🛡️',
      iconClass: 'safety-icon',
      shortLinks: [
        { label: 'Vérification et contrôle des prix', groupId: 'prix' },
        { label: 'Processus de vérification des membres', groupId: 'verification' },
        { label: 'Prévention du phishing et sécurité', groupId: 'phishing' },
      ],
      faqItems: [
        { question: 'Comment OMNILOG vérifie-t-il les prix des annonces ?', answer: 'Notre algorithme compare les prix proposés avec les moyennes du marché. Les annonces dont les prix semblent anormalement bas ou élevés sont signalées et vérifiées manuellement par nos modérateurs.', open: false, group: 'prix' },

        { question: 'Comment sont vérifiés les membres de la plateforme ?', answer: 'Chaque nouveau membre professionnel doit fournir un extrait Kbis ou un registre de commerce, un document d\'identité et une preuve d\'adresse. Ces documents sont vérifiés par notre équipe avant l\'activation du compte.', open: false, group: 'verification' },
        { question: 'Comment signaler un utilisateur frauduleux ?', answer: 'Utilisez le bouton "Signaler" présent sur chaque profil ou annonce. Notre équipe de modération examinera le signalement sous 24 heures et prendra les mesures nécessaires.', open: false, group: 'verification' },

        { question: 'Comment se protéger contre le phishing ?', answer: 'Ne communiquez jamais vos identifiants par e-mail. OMNILOG ne vous demandera jamais votre mot de passe. Vérifiez toujours que l\'URL commence par https://omnilog.com avant de saisir vos informations.', open: false, group: 'phishing' },
        { question: 'Mes données personnelles sont-elles protégées ?', answer: 'Oui, nous appliquons les normes RGPD et les meilleures pratiques de cybersécurité. Vos données sont chiffrées et ne sont jamais partagées avec des tiers sans votre consentement explicite.', open: false, group: 'phishing' },
        { question: 'Que faire si je constate une activité suspecte sur mon compte ?', answer: 'Changez immédiatement votre mot de passe et contactez notre support. Nous gèlerons temporairement votre compte pour enquêter sur toute activité non autorisée.', open: false, group: 'phishing' },
      ]
    },
    {
      id: 'astuces',
      label: 'Conseils & Astuces',
      icon: '💡',
      iconClass: 'tips-icon',
      shortLinks: [
        { label: 'Comment optimiser vos annonces de fret ?', groupId: 'optimiser' },
        { label: 'Comment insérer une bannière publicitaire ?', groupId: 'banniere' },
        { label: 'Quels sont les services professionnels OMNILOG ?', groupId: 'services' },
      ],
      faqItems: [
        { question: 'Comment optimiser vos annonces de fret ?', answer: 'Utilisez des photos de qualité, rédigez des descriptions détaillées incluant les dimensions, le poids et les conditions de transport. Mentionnez clairement les villes de départ et d\'arrivée pour une meilleure visibilité dans les résultats de recherche.', open: false, group: 'optimiser' },
        { question: 'Comment augmenter la visibilité de mon profil ?', answer: 'Complétez votre profil à 100%, ajoutez un logo professionnel, collectez des avis positifs et publiez régulièrement des annonces. Les profils complets apparaissent en priorité dans les résultats de recherche.', open: false, group: 'optimiser' },
        { question: 'Comment utiliser la bourse de fret efficacement ?', answer: 'Configurez des alertes pour être notifié dès qu\'un chargement correspondant à vos critères est publié. Répondez rapidement aux offres et maintenez un bon score de fiabilité pour maximiser vos chances.', open: false, group: 'optimiser' },
        { question: 'Comment réduire les trajets à vide ?', answer: 'Utilisez notre outil de correspondance intelligente qui vous propose des chargements retour en fonction de vos itinéraires habituels. Vous pouvez également publier vos disponibilités pour que les expéditeurs vous contactent directement.', open: false, group: 'optimiser' },

        { question: 'Comment insérer une bannière publicitaire ?', answer: 'Rendez-vous dans "Mon compte" > "Publicité" > "Créer une bannière". Choisissez le format, uploadez votre visuel et sélectionnez les pages sur lesquelles vous souhaitez afficher votre bannière.', open: false, group: 'banniere' },

        { question: 'Quels sont les services professionnels OMNILOG ?', answer: 'OMNILOG propose des services de mise en relation, de gestion de flotte, de suivi GPS en temps réel, de facturation automatisée et d\'assurance transport. Chaque service est disponible selon votre formule d\'abonnement.', open: false, group: 'services' },
      ]
    },
  ];

  onSearch() {
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      const results: FaqItem[] = [];
      for (const cat of this.categories) {
        for (const faq of cat.faqItems) {
          if (faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)) {
            results.push({ ...faq, open: false });
          }
        }
      }
      if (results.length > 0) {
        this.activeCategory = {
          id: 'search',
          label: `Résultats pour "${this.searchQuery}"`,
          icon: '🔍',
          iconClass: 'profile-icon',
          shortLinks: [],
          faqItems: results,
        };
        this.activeFilter = null;
        this.updateDisplayedItems();
      } else {
        alert(`Aucun résultat trouvé pour : "${this.searchQuery}"`);
      }
    }
  }

  /** Click on a shortLink in a card → open detail view filtered to that group */
  openTopicFilter(categoryId: string, groupId: string) {
    const cat = this.categories.find(c => c.id === categoryId);
    if (cat) {
      cat.faqItems.forEach(f => f.open = false);
      this.activeCategory = cat;
      this.activeFilter = groupId;
      this.updateDisplayedItems();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** "Voir tout →" → open detail view with ALL questions (no filter) */
  viewAll(categoryId: string) {
    const cat = this.categories.find(c => c.id === categoryId);
    if (cat) {
      cat.faqItems.forEach(f => f.open = false);
      this.activeCategory = cat;
      this.activeFilter = null;
      this.updateDisplayedItems();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Set a filter from the pills in the detail view */
  setFilter(groupId: string) {
    this.activeFilter = groupId;
    if (this.activeCategory) {
      this.activeCategory.faqItems.forEach(f => f.open = false);
    }
    this.updateDisplayedItems();
  }

  /** Clear the filter (show all) */
  clearFilter() {
    this.activeFilter = null;
    if (this.activeCategory) {
      this.activeCategory.faqItems.forEach(f => f.open = false);
    }
    this.updateDisplayedItems();
  }

  backToMain() {
    this.activeCategory = null;
    this.activeFilter = null;
    this.displayedFaqItems = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFaq(item: FaqItem) {
    item.open = !item.open;
  }

  private updateDisplayedItems() {
    if (!this.activeCategory) {
      this.displayedFaqItems = [];
      return;
    }
    if (this.activeFilter) {
      this.displayedFaqItems = this.activeCategory.faqItems.filter(f => f.group === this.activeFilter);
    } else {
      this.displayedFaqItems = [...this.activeCategory.faqItems];
    }
  }
}
