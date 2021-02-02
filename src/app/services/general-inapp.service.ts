import { Injectable } from '@angular/core';
import { HTTP, HTTPResponse } from '@ionic-native/http/ngx';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { GeoLoc } from '../models/GeoLoc';
import { SimpleMessage } from '../models/SimpleMessage';

@Injectable({
  providedIn: 'root'
})
export class GeneralInappService {
  public readonly URL = ""; // PLACE YOUR BACKEND URL HERE

  locations: ReplaySubject<GeoLoc>;
  messages: ReplaySubject<SimpleMessage>;

  constructor(private ionicHttp: HTTP) {
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

  postNewLocation(pos: GeoLoc): Promise<HTTPResponse> {
    const requestUrl = this.URL;
    this.ionicHttp.setDataSerializer('utf8');
    return this.ionicHttp.post(requestUrl, JSON.stringify(pos), {
      'Content-Type': 'application/json; charset=utf-8'
    });
  }

  postData(pos: any): Promise<HTTPResponse> {
    const requestUrl = this.URL;
    this.ionicHttp.setDataSerializer('utf8');
    return this.ionicHttp.post(requestUrl, JSON.stringify(pos), {
      'Content-Type': 'application/json; charset=utf-8'
    });
  }
}
