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

  public previousLocation: GeoLoc;
  public previousStatinoaryLocation: GeoLoc;
  
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
    
    interval: 10000,
    fastestInterval: 10000,
    
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

      this.setBg = true;
      this.setBgGeoLoc = true;
      this.setPOST = true;
      this.setLog = false;
      this.setMiscLog = false;
      this.setGeoLog = true;
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

  public getDistanceFromLatLonInKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const earthR = 6371; // in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = earthR * c; // distance in km
    return d;
  }

  public toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  private initAndConfigureBgGeoLoc(): any {
    this.backgroundGeolocation.configure(this.config)
      .then(() => {
        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.background)
        //   .pipe(
        //     tap(() => console.log("[INFO] Background mode")),
        //     filter(() => this.setLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'Background mode'
        //       } as SimpleMessage);
        //     }
        //   );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location)
          .pipe(
            tap(loc => console.log('[INFO][BackgroundGeolocationEvents.location] Location updated, new location:', JSON.stringify(loc)))
          )
          .subscribe(
            location => {
              if (this.setGeoLog) {
                const tmp = {
                  pluginTime: new Date(location.time),
                  appTime: new Date(),
                  longitude: location.longitude,
                  latitude: location.latitude
                } as GeoLoc;

                this.locService.addNewLoc(tmp);

                if (this.previousLocation) {
                  const dist = this.getDistanceFromLatLonInKm(
                    tmp.longitude, tmp.latitude,
                    this.previousLocation.longitude, this.previousLocation.latitude
                  );
                  this.locService.addNewMsg({
                    pluginTime: new Date(location.time),
                    appTime: new Date(),
                    content: `Dist: ${dist}`
                  } as SimpleMessage);
                }

                this.previousLocation = tmp;
              }
            }
          );

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stationary)
          .pipe(
            tap(loc => console.log('Stationary location updated, new location:', JSON.stringify(loc)))
          )
          .subscribe(
            location => {
              if (this.setGeoLog) {
                const tmp = {
                  pluginTime: new Date(location.time),
                  appTime: new Date(),
                  longitude: location.longitude,
                  latitude: location.latitude
                } as GeoLoc;

                this.locService.addNewLoc(tmp);

                if (this.previousStatinoaryLocation) {
                  const dist = this.getDistanceFromLatLonInKm(
                    tmp.longitude, tmp.latitude,
                    this.previousStatinoaryLocation.longitude, this.previousStatinoaryLocation.latitude
                  );
                  this.locService.addNewMsg({
                    pluginTime: new Date(location.time),
                    appTime: new Date(),
                    content: `Stationary dist: ${dist}`
                  } as SimpleMessage);
                }

                this.previousStatinoaryLocation = tmp;
              }
            }
          );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.error)
        //   .pipe(
        //     map(error => `Error: ${JSON.stringify(error)}`),
        //     tap(error => console.error('[ERROR]', error)),
        //     filter(_ => this.setErrorLog)
        //   )
        //   .subscribe(
        //     error => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: error
        //       } as SimpleMessage);
            
        //       // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
        //       // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
        //       // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
        //       // this.backgroundGeolocation.finish(); // FOR IOS ONLY
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.start)
        //   .pipe(
        //     tap(() => console.log('[INFO] BackgroundGeolocation service has been started')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'BackgroundGeolocation service has been started'
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.stop)
        //   .pipe(
        //     tap(() => console.log('[INFO] BackgroundGeolocation service has been stopped')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'BackgroundGeolocation service has been stopped'
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.authorization)
        //   .pipe(
        //     tap(status => console.log('[INFO] BackgroundGeolocation authorization status:', JSON.stringify(status))),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     status => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(status.time),
        //         appTime: new Date(),
        //         content: `BackgroundGeolocation authorization status: ${JSON.stringify(status)}`
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.foreground)
        //   .pipe(
        //     tap(() => console.log('[INFO] Foreground mode')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'Foreground mode'
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.activity)
        //   .pipe(
        //     tap(() => console.log('[INFO] Activity')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'Activity'
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.http_authorization)
        //   .pipe(
        //     tap(() => console.log('[INFO] HTTP Authorization')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'HTTP Authorization'
        //       } as SimpleMessage);
        //     }
        //   );

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.abort_requested)
        //   .pipe(
        //     tap(() => console.log('[INFO] Abort Requested')),
        //     filter(() => this.setMiscLog)
        //   )
        //   .subscribe(
        //     () => {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'Abort Requested'
        //       } as SimpleMessage);
        //     }
        //   );

    });
  }
}
