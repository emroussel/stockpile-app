import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Toast } from '@ionic-native/toast';

@Injectable()
export class IonicPlugins {

  constructor(public platform: Platform, public barcodeScanner: BarcodeScanner, public toast: Toast) { }

  /**
   * Shows message as a Toast notification if you are on mobile or logs it to
   * the console when cordova is not be available.
   */
  showToast(message: string) {
    if (this.platform.is('cordova')) {
      this.toast.showWithOptions(
        {
          message,
          duration: 5000,
          position: 'bottom',
          addPixelsY: -50
        }
      ).subscribe(toast => {});
    } else {
      console.log(message);
    }
  }

  scan() {
    return this.barcodeScanner.scan();
  }
}
