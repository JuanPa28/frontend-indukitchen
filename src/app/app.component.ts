// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { Auth, onAuthStateChanged, User, signOut } from '@angular/fire/auth';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend-indukitchen';
  isLoggedIn = signal(false);

  constructor(private readonly auth: Auth, private readonly router: Router) {
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.isLoggedIn.set(!!user);
    });
  }

  logout(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }
}