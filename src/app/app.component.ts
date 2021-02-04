import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import {
  BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationEvents, BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation/ngx';
import { GeneralInappService } from './services/general-inapp.service';
import { GeoLoc } from './models/GeoLoc';
import { SimpleMessage } from './models/SimpleMessage';
import { timer } from 'rxjs';

import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import { PowerManagement } from '@ionic-native/power-management/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
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
    
    // INTERVAL
    interval: 4900,
    fastestInterval: 4900,
    
    // FG - BG
    startForeground: true,
    stopOnStillActivity: false,
    // Enable this to clear background location settings when the app terminates
    stopOnTerminate: false,
    
    // DEBUG
    // Enable this hear sounds for background-geolocation life-cycle
    debug: false,

    // STORING, SYNCING
    syncThreshold: 1,

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
    private powerManagement: PowerManagement
  ) {
    this.initializeApp();
  }

  onBgModeSettingUpdated($event?: any) {
    if (this.setBg) {
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

      this.setBg = true;
      this.setBgGeoLoc = true;
      this.setPOST = true;
      this.setLog = true;
      this.setMiscLog = true;
      this.setGeoLog = true;
      this.setErrorLog = true;
      this.setWakelock = true;

      this.onBgModeSettingUpdated();
      this.onWakelockSettingsUpdated();

      this.initAndConfigureBgGeoLoc();

      this.onBgGeoLocSettingsUpdated();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }

  private initAndConfigureBgGeoLoc(): any {
    this.backgroundGeolocation.configure(this.config)
      .then(() => {

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.background).subscribe(() => {
            console.log("[INFO] Background mode");
            if (this.setLog) {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Background mode'
              } as SimpleMessage);
            }
          }
        )

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location).subscribe(
          (location: BackgroundGeolocationResponse) => {
            console.log('[INFO][BackgroundGeolocationEvents.location] Location updated, new location: ', new Date(location.time), ', ', new Date(), ', ', location.longitude, ', ', location.latitude);

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
        )

        this.backgroundGeolocation.headlessTask(function (event) {
          if (event.name === 'location' ||
              event.name === 'stationary') {
            console.log("[INFO] TASK: ", event);

            ///////////////////////////////////////// POST
            if (this.setPOST) {
              this.locService.postData(event.params);
            }

            if (this.setLog) {
              this.locService.addNewMsg({
                pluginTime: new Date(),
                appTime: new Date(),
                content: 'Headless: ' + JSON.stringify(event.params)
              } as SimpleMessage
              );
            }
          }

          return 'Processing event: ' + event.name; // will be logged
        });

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.stationary).subscribe(
        //   (location: BackgroundGeolocationResponse) => {
        //     console.log('Stationary Location updated, new location: ', new Date(location.time), ', ', new Date(), ', ', location.longitude, ', ', location.latitude);
        //     this.locService.addNewLoc({
        //       pluginTime: new Date(location.time),
        //       appTime: new Date(),
        //       longitude: location.longitude,
        //       latitude: location.latitude
        //     } as GeoLoc);
        //   }
        // )

        timer(1000, 15000).subscribe(_ => {
          // CHECK STATUS
          // this.backgroundGeolocation.checkStatus().then(res => {
          //   const stats = `[INFO] Running: ${res.isRunning}, Auth: ${res.authorization}, Locservice: ${res.locationServicesEnabled}`;
          //   console.log(stats);
          //   this.locService.addNewMsg({
          //     pluginTime: new Date(),
          //     appTime: new Date(),
          //     content: stats
          //   } as SimpleMessage);
          // });

          // GET CURRENT LOC
          this.backgroundGeolocation.getCurrentLocation().then(res => {
            if (res && res.longitude !== undefined) {
              const stats = `[INFO][TIMER] getCurrentLocation(),\n time: ${new Date(res.time)}, appTime: ${new Date()},\n long: ${res.longitude}, lat: ${res.latitude}`
              console.log(stats);

              if (this.setGeoLog) {
                this.locService.addNewLoc({
                  pluginTime: new Date(res.time),
                  appTime: new Date(),
                  longitude: res.longitude,
                  latitude: res.latitude
                } as GeoLoc);
              }

              if (this.setLog) {
                this.locService.addNewMsg({
                  pluginTime: new Date(res.time),
                  appTime: new Date(),
                  content: stats
                } as SimpleMessage);
              }

              ///////////////////////////////////////// POST
              // this.locService.postNewLocation({
              //   pluginTime: new Date(res.time),
              //   appTime: new Date(),
              //   longitude: res.longitude,
              //   latitude: res.latitude,
              //   msg: 'timer -> location'
              // } as GeoLoc);
            }
          })

          // GET STATIONARY
          this.backgroundGeolocation.getStationaryLocation().then(res => {
            if (res && res.longitude !== undefined) {
              const stats = `[INFO][TIMER] getStationaryLocation(),\n time: ${new Date(res.time)}, appTime: ${new Date()},\n long: ${res.longitude}, lat: ${res.latitude}`
              console.log(stats);

              if (this.setGeoLog) {
                this.locService.addNewLoc({
                  pluginTime: new Date(res.time),
                  appTime: new Date(),
                  longitude: res.longitude,
                  latitude: res.latitude
                } as GeoLoc);
              }

              if (this.setLog) {
                this.locService.addNewMsg({
                  pluginTime: new Date(res.time),
                  appTime: new Date(),
                  content: stats
                } as SimpleMessage);
              }

              ///////////////////////////////////////// POST
              // this.locService.postNewLocation({
              //   pluginTime: new Date(res.time),
              //   appTime: new Date(),
              //   longitude: res.longitude,
              //   latitude: res.latitude,
              //   msg: 'timer -> stationarylocation'
              // } as GeoLoc);
            }
          })

        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.error).subscribe(err => {
          const c = `Error: ${err}`;
          console.log(c);

          if (this.setErrorLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: c
            } as SimpleMessage);
          }

          // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
          // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
          // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
          // this.backgroundGeolocation.finish(); // FOR IOS ONLY
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.start).subscribe(() => {
          console.log('[INFO] BackgroundGeolocation service has been started');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'BackgroundGeolocation service has been started'
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stop).subscribe(() => {
          console.log('[INFO] BackgroundGeolocation service has been stopped');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'BackgroundGeolocation service has been stopped'
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.authorization).subscribe(status => {
          console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(status.time),
              appTime: new Date(),
              content: 'BackgroundGeolocation authorization status: ' + status
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.foreground).subscribe(() => {
          console.log('[INFO] Foreground mode');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'Foreground mode'
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.activity).subscribe(_ => {
          console.log('[INFO] Activity');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'Activity'
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.http_authorization).subscribe(() => {
          console.log('[INFO] HTTP Authorization');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'HTTP Authorization'
            } as SimpleMessage);
          }
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.abort_requested).subscribe(() => {
          console.log('[INFO] Abort Requested');
          if (this.setMiscLog) {
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'Abort Requested'
            } as SimpleMessage);
          }
        });

    });
  }
}
