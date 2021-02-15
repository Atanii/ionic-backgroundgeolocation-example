import { Component, OnDestroy, OnInit } from '@angular/core';
import { GeolocationOptions, Plugins } from '@capacitor/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import {
  BackgroundGeolocation, BackgroundGeolocationAccuracy, BackgroundGeolocationConfig, BackgroundGeolocationEvents
} from '@ionic-native/background-geolocation/ngx';
import { GeneralInappService } from './services/general-inapp.service';
import { GeoLoc } from './models/GeoLoc';
import { SimpleMessage } from './models/SimpleMessage';
import { filter, map, tap } from 'rxjs/operators';

import { BackgroundMode } from '@ionic-native/background-mode/ngx';

const { Geolocation } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Geolocation Logs',
      url: '/folder/Geolocation Logs',
      icon: 'map'
    }
  ];
  public labels = [
    'Geolocation', 'POC', 'Logs', 'Background'
  ];
  
  // BackgroundGeolocationProvider.ANDROID_DISTANCE_FILTER_PROVIDER = 0,
  // BackgroundGeolocationProvider.ANDROID_ACTIVITY_PROVIDER = 1
  readonly config: BackgroundGeolocationConfig = {
    // PROVIDER
    // Ha nem az értékét írom be a ANDROID_DISTANCE_FILTER_PROVIDER-nek, akkor nem működik az app
    locationProvider: 1,
    
    // ACCURACY
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    
    interval: 60000,
    fastestInterval: 60000,
    
    startForeground: true,
    stopOnStillActivity: false,
    // Enable this to clear background location settings when the app terminates
    stopOnTerminate: false,
    
    // DEBUG
    // Enable this hear sounds for background-geolocation life-cycle
    debug: false,

    // STORING, SYNCING
    syncThreshold: 10,

    // SERVER
    url: this.locService.URL,
    httpHeaders: {
      'Access-Control-Allow-Origin': '*'
    },
    // Customize post properties
    postTemplate: {
      latitude: '@latitude',
      longitude: '@longitude',
      timeInMs: '@time'
    }
  };

  readonly geolocationConfig: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 5000
  }

  setBg: boolean;
  setBgGeoLoc: boolean;
  setPOST: boolean;
  setLog: boolean;
  setMiscLog: boolean;
  setGeoLog: boolean;
  setErrorLog: boolean;
  setWakelock: boolean;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private backgroundGeolocation: BackgroundGeolocation,
    private locService: GeneralInappService,
    private backgroundMode: BackgroundMode
  ) {
    this.initializeApp();
  }

  onBgModeSettingUpdated($event?: any) {
    if (this.setBg) {
      this.backgroundMode.disableBatteryOptimizations();
      this.backgroundMode.enable();
    } else {
      this.backgroundMode.disable();
    }
  }

  onBgGeoLocSettingsUpdated() {
    if (this.setBgGeoLoc) {
      // start recording location
      this.backgroundGeolocation.start();
    } else {
      // If you wish to turn OFF background-tracking, call the #stop method.
      this.backgroundGeolocation.stop();
    }
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.setBg = false;
      this.setBgGeoLoc = false;
      this.setPOST = false;
      this.setLog = false;
      this.setMiscLog = false;
      this.setGeoLog = false;
      this.setErrorLog = false;
      this.setWakelock = false;

      this.initAndConfigureBgGeoLoc();

      this.onBgModeSettingUpdated();
      this.onBgGeoLocSettingsUpdated();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }

  ngOnDestroy() {
    console.log('[INFO] AppComponent destroyed')
  }

  private initAndConfigureBgGeoLoc(): any {
    this.backgroundGeolocation.configure(this.config)
      .then(() => {
        this.backgroundGeolocation.on(BackgroundGeolocationEvents.background)
          .pipe(
            tap(() => console.log("[INFO] Background mode")),
            filter(() => this.setLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Background mode'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location)
          .pipe(
            tap(loc => console.log('[INFO][BackgroundGeolocationEvents.location] Location updated, new location:', JSON.stringify(loc)))
          )
          .subscribe(
            location => {
              if (this.setGeoLog) {
                this.locService.addNewLoc({
                  pluginTime: new Date(location.time),
                  appTime: new Date(),
                  longitude: location.longitude,
                  latitude: location.latitude
                } as GeoLoc);
              }

              if (this.setLog) {
                this.locService.addNewMsg({
                  pluginTime: new Date(location.time),
                  appTime: new Date(),
                  content: '[INFO][BackgroundGeolocationEvents.location] Location updated'
                } as SimpleMessage);
              }

              ///////////////////////////////////////// POST
              // this.locService.postNewLocation({
              //   pluginTime: new Date(location.time),
              //   appTime: new Date(),
              //   longitude: location.longitude,
              //   latitude: location.latitude,
              //   msg: 'BackgroundGeolocationEvents.location'
              // } as GeoLoc);

              // this.backgroundGeolocation.finish();
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stationary)
          .pipe(
            tap(loc => console.log('Stationary location updated, new location:', JSON.stringify(loc)))
          )
          .subscribe(
            location => {
              if (this.setGeoLog) {
                this.locService.addNewLoc({
                  pluginTime: new Date(location.time),
                  appTime: new Date(),
                  longitude: location.longitude,
                  latitude: location.latitude
                } as GeoLoc);
              }
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.error)
          .pipe(
            map(error => `Error: ${JSON.stringify(error)}`),
            tap(error => console.error('[ERROR]', error)),
            filter(_ => this.setErrorLog)
          )
          .subscribe(
            error => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: error
              } as SimpleMessage);
            
              // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
              // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
              // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
              // this.backgroundGeolocation.finish(); // FOR IOS ONLY
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.start)
          .pipe(
            tap(() => console.log('[INFO] BackgroundGeolocation service has been started')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'BackgroundGeolocation service has been started'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stop)
          .pipe(
            tap(() => console.log('[INFO] BackgroundGeolocation service has been stopped')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'BackgroundGeolocation service has been stopped'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.authorization)
          .pipe(
            tap(status => console.log('[INFO] BackgroundGeolocation authorization status:', JSON.stringify(status))),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            status => {
              this.locService.addNewMsg({
                pluginTime: new Date(status.time),
                appTime: new Date(),
                content: `BackgroundGeolocation authorization status: ${JSON.stringify(status)}`
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.foreground)
          .pipe(
            tap(() => console.log('[INFO] Foreground mode')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Foreground mode'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.activity)
          .pipe(
            tap(() => console.log('[INFO] Activity')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Activity'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.http_authorization)
          .pipe(
            tap(() => console.log('[INFO] HTTP Authorization')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'HTTP Authorization'
              } as SimpleMessage);
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.abort_requested)
          .pipe(
            tap(() => console.log('[INFO] Abort Requested')),
            filter(() => this.setMiscLog)
          )
          .subscribe(
            () => {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Abort Requested'
              } as SimpleMessage);
            }
          );

    });
  }
}
