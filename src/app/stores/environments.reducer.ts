import { Utils } from 'src/app/libs/utils.lib';
import { EnvironmentsStatusType, EnvironmentsStoreType } from 'src/app/stores/environments.store';
import { EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';
const win = window as any;
win.devTools = win.__REDUX_DEVTOOLS_EXTENSION__.connect();

export type ReducerDirectionType = 'next'
  | 'previous';
export type ReducerActionType = {
  type: 'SET_ACTIVE_TAB' |
  'SET_ACTIVE_ENVIRONMENT' |
  'NAVIGATE_ENVIRONMENTS' |
  'MOVE_ENVIRONMENTS' |
  'ADD_ENVIRONMENT' |
  'REMOVE_ENVIRONMENT' |
  'UPDATE_ENVIRONMENT' |
  'UPDATE_ENVIRONMENT_STATUS' |
  'SET_ACTIVE_ROUTE' |
  'NAVIGATE_ROUTES' |
  'MOVE_ROUTES' |
  'ADD_ROUTE' |
  'REMOVE_ROUTE' |
  'UPDATE_ROUTE';
  // used to select entities (environment, routes)
  UUID?: string;
  // item to add
  item?: any;
  // direction to select (next, previous)
  direction?: ReducerDirectionType;
  // properties to update
  properties?: { [key: string]: any };
  indexes?: { sourceIndex: number, targetIndex: number };
};

export function environmentReducer(
  state: EnvironmentsStoreType,
  action: ReducerActionType
): EnvironmentsStoreType {
  let newState: EnvironmentsStoreType;

  switch (action.type) {

    case 'SET_ACTIVE_TAB': {
      newState = {
        ...state,
        activeTab: action.item,
        environments: state.environments
      };
      break;
    }

    case 'SET_ACTIVE_ENVIRONMENT': {
      if (action.UUID !== state.activeEnvironmentUUID) {
        const activeEnvironment = action.UUID ? state.environments.find(environment => environment.uuid === action.UUID) : state.environments[0];

        newState = {
          ...state,
          activeEnvironmentUUID: action.UUID ? action.UUID : activeEnvironment.uuid,
          activeRouteUUID: (activeEnvironment.routes.length) ? activeEnvironment.routes[0].uuid : null,
          activeTab: 'RESPONSE',
          environments: state.environments
        };
        break;
      }

      newState = state;
      break;
    }

    case 'NAVIGATE_ENVIRONMENTS': {
      const activeEnvironmentIndex = state.environments.findIndex(environment => environment.uuid === state.activeEnvironmentUUID);

      let newEnvironment;

      if (action.direction === 'next' && activeEnvironmentIndex < state.environments.length - 1) {
        newEnvironment = state.environments[activeEnvironmentIndex + 1];
      } else if (action.direction === 'previous' && activeEnvironmentIndex > 0) {
        newEnvironment = state.environments[activeEnvironmentIndex - 1];
      } else {
        newState = state;
        break;
      }

      newState = {
        ...state,
        activeEnvironmentUUID: newEnvironment.uuid,
        activeRouteUUID: (newEnvironment.routes.length) ? newEnvironment.routes[0].uuid : null,
        activeTab: 'RESPONSE',
        environments: state.environments
      };
      break;
    }

    case 'MOVE_ENVIRONMENTS': {
      const newEnvironments = state.environments.slice();
      newEnvironments.splice(action.indexes.targetIndex, 0, newEnvironments.splice(action.indexes.sourceIndex, 1)[0]);

      newState = {
        ...state,
        environments: newEnvironments
      };
      break;
    }

    case 'SET_ACTIVE_ROUTE': {
      if (action.UUID !== state.activeRouteUUID) {
        newState = {
          ...state,
          activeRouteUUID: action.UUID,
          activeTab: 'RESPONSE',
          environments: state.environments
        };
        break;
      }

      newState = state;
      break;
    }

    case 'NAVIGATE_ROUTES': {
      const activeEnvironment = state.environments.find(environment => environment.uuid === state.activeEnvironmentUUID);
      const activeRouteIndex = activeEnvironment.routes.findIndex(route => route.uuid === state.activeRouteUUID);

      let newRoute;

      if (action.direction === 'next' && activeRouteIndex < activeEnvironment.routes.length - 1) {
        newRoute = activeEnvironment.routes[activeRouteIndex + 1];
      } else if (action.direction === 'previous' && activeRouteIndex > 0) {
        newRoute = activeEnvironment.routes[activeRouteIndex - 1];
      } else {
        newState = state;
        break;
      }

      newState = {
        ...state,
        activeRouteUUID: newRoute.uuid,
        activeTab: 'RESPONSE',
        environments: state.environments
      };
      break;
    }

    case 'MOVE_ROUTES': {
      // reordering routes need an environment restart
      const activeEnvironmentStatus = state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.running) {
        needRestart = true;
      }

      const newEnvironments = state.environments.map(environment => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          const newRoutes = environment.routes.slice();
          newRoutes.splice(action.indexes.targetIndex, 0, newRoutes.splice(action.indexes.sourceIndex, 1)[0]);

          return {
            ...environment,
            routes: newRoutes
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: { ...activeEnvironmentStatus, needRestart }
        }
      };
      break;
    }

    case 'ADD_ENVIRONMENT': {
      newState = {
        ...state,
        activeEnvironmentUUID: action.item.uuid,
        activeRouteUUID: action.item.routes[0].uuid,
        activeTab: 'RESPONSE',
        environments: [
          ...state.environments,
          action.item
        ],
        environmentsStatus: {
          ...state.environmentsStatus,
          [action.item.uuid]: { running: false, needRestart: false }
        }
      };
      break;
    }

    case 'REMOVE_ENVIRONMENT': {
      const newEnvironments = state.environments.filter(environment => environment.uuid !== action.UUID);
      const newEnvironmentsStatus = { ...state.environmentsStatus };
      delete newEnvironmentsStatus[action.UUID];

      if (state.activeEnvironmentUUID === action.UUID) {
        if (newEnvironments.length) {
          newState = {
            ...state,
            activeEnvironmentUUID: newEnvironments[0].uuid,
            activeRouteUUID: (newEnvironments[0].routes.length) ? newEnvironments[0].routes[0].uuid : null,
            environments: newEnvironments
          };
        } else {
          newState = {
            ...state,
            activeEnvironmentUUID: null,
            activeRouteUUID: null,
            environments: newEnvironments
          };
        }
      } else {
        newState = {
          ...state,
          environments: newEnvironments
        };
      }
      break;
    }

    case 'UPDATE_ENVIRONMENT': {
      const propertiesNeedingRestart: (keyof EnvironmentType)[] = ['port', 'endpointPrefix', 'proxyMode', 'proxyHost', 'https', 'cors'];
      const activeEnvironmentStatus = state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.needRestart) {
        needRestart = true;
      } else {
        needRestart = Utils.objectContainsOneArrayItem(action.properties, propertiesNeedingRestart) && activeEnvironmentStatus.running;
      }

      newState = {
        ...state,
        environments: state.environments.map(environment => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              ...action.properties
            };
          }
          return environment;
        }),
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: { ...activeEnvironmentStatus, needRestart }
        }
      };
      break;
    }

    case 'UPDATE_ENVIRONMENT_STATUS': {
      const newEnvironmentsStatus: EnvironmentsStatusType = { ...state.environmentsStatus };

      newEnvironmentsStatus[state.activeEnvironmentUUID] = {
        ...state.environmentsStatus[state.activeEnvironmentUUID],
        ...action.properties
      };

      newState = {
        ...state,
        environmentsStatus: newEnvironmentsStatus
      };
      break;
    }

    case 'REMOVE_ROUTE': {
      const activeEnvironment = state.environments.find(environment => environment.uuid === state.activeEnvironmentUUID);
      const newRoutes = activeEnvironment.routes.filter(route => route.uuid !== action.UUID);

      const newEnvironment = state.environments.map(environment => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            routes: newRoutes
          };
        }
        return environment;
      });

      if (state.activeRouteUUID === action.UUID) {
        if (newRoutes.length) {
          newState = {
            ...state,
            activeRouteUUID: newRoutes[0].uuid,
            environments: newEnvironment
          };
        } else {
          newState = {
            ...state,
            activeRouteUUID: null,
            activeTab: 'ENV_SETTINGS',
            environments: newEnvironment
          };
        }
      } else {
        newState = {
          ...state,
          environments: newEnvironment
        };
      }
      break;
    }

    case 'ADD_ROUTE': {
      // only add a route if there is at least one environment
      if (state.environments.length > 0) {
        newState = {
          ...state,
          activeRouteUUID: action.item.uuid,
          activeTab: 'RESPONSE',
          environments: state.environments.map(environment => {
            if (environment.uuid === state.activeEnvironmentUUID) {
              return {
                ...environment,
                routes: [...environment.routes, action.item]
              };
            }
            return environment;
          })
        };
        break;
      }

      newState = state;
      break;
    }

    case 'UPDATE_ROUTE': {
      const propertiesNeedingRestart: (keyof RouteType)[] = ['endpoint', 'method'];
      const activeEnvironmentStatus = state.environmentsStatus[state.activeEnvironmentUUID];
      let needRestart: boolean;

      if (activeEnvironmentStatus.needRestart) {
        needRestart = true;
      } else {
        needRestart = Utils.objectContainsOneArrayItem(action.properties, propertiesNeedingRestart) && activeEnvironmentStatus.running;
      }

      newState = {
        ...state,
        environments: state.environments.map(environment => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              routes: environment.routes.map(route => {
                if (route.uuid === state.activeRouteUUID) {
                  return {
                    ...route,
                    ...action.properties,
                  };
                }
                return route;
              })
            };
          }
          return environment;
        }),
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: { ...activeEnvironmentStatus, needRestart }
        }
      };
      break;
    }

    default:
      newState = state;
      break;
  }

  win.devTools.send(action.type, newState);
  return newState;
}
