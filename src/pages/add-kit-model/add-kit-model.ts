import { Component } from '@angular/core';
import { NavController, ModalController, NavParams } from 'ionic-angular';

import { BrandsActions } from '../../store/brands/brands.actions';
import { ModelsActions } from '../../store/models/models.actions';
import { KitModelsActions } from '../../store/kit-models/kit-models.actions';

import { ItemProperties, Actions } from '../../constants';
import { ItemFilterPage } from '../item-filter/item-filter';

@Component({
  selector: 'page-add-kit-model',
  templateUrl: 'add-kit-model.html'
})
export class AddKitModelPage {
  itemProperties = ItemProperties;
  kitModel: { brandID?: number, brand?: string, modelID?: number, model?: string, quantity?: number } = {};
  numbers: Array<number> = [];
  action: Actions = '';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public brandsActions: BrandsActions,
    public modelsActions: ModelsActions,
    public kitModelsActions: KitModelsActions
  ) {}

  /**
   * Fetches brands and models.
   */
  ngOnInit() {
    this.brandsActions.fetchBrands();
    this.modelsActions.fetchModels();
    this.action = this.navParams.get('action');

    // Fill the array of options for selecting the quantity
    this.numbers = Array.from({ length: 100 }, (value, index) => index + 1);

    if (this.action === Actions.edit) {
      this.kitModel = this.navParams.get('kitModel');
    } else {
      this.kitModel.quantity = 1;
    }
  }

  /**
   * Creates or updates kit item and pops nav.
   */
  onSave() {
    switch (this.action) {
      case Actions.add:
        this.kitModelsActions.createTemp(this.kitModel);
        break;
      case Actions.edit:
        this.kitModelsActions.updateTemp(this.kitModel);
        break;
    };

    this.navCtrl.pop();
  }

  /**
   * Presents a modal to allow the user to choose a brand, model or category.
   * When dismissed, updates the kit item with the new data.
   */
  onPresentModal(type) {
    let modal = this.modalCtrl.create(ItemFilterPage, { type, brandID: this.kitModel.brandID });

    modal.onDidDismiss((element) => {
      // If user has chosen an element (did not cancel)
      if (element) {
        const modifiedkitModel = this.getNewKitModelProperties(type, element);
        this.kitModel = { ...this.kitModel, ...modifiedkitModel };
      }
   });

    modal.present();
  }

  /**
   * Returns the brand or model of the kitModel depending on the type.
   */
  getNewKitModelProperties(type, element) {
    switch (type) {
      // Since models are linked to a brand, also reset model when brand changes.
      case ItemProperties.brand:
        return {
          brand: element.name,
          brandID: element.brandID,
          model: '',
          modelID: null
        };
      case ItemProperties.model:
        return {
          model: element.name,
          modelID: element.modelID
        };
    }
  }
}
