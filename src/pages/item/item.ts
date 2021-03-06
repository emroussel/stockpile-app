import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertController, ModalController, NavParams } from 'ionic-angular';

import { Actions, ItemProperties, LoadingMessages } from '../../constants';
import { ItemFilterPage } from '../item-filter/item-filter';
import { ItemsActions } from '../../store/items/items.actions';
import { ItemsService } from '../../services/items.service';
import { BrandsActions } from '../../store/brands/brands.actions';
import { ModelsActions } from '../../store/models/models.actions';
import { CategoriesActions } from '../../store/categories/categories.actions';
import { LayoutActions } from '../../store/layout/layout.actions';
import { ItemCustomField } from '../../models';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-item',
  templateUrl: 'item.html'
})
export class ItemPage {
  actions = Actions;
  itemProperties = ItemProperties;
  action: Actions = '';
  tempItem: Observable<any>;
  itemCustomFields: Observable<Array<ItemCustomField>>;
  errors = {
    brand: false,
    model: false,
    category: false
  };
  showLoadingSpinner: Observable<boolean>;

  constructor(
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public itemsActions: ItemsActions,
    public itemsService: ItemsService,
    public brandsActions: BrandsActions,
    public modelsActions: ModelsActions,
    public categoriesActions: CategoriesActions,
    public layoutActions: LayoutActions,
    public alertCtrl: AlertController
  ) {}

  /**
   * Gets action (add or edit) and fetches brands, models and categories. If
   * action is edit, update the temp item to the item that is being modified.
   * If action is add, update the temp item with the barcode.
   */
  ngOnInit() {
    this.itemsActions.resetTempItem();
    this.itemsActions.resetTempItemCustomFields();
    this.brandsActions.fetchBrands();
    this.modelsActions.fetchModels();
    this.categoriesActions.fetchCategories();
    this.tempItem = this.itemsService.getTempItem();
    this.itemCustomFields = this.itemsService.getTempItemCustomFields();
    this.showLoadingSpinner = this.itemsService.getShouldShowLoadingSpinner();

    this.action = this.navParams.get('action');
    const barcode = this.navParams.get('barcode');

    if (this.action === Actions.add) {
      this.itemsActions.updateTempItem({ barcode });
    } else if (this.action === Actions.edit) {
      let item;
      this.itemsService.getItem(barcode).take(1).subscribe(i => item = i);

      this.itemsActions.fetchItemCustomFields(barcode);
      this.itemsActions.updateTempItem({
        brand: item.brand,
        brandID: item.brandID,
        model: item.model,
        modelID: item.modelID,
        category: item.category,
        categoryID: item.categoryID,
        barcode: item.barcode
      });
    }
  }

  /**
   * Updates or creates item depending on the action.
   */
  onSave(form: NgForm) {
    this.checkIfErrors();

    if (!this.errors.brand && !this.errors.model && !this.errors.category) {
      let item;
      this.tempItem.take(1).subscribe(i => item = {
        modelID: i.modelID,
        categoryID: i.categoryID,
        barcode: i.barcode
      });

      let itemCustomFieldsList = [];
      const shouldUpdate = (key, value) => {
        let field;
        // Using == below to compare instead of === because the key from the
        // form comes back as a string instead of a number
        this.itemCustomFields.subscribe(
          fields => field = fields.find(itemField => itemField.customFieldID == key)
        );
        return field.value !== value;
      };

      // Transform the values from the form to an array
      Object.keys(form.value).map(key => {
        itemCustomFieldsList.push({
          customFieldID: key,
          value: form.value[key],
          shouldUpdate: shouldUpdate(key, form.value[key])
        });
      });

      if (this.action === Actions.add) {
        this.layoutActions.showLoadingMessage(LoadingMessages.creatingItem);
        this.itemsActions.createItem(item, itemCustomFieldsList);
      } else if (this.action === Actions.edit) {
        this.layoutActions.showLoadingMessage(LoadingMessages.updatingItem);
        this.itemsActions.updateItem(item, itemCustomFieldsList);
      }
    }
  }

  /**
   * Checks for errors in the form. Used instead of Angular's Reactive Forms
   * Validation, because Angular's Validators require inputs, and we had to use
   * labels as a work around to make ion-items tappable.
   */
  checkIfErrors() {
    let item;
    this.tempItem.take(1).subscribe(i => item = i);

    this.errors.brand = item.brand ? false : true;
    this.errors.model = item.model ? false : true;
    this.errors.category = item.category ? false : true;
  }

  /**
   * Confirms if user wants to delete the item.
   */
  onDelete() {
    let alert = this.alertCtrl.create({
      title: 'Are you sure you want to delete this item?',
      message: 'It will be deleted permanently',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.deleteItem()
        }
      ]
    });
    alert.present();
  }

  /**
   * Deletes the item.
   */
  deleteItem() {
    let barcode;
    this.tempItem.take(1).subscribe(i => barcode = i.barcode);
    this.layoutActions.showLoadingMessage(LoadingMessages.deletingItem);
    this.itemsActions.deleteItem(barcode);
  }

  /**
   * Presents a modal to allow the user to choose a brand, model or category.
   * When dismissed, updates the temp item with the new data.
   */
  onPresentModal(type) {
    let brandID;
    this.tempItem.take(1).subscribe(i => brandID = i.brandID);

    let modal = this.modalCtrl.create(ItemFilterPage, { type, brandID });

    modal.onDidDismiss(element => {
      // If user cancelled, element will be undefined
      if (element) {
        this.updateTempItem(type, element);
      }
   });

    modal.present();
  }

  /**
   * Updates the item with the new brand, model or category.
   */
  updateTempItem(type, element) {
    switch (type) {
      case ItemProperties.brand:
        // Since models are linked to a brand, also reset model when brand changes.
        this.itemsActions.updateTempItem({
          brandID: element.brandID,
          brand: element.name,
          modelID: null,
          model: ''
        });
        this.errors.brand = false;
        break;
      case ItemProperties.model:
        this.itemsActions.updateTempItem({
          modelID: element.modelID,
          model: element.name
        });
        this.errors.model = false;
        break;
      case ItemProperties.category:
        // Since category changed, fetch custom fields related to the new category
        this.itemsActions.fetchItemCustomFieldsByCategory(element.categoryID);

        this.itemsActions.updateTempItem({
          categoryID: element.categoryID,
          category: element.name
        });
        this.errors.category = false;
        break;
    }
  }
}
