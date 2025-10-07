import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const ADMIN_EMAIL = 'crud@crud.crud';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const email = (auth.currentUser?.email || '').toLowerCase();

  if (email === ADMIN_EMAIL) return true;

  router.navigate(['/products']);
  return false;
};
