import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GeoLoc } from '../models/GeoLoc';
import { SimpleMessage } from '../models/SimpleMessage';
import { GeneralInappService } from '../services/general-inapp.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss']
})
export class FolderPage implements OnInit {
  public folder: string;
  public locations: GeoLoc[];
  public messages: SimpleMessage[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private generalService: GeneralInappService,
    private chRef: ChangeDetectorRef) {
    this.locations = [];
    this.messages = [];
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');
    this.generalService.locations.subscribe(loc => {
      if (loc) {
        console.log("[INFO] New loc received: ", loc.latitude, ", ", loc.longitude, ", ", loc.appTime, ", ", loc.pluginTime);
        this.locations.push(loc);
        // to trigger changedetection
        // this.locations = [].concat(this.locations);
        this.chRef.detectChanges();
      }
    });
    this.generalService.messages.subscribe(msg => {
      if (msg) {
        console.log("[INFO] New msg received: ", msg.content, ", ", msg.appTime, ", ", msg.pluginTime);
        this.messages.push(msg);
        this.chRef.detectChanges();
      }
    });
  }

}
