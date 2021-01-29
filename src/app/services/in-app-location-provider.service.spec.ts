import { TestBed } from '@angular/core/testing';

import { InAppLocationProviderService } from './in-app-location-provider.service';

describe('InAppLocationProviderService', () => {
  let service: InAppLocationProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InAppLocationProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
