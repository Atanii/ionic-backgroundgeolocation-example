import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoLoc } from '../models/GeoLoc';

@Injectable({
  providedIn: 'root'
})
export class InAppLocationProviderService {
  locations: BehaviorSubject<GeoLoc>;

  constructor() {
    this.locations = new BehaviorSubject<GeoLoc>(undefined);
  }

  addNewLoc(loc: GeoLoc): any {
    this.locations.next(loc);
  }
}
