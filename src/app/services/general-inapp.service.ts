import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { GeoLoc } from '../models/GeoLoc';
import { SimpleMessage } from '../models/SimpleMessage';

@Injectable({
  providedIn: 'root'
})
export class GeneralInappService {
  locations: ReplaySubject<GeoLoc>;
  messages: ReplaySubject<SimpleMessage>;

  constructor() {
    this.locations = new ReplaySubject<GeoLoc>(undefined);
    this.messages = new ReplaySubject<SimpleMessage>(undefined);
  }

  addNewLoc(loc: GeoLoc): any {
    console.log('[INFO] New loc sent to list...');
    this.locations.next(loc);
  }

  addNewMsg(msg: SimpleMessage): any {
    console.log('[INFO] New msg sent to list...');
    this.messages.next(msg);
  }
}
