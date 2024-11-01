import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Region, Stage } from '../types';

export interface EnvironmentConfig {
  shared: {
    stage: Stage;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {
    runtimes: lambda.Runtime;
  };
}

export const getEnvironmentConfig = (stage: Stage): EnvironmentConfig => {
  switch (stage) {
    case Stage.test:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `gilmore-garage-service${Stage.test}`,
          metricNamespace: `gilmore-garages-${Stage.test}`,
          stage: Stage.test,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
      };
    case Stage.staging:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `gilmore-garage-service${Stage.staging}`,
          metricNamespace: `gilmore-garages-${Stage.staging}`,
          stage: Stage.staging,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
      };
    case Stage.prod:
      return {
        shared: {
          logging: {
            logLevel: 'INFO',
            logEvent: 'true',
          },
          serviceName: `gilmore-garage-service${Stage.prod}`,
          metricNamespace: `gilmore-garages-${Stage.prod}`,
          stage: Stage.prod,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
      };
    case Stage.develop:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `gilmore-garage-service${Stage.develop}`,
          metricNamespace: `gilmore-garages-${Stage.develop}`,
          stage: Stage.develop,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
      };
    default:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `gilmore-garage-service${stage}`,
          metricNamespace: `gilmore-garages-${stage}`,
          stage: stage,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
      };
  }
};
