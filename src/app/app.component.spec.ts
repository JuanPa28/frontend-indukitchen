import { Auth } from '@angular/fire/auth';
import { User } from '@firebase/auth-types';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const mockRouter: any = { navigate: jasmine.createSpy('navigate') };
  const mockAuth = {} as Auth;

  afterEach(() => {});

  it('constructor should set isLoggedIn true when user present', () => {
    const onAuthSpy = spyOn(AppComponent.prototype as any, 'onAuthStateChangedFn').and.callFake(
      (_auth: Auth, cb: (u: User | null) => void) => {
        cb({} as User);
        return () => {};
      }
    );

    const comp = new AppComponent(mockAuth, mockRouter);
    expect(comp.isLoggedIn()).toBeTrue();
    expect(onAuthSpy).toHaveBeenCalledWith(mockAuth, jasmine.any(Function));
  });

  it('constructor should set isLoggedIn false when no user', () => {
    const onAuthSpy = spyOn(AppComponent.prototype as any, 'onAuthStateChangedFn').and.callFake(
      (_auth: Auth, cb: (u: User | null) => void) => {
        cb(null);
        return () => {};
      }
    );

    const comp = new AppComponent(mockAuth, mockRouter);
    expect(comp.isLoggedIn()).toBeFalse();
    expect(onAuthSpy).toHaveBeenCalledWith(mockAuth, jasmine.any(Function));
  });

  it('logout should call doSignOut and navigate to /login', async () => {
    const doSignOutSpy = spyOn(AppComponent.prototype as any, 'signOutFn').and.returnValue(
      Promise.resolve()
    );
    const onAuthSpy = spyOn(AppComponent.prototype as any, 'onAuthStateChangedFn').and.callFake(
      () => () => {}
    );

    const comp = new AppComponent(mockAuth, mockRouter);
    comp.logout();
    await Promise.resolve();

    expect(doSignOutSpy).toHaveBeenCalledWith(mockAuth);
    expect(onAuthSpy).toHaveBeenCalledWith(mockAuth, jasmine.any(Function));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
