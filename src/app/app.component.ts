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
import { PowerManagement } from '@ionic-native/power-management/ngx';
import { Geofence } from '@ionic-native/geofence/ngx';

const { Geolocation } = Plugins;

interface GeofenceObject {
  id: string,
  latitude: number,
  longitude: number,
  radius: number,
  transitionType: 1 | 2 | 3,
  notification?: object
}

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

  readonly watchedGeofence: GeofenceObject = {
    id: 'teszt-geofence',
    latitude: 0,
    longitude: 0,
    radius: 100,
    transitionType: 2
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
    private backgroundMode: BackgroundMode,
    private powerManagement: PowerManagement,
    private geofence: Geofence
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

  onWakelockSettingsUpdated() {
    // Aquire
    if (this.setWakelock) {
      this.powerManagement.acquire()
        .then(res => {
          console.log('[INFO][POWER] Wakelock acquired: ', res);
        })
        .catch(err => {
          console.log('[INFO][POWER] Failed to acquire wakelock: ', err);
        });

      this.powerManagement.setReleaseOnPause(false).then(
        _ => {
          console.log('setReleaseOnPause successfully');
        },
        () => {
          console.log('Failed to set');
        }
      );

      // CRASHES APPLICATION AFTER A FEW SEC
      // this.powerManagement.dim().then(
      //   _ => {
      //     console.log('Wakelock acquired');
      //   },
      //   err => {
      //     console.log('Failed to acquire wakelock: ', err);
      //   }
      // );
    }
    // Release
    else {
      this.powerManagement.release()
      .then(res => {
          console.log('[INFO][POWER] Wakelock release: ', res);
        })
      .catch(err => {
          console.log('[INFO][POWER] Failed to release wakelock: ', err);
      });
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
      // this.initAndConfigureGeofencing();

      this.onBgModeSettingUpdated();
      this.onWakelockSettingsUpdated();
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
              // this.backgroundGeolocation.finish();
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

        // this.backgroundGeolocation.headlessTask(function (event) {
        //   if (event.name === 'location' ||
        //       event.name === 'stationary') {
        //     console.log("[INFO] TASK: ", event);

        //     ///////////////////////////////////////// POST
        //     if (this.setPOST) {
        //       this.locService.postData(event.params);
        //     }

        //     if (this.setLog) {
        //       this.locService.addNewMsg({
        //         pluginTime: new Date(),
        //         appTime: new Date(),
        //         content: 'Headless: ' + JSON.stringify(event.params)
        //       } as SimpleMessage
        //       );
        //     }
        //   }

        //   return 'Processing event: ' + event.name; // will be logged
        // });

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

        //   this.backgroundGeolocation.getStationaryLocation().then(res => {
        //     if (res && res.longitude !== undefined) {
        //       const stats = `[INFO][TIMER] getStationaryLocation(),\n time: ${new Date(res.time)}, appTime: ${new Date()},\n long: ${res.longitude}, lat: ${res.latitude}`
        //       console.log(stats);

        //       if (this.setGeoLog) {
        //         this.locService.addNewLoc({
        //           pluginTime: new Date(res.time),
        //           appTime: new Date(),
        //           longitude: res.longitude,
        //           latitude: res.latitude
        //         } as GeoLoc);
        //       }

        //       if (this.setLog) {
        //         this.locService.addNewMsg({
        //           pluginTime: new Date(res.time),
        //           appTime: new Date(),
        //           content: stats
        //         } as SimpleMessage);
        //       }

        //       ///////////////////////////////////////// POST
        //       // this.locService.postNewLocation({
        //       //   pluginTime: new Date(res.time),
        //       //   appTime: new Date(),
        //       //   longitude: res.longitude,
        //       //   latitude: res.latitude,
        //       //   msg: 'timer -> stationarylocation'
        //       // } as GeoLoc);
        //     }
        //   })

        // });

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

  private initAndConfigureGeofencing() {
    this.backgroundMode.on('activate')
      .subscribe(
        () => {
          // ELSZÁLL, MERT HIBÁS A PLUGIN EZEN RÉSZE
          // this.backgroundMode.disableWebViewOptimizations();
        }
      )

    // Geolocation.getCurrentPosition({
    //   enableHighAccuracy: true,
    //   timeout: 5000
    // }).then(loc => {
    //   console.log("[INFO] Location:", JSON.stringify(loc));
    // }).catch(err => {
    //   console.error("[ERROR] Error:", JSON.stringify(err));
    // });

    // Geolocation.watchPosition({
    //   enableHighAccuracy: true,
    //   timeout: 5000
    // }, loc => {
    //   console.log('[INFO] Background mode:', this.backgroundMode.isEnabled(), this.backgroundMode.isActive());
    //   console.log('[INFO] Location:', JSON.stringify(loc));
    // });

    Geolocation.getCurrentPosition(this.geolocationConfig).then(pos => {
      this.geofence.initialize()
        .then(() => console.log('[INFO] Geofence plugin ready'))
        .then(() => {
          this.geofence.remove(this.watchedGeofence.id);
          this.geofence.addOrUpdate({
            ...this.watchedGeofence,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          } as GeofenceObject)
          .then(() => console.log('[INFO] Geofence added'))
          .then(() => {
            if (this.setLog) {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: '[INFO] Geofence added'
              } as SimpleMessage);
            }
          })
          .catch(reason => console.error('[ERROR] Geofence add error:', JSON.stringify(reason)));
        })
        .catch(err => {
          console.error('[ERROR] Geofence plugin error:', JSON.stringify(err));
          if (this.setErrorLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: `[ERROR] Geofence plugin error: ${JSON.stringify(err)}`
            } as SimpleMessage);
          }
        });

      this.geofence.onTransitionReceived()
        .pipe(
          tap(res => console.log('[INFO] Geofencing transition received:', JSON.stringify(res))),
          tap(res => {
            if (this.setLog) {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: `[INFO] Geofencing transition received: ${JSON.stringify(res)}`
              } as SimpleMessage);
            }
          })
        )
        .subscribe(
          res => {
            Geolocation.getCurrentPosition(this.geolocationConfig).then(newPos => {
              this.geofence.addOrUpdate({
                ...this.watchedGeofence,
                latitude: newPos.coords.latitude,
                longitude: newPos.coords.longitude
              } as GeofenceObject);
            });
          }
        );
    }).catch(err => console.error('[ERROR] Initial geolocation:', JSON.stringify(err)));
  }
}
