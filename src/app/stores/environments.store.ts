import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { environmentReducer, ReducerActionType } from 'src/app/stores/environments.reducer';
import { EnvironmentsType, EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';
const win = window as any;
win.devTools = win.__REDUX_DEVTOOLS_EXTENSION__.connect();

export type TabsNameType = 'RESPONSE' | 'HEADERS' | 'ENV_SETTINGS' | 'ENV_LOGS';

export type EnvironmentStatusType = { running: boolean, needRestart: boolean };

export type EnvironmentsStatusType = { [key: string]: EnvironmentStatusType };

export type EnvironmentsStoreType = {
  activeTab: TabsNameType,
  activeEnvironmentUUID: string,
  activeRouteUUID: string,
  environments: EnvironmentsType,
  environmentsStatus: EnvironmentsStatusType
};

// WIP https://angularfirebase.com/lessons/redux-from-scratch-angular-rxjs/

@Injectable({ providedIn: 'root' })
export class EnvironmentsStore {
  private store$ = new BehaviorSubject<EnvironmentsStoreType>({
    activeTab: 'RESPONSE',
    activeEnvironmentUUID: null,
    activeRouteUUID: null,
    environments: [],
    environmentsStatus: {}
  });

  constructor() { }

  /**
   * Set the store initial state and set an active environment
   */
  public setInitialState(environments: EnvironmentsType) {
    const initialState = {
      ...this.store$.value,
      environments,
      environmentsStatus: environments.reduce<EnvironmentsStatusType>((environmentsStatus, environment) => {
        environmentsStatus[environment.uuid] = { running: false, needRestart: false };
        return environmentsStatus;
      }, {})
    }

    this.store$.next(initialState);
    win.devTools.send('SET_INITIAL_STATE', initialState);

    this.update({ type: 'SET_ACTIVE_ENVIRONMENT' });
  }

  /**
   * Select store element
   */
  public select<T extends keyof EnvironmentsStoreType>(path: T): Observable<EnvironmentsStoreType[T]> {
    return this.store$.asObservable().pipe(
      pluck(path)
    );
  }

  /**
   * Select active environment observable
   */
  public selectActiveEnvironment(): Observable<EnvironmentType> {
    return this.store$.asObservable().pipe(
      map(environmentsStore => environmentsStore.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID))
    );
  }

  /**
   * Select active environment status observable
   */
  public selectActiveEnvironmentStatus(): Observable<EnvironmentStatusType> {
    return this.store$.asObservable().pipe(
      map(environmentsStore => environmentsStore.environmentsStatus[this.store$.value.activeEnvironmentUUID])
    );
  }

  /**
   * Select active route observable
   */
  public selectActiveRoute(): Observable<RouteType> {
    return this.store$.asObservable().pipe(
      map(environmentsStore => environmentsStore.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID)),
      map(environment => environment ? environment.routes.find(route => route.uuid === this.store$.value.activeRouteUUID) : null)
    );
  }

  /**
   * Get all environments
   */
  public getEnvironments(): EnvironmentsStoreType {
    return this.store$.value;
  }

  /**
   * Get environment by uuid
   */
  public getEnvironmentByUUID(UUID: string): EnvironmentType {
    return this.store$.value.environments.find(environment => environment.uuid === UUID);
  }

  /**
   * Get environments status
   */
  public getEnvironmentsStatus(): EnvironmentsStatusType {
    return this.store$.value.environmentsStatus;
  }

  /**
   * Get active environment value
   */
  public getActiveEnvironment(): EnvironmentType {
    return this.store$.value.environments.find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID);
  }

  /**
   * Get active environment UUID
   */
  public getActiveEnvironmentUUID(): string {
    return this.store$.value.activeEnvironmentUUID;
  }

  /**
   * Get active route observable
   */
  public getActiveRoute(): RouteType {
    return this.store$.value.environments
      .find(environment => environment.uuid === this.store$.value.activeEnvironmentUUID).routes
      .find(route => route.uuid === this.store$.value.activeRouteUUID);
  }

  /**
   * Get active route UUID
   */
  public getActiveRouteUUID(): string {
    return this.store$.value.activeRouteUUID;
  }

  /**
   * Get the currently selected tab
   */
  public getActiveTab(): TabsNameType {
    return this.store$.value.activeTab;
  }

  /**
   * Update the store using the reducer
   */
  public update(action: ReducerActionType) {
    this.store$.next(environmentReducer(this.store$.value, action));
  }
}
