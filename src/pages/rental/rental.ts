import { Component } from '@angular/core';
import { NavController, NavParams, Events, Platform, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import { InventoryData } from '../../providers/inventory-data';
import { Notifications } from '../../providers/notifications';
import { ViewItemPage } from '../view-item/view-item';
import { RentalDetailsPage } from '../rental-details/rental-details';
import { Actions, Messages } from '../../constants';

@Component({
  selector: 'page-rental',
  templateUrl: 'rental.html'
})
export class RentalPage {
  actions = Actions;
  action: Actions = '';
  items = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public inventoryData: InventoryData,
    public notifications: Notifications,
    public events: Events,
    public barcodeScanner: BarcodeScanner,
    public platform: Platform,
    public alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.action = this.navParams.get('action');
    const item = this.navParams.get('item');
    this.items.push(item);

    this.events.subscribe('item:edited', barcode => {
      const index = this.items.findIndex(item => item.barcode === barcode);

      this.inventoryData.getItem(barcode).subscribe(
        item => this.items.splice(index, 1, item),
        err => this.notifications.showToast(err)
      );
    });
  }

  onAdd(barcode: string) {
    this.inventoryData.getItem(barcode).subscribe(
      item => {
        if (item.available === 0 && this.action === Actions.rent) {
          this.notifications.showToast(Messages.itemAlreadyRented);
        } else if (item.available === 1 && this.action === Actions.return) {
          this.notifications.showToast(Messages.itemNotRented);
        } else if (this.items.some(listItem => listItem.barcode === item.barcode)) {
          this.notifications.showToast(Messages.itemAlreadyAdded);
        } else {
          this.items.push(item);
        }
      },
      err => this.notifications.showToast(err)
    );
  }

  viewItem(item) {
    this.navCtrl.push(ViewItemPage, {
      barcode: item.barcode
    });
  }

  onContinue() {
    this.navCtrl.push(RentalDetailsPage, {
      items: this.items
    });
  }

  onReturn() {
    let returns = [];

    for (const item of this.items) {
      returns.push(this.inventoryData.return(item.barcode).toPromise());
    }

    Promise.all(returns).then(
      success => {
        this.notifications.showToast(Messages.itemsReturned);
        this.navCtrl.pop();
      },
      err => this.notifications.showToast(err)
    );
  }

  onScanBarcode() {
    this.barcodeScanner.scan().then(
      barcodeData => {
        if (!barcodeData.cancelled) {
          this.onAdd(barcodeData.text);
        }
      },
      err => this.notifications.showToast(err)
    );
  }

  onTypeBarcode() {
    let alert = this.alertCtrl.create({
      title: 'Type Barcode',
      inputs: [
        {
          name: 'barcode',
          placeholder: 'Barcode'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Next',
          handler: form => {
            this.onAdd(form.barcode);
          }
        }
      ]
    });

    alert.present();
  }

  onRemoveItem(barcode) {
    const index = this.items.findIndex(item => item.barcode === barcode);

    this.items.splice(index, 1);
  }
}
