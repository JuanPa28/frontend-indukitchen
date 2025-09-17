import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockAuth = {} as Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Auth, useValue: mockAuth }],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created and keep injected auth (constructor)', () => {
    expect(service).toBeTruthy();
    expect((service as any).auth).toBe(mockAuth);
  });

  it('register should call createUserWithEmail and resolve value', async () => {
    const email = 'test@example.com';
    const password = 'secret123';
    const mockCredential = { user: { uid: 'uid-1' } } as any;

    spyOn(service as any, 'createUserWithEmail').and.returnValue(Promise.resolve(mockCredential));

    const result = await service.register(email, password);
    expect((service as any).createUserWithEmail).toHaveBeenCalledWith(email, password);
    expect(result).toBe(mockCredential);
  });

  it('createUserWithEmail should delegate to firebaseCreateUser and return its result', async () => {
    const email = 'x@y.com';
    const password = 'pw123';
    const mockCredential = { user: { uid: 'u-1' } } as any;

    spyOn(service as any, 'firebaseCreateUser').and.returnValue(Promise.resolve(mockCredential));

    const result = await (service as any).createUserWithEmail(email, password);
    expect((service as any).firebaseCreateUser).toHaveBeenCalledWith(mockAuth, email, password);
    expect(result).toBe(mockCredential);
  });

  it('register should propagate rejection', async () => {
    const err = new Error('create failed');
    spyOn(service as any, 'createUserWithEmail').and.returnValue(Promise.reject(err));

    await service.register('a@b.com', 'pw').then(
      () => fail('expected promise to reject'),
      (e) => expect(e).toBe(err)
    );
  });
});
