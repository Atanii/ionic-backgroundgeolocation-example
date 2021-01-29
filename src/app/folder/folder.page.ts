import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder: string;
  public locations;

  constructor(
    private activatedRoute: ActivatedRoute,
    private backgroundGeolocation: BackgroundGeolocation) {
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');
    this.getLocs();
  }

  private getLocs(): any {
    this.backgroundGeolocation.getLocations().then(
      res => {
        this.locations = res;
        console.log("Locations: ", this.locations);
      },
      err => {
        console.log("BackgroundGeolocationError: ", err);
      }
    )
  }

}
