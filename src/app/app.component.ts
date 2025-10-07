import { Component, signal } from '@angular/core';
import { Auth, onAuthStateChanged, User, signOut } from '@angular/fire/auth';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend-indukitchen';
  isLoggedIn = signal(false);
  isAdminRoute = false;

  constructor(private readonly auth: Auth, private readonly router: Router) {
    this.watchAuthState(this.auth, (user: User | null) => {
      this.isLoggedIn.set(!!user);
    });

    const currentUrl =
      typeof (this.router as any)?.url === 'string' ? (this.router as any).url : '';
    this.isAdminRoute = currentUrl.startsWith('/admin');

    const events$ = (this.router as any)?.events;
    if (events$ && typeof events$.pipe === 'function') {
      events$
        .pipe(filter((e: any): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => {
          let url = '';
          if (typeof e.urlAfterRedirects === 'string') {
            url = e.urlAfterRedirects;
          } else if (typeof e.url === 'string') {
            url = e.url;
          }
          this.isAdminRoute = url.startsWith('/admin');
        });
    }
  }

  protected onAuthStateChangedFn(auth: Auth, cb: (user: User | null) => void) {
    return onAuthStateChanged(auth, cb);
  }

  protected watchAuthState(auth: Auth, cb: (user: User | null) => void) {
    return this.onAuthStateChangedFn(auth, cb);
  }

  protected signOutFn(auth: Auth) {
    return signOut(auth);
  }

  protected doSignOut(auth: Auth) {
    return this.signOutFn(auth);
  }

  logout(): void {
    this.doSignOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }
}
