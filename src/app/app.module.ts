import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
import { GeneralInappService } from './services/general-inapp.service';

import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { PowerManagement } from '@ionic-native/power-management/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { FormsModule } from '@angular/forms';
import { Geofence } from '@ionic-native/geofence/ngx';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    BackgroundGeolocation,
    GeneralInappService,
    BackgroundMode,
    HTTP,
    PowerManagement,
    Geofence
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
