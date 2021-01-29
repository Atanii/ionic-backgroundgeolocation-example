import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import {
  BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationEvents, BackgroundGeolocationProvider, BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation/ngx';
import { InAppLocationProviderService } from './services/in-app-location-provider.service';
import { GeoLoc } from './models/GeoLoc';

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
    private locService: InAppLocationProviderService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.initAndStartGeoloc();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }

  private initAndStartGeoloc(): any {
    const config: BackgroundGeolocationConfig = {
      locationProvider: 0, // BackgroundGeolocationProvider.ANDROID_DISTANCE_FILTER_PROVIDER,
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      interval: 30000,
      debug: false, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: false, // enable this to clear background location settings when the app terminates
    };

    this.backgroundGeolocation.configure(config)
      .then(() => {
        // start recording location
        this.backgroundGeolocation.start();

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.location).subscribe(
          (location: BackgroundGeolocationResponse) => {
            console.log("Location updated, new location: ", location.time, ", ", location.longitude, ", ", location.latitude);
            this.locService.addNewLoc({
              time: location.time,
              longitude: location.longitude,
              latitude: location.latitude
            } as GeoLoc)
          }
        )

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.stationary).subscribe(
          (location: BackgroundGeolocationResponse) => {
            console.log("Stationary Location updated, new location: ", location.time, ", ", location.longitude, ", ", location.latitude);
            this.locService.addNewLoc({
              time: location.time,
              longitude: location.longitude,
              latitude: location.latitude
            } as GeoLoc)
          }
        )

        this.backgroundGeolocation.on(BackgroundGeolocationEvents.error).subscribe(err => {
          console.log("Error: ", err);

          // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
          // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
          // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
          this.backgroundGeolocation.finish(); // FOR IOS ONLY
        });
      });

    // If you wish to turn OFF background-tracking, call the #stop method.
    // this.backgroundGeolocation.stop();
  }
}
