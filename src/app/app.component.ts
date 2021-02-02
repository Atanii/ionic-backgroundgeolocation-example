import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import {
  BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationEvents, BackgroundGeolocationProvider, BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation/ngx';
import { GeneralInappService } from './services/general-inapp.service';
import { GeoLoc } from './models/GeoLoc';
import { SimpleMessage } from './models/SimpleMessage';
import { timer } from 'rxjs';
import { TransitiveCompileNgModuleMetadata } from '@angular/compiler';

import { BackgroundMode } from '@ionic-native/background-mode/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Geolocation',
      url: '/folder/Geolocation',
      icon: 'map'
    }
  ];
  public labels = [
    'Geolocation', 'POC'
  ];

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

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
    this.initAndStartGeoloc();
    // this.backgroundMode.enable();
  }

  private initAndStartGeoloc(): any {
    /*
    ANDROID_DISTANCE_FILTER_PROVIDER = 0,
    ANDROID_ACTIVITY_PROVIDER = 1
    */
    const config: BackgroundGeolocationConfig = {
      // Ha nem az értékét írom be a ANDROID_DISTANCE_FILTER_PROVIDER-nek, akkor nem működik az app
      locationProvider: 1, // BackgroundGeolocationProvider.ANDROID_DISTANCE_FILTER_PROVIDER,
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      interval: 4900,
      startForeground: true,
      stopOnStillActivity: false,
      debug: false, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: false, // enable this to clear background location settings when the app terminates
    };

    this.backgroundGeolocation.configure(config)
      .then(() => {

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.background).subscribe(() => {
            console.log("[INFO] Background mode");
            this.locService.addNewMsg({
              pluginTime: new Date(),
              appTime: new Date(),
              content: 'Background mode'
            } as SimpleMessage);
          }
        )

        // this.backgroundGeolocation.on(BackgroundGeolocationEvents.location).subscribe(
        //   (location: BackgroundGeolocationResponse) => {
        //     console.log('Location updated, new location: ', new Date(location.time), ', ', new Date(), ', ', location.longitude, ', ', location.latitude);
        //     this.locService.addNewLoc({
        //       pluginTime: new Date(location.time),
        //       appTime: new Date(),
        //       longitude: location.longitude,
        //       latitude: location.latitude
        //     } as GeoLoc);
        //   }
        // )

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

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.error).subscribe(err => {
          const c = `Error: ${err}`;
          console.log(c);
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: c
          } as SimpleMessage);

          // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
          // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
          // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
          // this.backgroundGeolocation.finish(); // FOR IOS ONLY
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.start).subscribe(() => {
          console.log('[INFO] BackgroundGeolocation service has been started');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'BackgroundGeolocation service has been started'
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stop).subscribe(() => {
          console.log('[INFO] BackgroundGeolocation service has been stopped');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'BackgroundGeolocation service has been stopped'
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.authorization).subscribe(status => {
          console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
          this.locService.addNewMsg({
            pluginTime: new Date(status.time),
            appTime: new Date(),
            content: 'BackgroundGeolocation authorization status: ' + status
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.foreground).subscribe(() => {
          console.log('[INFO] Foreground mode');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'Foreground mode'
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.activity).subscribe(_ => {
          console.log('[INFO] Activity');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'Activity'
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.http_authorization).subscribe(() => {
          console.log('[INFO] HTTP Authorization');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'HTTP Authorization'
          } as SimpleMessage);
        });

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.abort_requested).subscribe(() => {
          console.log('[INFO] Abort Requested');
          this.locService.addNewMsg({
            pluginTime: new Date(),
            appTime: new Date(),
            content: 'Abort Requested'
          } as SimpleMessage);
        });

        timer(5000, 5000).subscribe(_ => {
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
              this.locService.addNewLoc({
                pluginTime: new Date(res.time),
                appTime: new Date(),
                longitude: res.longitude,
                latitude: res.latitude
              } as GeoLoc);
              this.locService.addNewMsg({
                pluginTime: new Date(res.time),
                appTime: new Date(),
                content: stats
              } as SimpleMessage);
            }
          })

          // GET STATIONARY
          this.backgroundGeolocation.getStationaryLocation().then(res => {
            if (res && res.longitude !== undefined) {
              const stats = `[INFO][TIMER] getStationaryLocation(),\n time: ${new Date(res.time)}, appTime: ${new Date()},\n long: ${res.longitude}, lat: ${res.latitude}`
              console.log(stats);
              this.locService.addNewLoc({
                pluginTime: new Date(res.time),
                appTime: new Date(),
                longitude: res.longitude,
                latitude: res.latitude
              } as GeoLoc);
              this.locService.addNewMsg({
                pluginTime: new Date(res.time),
                appTime: new Date(),
                content: stats
              } as SimpleMessage);
            }
          })

        });

    });

    // start recording location
    this.backgroundGeolocation.start();

    // If you wish to turn OFF background-tracking, call the #stop method.
    // this.backgroundGeolocation.stop();
  }
}
