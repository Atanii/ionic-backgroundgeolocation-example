import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GeoLoc } from '../models/GeoLoc';
import { SimpleMessage } from '../models/SimpleMessage';

@Injectable({
  providedIn: 'root'
})
export class GeneralInappService {
  locations: BehaviorSubject<GeoLoc>;
  messages: BehaviorSubject<SimpleMessage>;

  constructor() {
    this.locations = new BehaviorSubject<GeoLoc>(undefined);
    this.messages = new BehaviorSubject<SimpleMessage>(undefined);
  }

  addNewLoc(loc: GeoLoc): any {
    this.locations.next(loc);
  }

  addNewMsg(msg: SimpleMessage): any {
    this.messages.next(msg);
  }
}
