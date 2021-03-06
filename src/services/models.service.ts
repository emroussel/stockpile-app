import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { AppState, Models } from '../models';

@Injectable()
export class ModelsService {

  constructor(private store: Store<AppState>) {}

  getModels(): Observable<Models> {
    return this.store.select(appState => appState.models);
  }

  getShouldShowAddNew(): Observable<boolean> {
    return this.store.select(appState => appState.models.showAddNew);
  }
}
