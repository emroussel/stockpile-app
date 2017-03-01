import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController, NavParams, ModalController } from 'ionic-angular';

import { InventoryData } from '../../providers/inventory-data';

import { Actions, ItemProperties, Messages } from '../../constants';
import { ItemFilterPage } from '../item-filter/item-filter';
import { StockpileData } from '../../providers/stockpile-data';

@Component({
  selector: 'page-item',
  templateUrl: 'item.html'
})
export class ItemPage {
  actions = Actions;
  itemProperties = ItemProperties;
  action: Actions = '';
  item: {brandID?: number, modelID?: number, categoryID?: number, tag?: string} = {};
  selectedBrand: string;
  allBrands;
  selectedModel: string;
  allModels;
  filteredModels;
  selectedCategory: string;
  allCategories;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public inventoryData: InventoryData,
    public modalCtrl: ModalController,
    public stockpileData: StockpileData
  ) { }

  ngOnInit() {
    this.item.tag = this.navParams.get('tag');
    this.action = this.navParams.get('action');

    this.inventoryData.getBrands().subscribe(
      brands => this.allBrands = brands.results,
      err => this.stockpileData.showToast(err.message)
    );

    const modelsObs = this.inventoryData.getModels();

    this.inventoryData.getCategories().subscribe(
      categories => this.allCategories = categories.results,
      err => this.stockpileData.showToast(err.message)
    );

    if (this.action === this.actions.edit) {
      this.inventoryData.getItem(this.item.tag).subscribe(
        item => {
          this.item.brandID = item.brandID;
          this.item.modelID = item.modelID;
          this.item.categoryID = item.categoryID;
          this.item.tag = item.tag;
          this.selectedBrand = item.brand;
          this.selectedModel = item.model;
          this.selectedCategory = item.category;

          modelsObs.subscribe(
            models => {
              this.allModels = models.results;
              this.filterModels;
            },
            err => this.stockpileData.showToast(err.message)
          );
        },
        err => this.stockpileData.showToast(err.message)
      );
    } else {
      modelsObs.subscribe(
        models => this.allModels = models.results,
        err => this.stockpileData.showToast(err.message)
      );
    }
  }

  onSave(form: NgForm) {
    if (form.valid) {
      let observable;
      let message;

      if (this.action === this.actions.add) {
        observable = this.inventoryData.addItem(this.item);
        message = Messages.itemAdded;
      } else if (this.action === this.actions.edit) {
        observable = this.inventoryData.editItem(this.item, this.item.tag);
        message = Messages.itemEdited;
      }

      observable.subscribe(
        success => {
          this.stockpileData.showToast(message);
          this.navCtrl.pop();
        },
        err => this.stockpileData.showToast(err.message)
      );
    }
  }

  onDelete() {
    this.inventoryData.deleteItem(this.item.tag).subscribe(
      success => {
        this.stockpileData.showToast(Messages.itemDeleted);
        this.navCtrl.pop();
      },
      err => this.stockpileData.showToast(err.message)
    );
  }

  filterModels() {
    this.filteredModels = this.allModels.filter((model) => {
      return (model.brandID === this.item.brandID);
    });
  }

  presentModal(elements, type) {
    let modal = this.modalCtrl.create(ItemFilterPage, {
      elements: elements,
      type: type
    });

    modal.onDidDismiss((element, isNew) => {
      if (element) {
        if (isNew) {
          switch (type) {
            case this.itemProperties.brand:
              this.inventoryData.addBrand(element.name).subscribe(
                brand => {
                  this.item.brandID = brand.id;
                  this.selectedBrand = brand.name;
                  this.filterModels();
                },
                err => this.stockpileData.showToast(err.message)
              );
              break;
            case this.itemProperties.model:
              this.inventoryData.addModel(element.name, this.item.brandID).subscribe(
                model => {
                  this.item.modelID = model.id;
                  this.selectedModel = model.name;
                },
                err => this.stockpileData.showToast(err.message)
              );
              break;
            case this.itemProperties.category:
              this.inventoryData.addCategory(element.name).subscribe(
                category => {
                  this.item.categoryID = category.id;
                  this.selectedCategory = category.name;
                },
                err => this.stockpileData.showToast(err.message)
              );
              break;
          }
        } else {
          switch (type) {
            case this.itemProperties.brand:
              this.item.brandID = element.brandID;
              this.selectedBrand = element.name;
              this.filterModels();
              break;
            case this.itemProperties.model:
              this.item.modelID = element.modelID;
              this.selectedModel = element.name;
              break;
            case this.itemProperties.category:
              this.item.categoryID = element.categoryID;
              this.selectedCategory = element.name;
              break;
          }
        }
      }
   });

    modal.present();
  }
}
