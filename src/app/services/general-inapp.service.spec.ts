import { TestBed } from '@angular/core/testing';

import { GeneralInappService } from './general-inapp.service';

describe('InAppLocationProviderService', () => {
  let service: GeneralInappService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneralInappService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
