import { Action } from '@ngrx/store';

import { BrandsActions } from './brands.actions';
import { Brands } from '../../models/brands';

const initialState = {
  results: {},
  filtered: [],
  showAddNew: false,
  showLoadingSpinner: false
};

export function brandsReducer(brands: Brands = initialState, action: Action): Brands {
  switch (action.type) {
    case BrandsActions.FETCH:
      return { ...brands, showLoadingSpinner: true };
    case BrandsActions.FETCH_SUCCESS:
      return {
        ...brands,
        results: Object.assign({},
          action.payload.results.reduce((obj, brand) => {
            obj[brand.brandID] = brand;
            return obj;
          }, {})
        ),
        filtered: action.payload.results,
        showAddNew: false,
        showLoadingSpinner: false
      };
    case BrandsActions.FETCH_FAIL:
      return { ...brands, showLoadingSpinner: false };
    case BrandsActions.FILTER:
      const filtered = Object.keys(brands.results)
        .map((key) => brands.results[key])
        .filter(brand => brand.name.toLowerCase().indexOf(action.payload.toLowerCase()) > -1);

      return Object.assign({}, brands, {
        filtered: filtered,
        showAddNew: !filtered.find((brand) => {
          return brand.name.toLowerCase() === action.payload.toLowerCase() || action.payload === '';
        })
      });
    default:
      return brands;
  }
}
