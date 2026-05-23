import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { MarketplaceComponent } from './components/marketplace/marketplace';
import { BoursesComponent } from './components/bourses/bourses';
import { AboutComponent } from './components/about/about';
import { HelpComponent } from './components/help/help';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'help', component: HelpComponent },
  { path: 'marketplace', component: MarketplaceComponent },
  { path: 'bourses', component: BoursesComponent },
  { path: 'eguichet', component: HomeComponent }, // Placeholder redirect to home for now
  { path: 'forum', component: HomeComponent },    // Placeholder redirect to home for now
  { path: 'contact', component: HomeComponent },  // Placeholder redirect to home for now
  { path: 'login', component: HomeComponent },    // Placeholder redirect to home for now
  { path: '**', redirectTo: '' }
];
