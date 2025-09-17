import { Component, signal } from '@angular/core';
import { Auth, onAuthStateChanged, User, signOut } from '@angular/fire/auth';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(private readonly auth: Auth, private readonly router: Router) {
    this.watchAuthState(this.auth, (user: User | null) => {
      this.isLoggedIn.set(!!user);
    });
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
