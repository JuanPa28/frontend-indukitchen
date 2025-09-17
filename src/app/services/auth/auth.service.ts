import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly auth: Auth) {}

  protected firebaseCreateUser = createUserWithEmailAndPassword;

  protected createUserWithEmail(email: string, password: string) {
    return this.firebaseCreateUser(this.auth, email, password);
  }

  register(email: string, password: string) {
    return this.createUserWithEmail(email, password);
  }
}
