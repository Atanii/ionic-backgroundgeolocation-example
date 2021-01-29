import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GeoLoc } from '../models/GeoLoc';
import { InAppLocationProviderService } from '../services/in-app-location-provider.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss']
})
export class FolderPage implements OnInit {
  public folder: string;
  public locations: GeoLoc[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private locService: InAppLocationProviderService,
    private chRef: ChangeDetectorRef) {
      this.locations = [];
      this.locService.locations.subscribe(loc => {
        if (loc) {
          console.log("New loc received: ", loc.latitude, ", ", loc.longitude, ", ", loc.time);
          this.locations.push(loc);
          // to trigger changedetection
          // this.locations = [].concat(this.locations);
          this.chRef.detectChanges();
        }
      })
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');
  }

}
