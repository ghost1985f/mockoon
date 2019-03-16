import { HeaderType, RouteType } from 'src/app/types/route.type';

export type EnvironmentType = {
  uuid: string;
  name: string;
  port: number;
  endpointPrefix: string;
  latency: number;
  routes: RouteType[];
  proxyMode: boolean;
  proxyHost: string;
  https: boolean;
  cors: boolean;
  headers: HeaderType[];

  /**
   * Store duplicates environment indexes, use .length to assess if there is any duplicate
   */
  duplicates: number[];
};

export type EnvironmentsType = EnvironmentType[];

export type CurrentEnvironmentType = { environment: EnvironmentType, index: number };
