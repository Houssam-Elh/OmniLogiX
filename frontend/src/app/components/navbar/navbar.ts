import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <nav id="main-nav" [class.scrolled]="isScrolled">
      <div class="nav-container">
        <a routerLink="/" class="logo">
          <div class="logo-text">OMNI<span>LOG</span></div>
          <div class="logo-sub">Plateforme Numérique</div>
        </a>
        
        <button class="mobile-toggle" (click)="toggleMenu()">
          <span class="bar" [class.open]="menuOpen"></span>
          <span class="bar" [class.open]="menuOpen"></span>
          <span class="bar" [class.open]="menuOpen"></span>
        </button>

        <ul class="nav-links" [class.active]="menuOpen">
          <li class="dropdown">
            <a routerLink="/bourses">Bourses Logistiques ▾</a>
            <ul class="dropdown-menu">
              <li><a routerLink="/bourses" (click)="closeMenu()">Bourse de Fret</a></li>
              <li><a routerLink="/bourses" (click)="closeMenu()">Bourse Messagerie & Express</a></li>
              <li><a routerLink="/bourses" (click)="closeMenu()">Bourse de Capacité</a></li>
              <li><a routerLink="/bourses" (click)="closeMenu()">Bourse Entreposage</a></li>
              <li><a routerLink="/bourses" (click)="closeMenu()">Bourse des Chauffeurs</a></li>
            </ul>
          </li>
          <li class="dropdown">
            <a routerLink="/marketplace">Marketplaces ▾</a>
            <ul class="dropdown-menu">
              <li><a routerLink="/marketplace" (click)="closeMenu()">Véhicules & Engins</a></li>
              <li><a routerLink="/marketplace" (click)="closeMenu()">Commissionnaires</a></li>
              <li><a routerLink="/marketplace" (click)="closeMenu()">Manutention</a></li>
              <li><a routerLink="/marketplace" (click)="closeMenu()">Fournisseurs d'Equipements</a></li>
              <li><a routerLink="/marketplace" (click)="closeMenu()">Autre Services</a></li>
            </ul>
          </li>
          <li class="dropdown">
            <a href="javascript:void(0)">Annuaires Pro ▾</a>
            <ul class="dropdown-menu">
              <li><a href="javascript:void(0)" (click)="closeMenu()">Transporteurs</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Stages & Alternance</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Gestionnaires d'Entrepôts</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Formations Certifiantes</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Livres & Multimédia</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Organismes de Formation</a></li>
            </ul>
          </li>
          <li class="dropdown">
            <a href="javascript:void(0)">Emploi & Formation ▾</a>
            <ul class="dropdown-menu">
              <li><a href="javascript:void(0)" (click)="closeMenu()">Offres d'Emploi</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Salons & Webinaires</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Événements Membres</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Sorties Culturelles</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Annonces</a></li>
            </ul>
          </li>
          <li class="dropdown">
            <a href="javascript:void(0)">Actus & Infos ▾</a>
            <ul class="dropdown-menu">
              <li><a href="javascript:void(0)" (click)="closeMenu()">Presse Spécialisée</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Textes de Loi</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Statistiques</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Témoignages</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Démarches Administratives</a></li>
              <li><a href="javascript:void(0)" (click)="closeMenu()">Blog & Sondages</a></li>
            </ul>
          </li>
          <li><a routerLink="/forum" (click)="closeMenu()">Forum</a></li>
          <li><a routerLink="/eguichet" class="highlight-link" (click)="closeMenu()">E-Guichet</a></li>
        </ul>

        <div class="nav-actions" [class.active]="menuOpen">
          <a routerLink="/login" class="btn btn-outline" (click)="closeMenu()">Connexion</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    #main-nav {
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 1000;
        padding: 1rem 0;
        transition: all 0.4s ease;
        background: var(--white);
        box-shadow: var(--shadow);
    }
    
    /* When user scrolls, you can add a 'scrolled' class via TS. Here it's default to glass */
    #main-nav.scrolled {
        background: var(--glass);
        backdrop-filter: blur(10px);
        padding: 0.5rem 0;
    }
    
    .nav-container {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 2rem;
    }
    
    .logo {
        display: flex;
        flex-direction: column;
        line-height: 1;
        text-decoration: none;
    }
    
    .logo-text {
        font-size: 1.8rem;
        font-weight: 900;
        letter-spacing: -1px;
        color: var(--dark);
    }
    
    .logo-text span {
        color: var(--primary);
    }
    
    .logo-sub {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary);
        margin-top: -2px;
    }
    
    .nav-links {
        display: flex;
        gap: 1.5rem;
        list-style: none;
        margin: 0;
        padding: 0;
        align-items: center;
    }
    
    .nav-links > li > a {
        font-weight: 600;
        font-size: 0.85rem;
        position: relative;
        color: var(--dark);
        text-decoration: none;
        padding: 0.5rem 0;
    }
    
    .nav-links > li > a::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--primary);
        transition: width 0.3s ease;
    }
    
    .nav-links > li > a:hover::after, .nav-links > li > a.active::after {
        width: 100%;
    }
    
    .dropdown {
        position: relative;
    }
    
    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background: var(--white);
        min-width: 250px;
        box-shadow: var(--shadow-lg);
        border-radius: 12px;
        padding: 1rem 0;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px);
        transition: all 0.3s ease;
        z-index: 1001;
        border: 1px solid rgba(0, 0, 0, 0.05);
        list-style: none;
    }
    
    .dropdown:hover .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-menu li a {
        padding: 0.6rem 1.5rem;
        display: block;
        font-size: 0.85rem;
        color: var(--dark);
        font-weight: 500;
        text-decoration: none;
        transition: all 0.2s ease;
    }
    
    .dropdown-menu li a:hover {
        background: var(--light);
        color: var(--primary);
        padding-left: 1.8rem;
    }
    
    .highlight-link {
        color: var(--primary) !important;
        font-weight: 800 !important;
        background: rgba(0,102,255,0.1);
        padding: 0.4rem 1rem !important;
        border-radius: 20px;
    }
    
    .nav-actions {
        display: flex;
        gap: 1rem;
    }
    
    .btn {
        padding: 0.6rem 1.4rem;
        border-radius: 50px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        font-size: 0.9rem;
        text-decoration: none;
    }
    
    .btn-primary {
        background: var(--primary);
        color: var(--white);
    }
    
    .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 102, 255, 0.3);
    }
    
    .btn-outline {
        background: transparent;
        border: 2px solid var(--primary);
        color: var(--primary);
    }
    
    .btn-outline:hover {
        background: var(--primary);
        color: var(--white);
    }
    
    .mobile-toggle {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
    }
    
    .bar {
        width: 25px;
        height: 3px;
        background: var(--dark);
        border-radius: 3px;
        transition: 0.3s;
    }
    
    @media (max-width: 1100px) {
        .mobile-toggle {
            display: flex;
        }
        .nav-links, .nav-actions {
            display: none;
        }
        .nav-links.active, .nav-actions.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: var(--white);
            box-shadow: var(--shadow-lg);
            padding: 1.5rem;
            align-items: flex-start;
        }
        .dropdown-menu {
            position: static;
            opacity: 1;
            visibility: visible;
            transform: none;
            box-shadow: none;
            border: none;
            padding-left: 1rem;
            display: none;
        }
        .dropdown:hover .dropdown-menu {
            display: block;
        }
    }
  `]
})
export class NavbarComponent {
  menuOpen = false;
  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  
  closeMenu() {
    this.menuOpen = false;
  }
}

