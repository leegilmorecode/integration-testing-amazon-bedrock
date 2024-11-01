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
          serviceName: `gilmore-mot-service${Stage.test}`,
          metricNamespace: `gilmore-mot-${Stage.test}`,
          stage: Stage.test,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '111111111111',
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
          serviceName: `gilmore-mot-service${Stage.staging}`,
          metricNamespace: `gilmore-mot-${Stage.staging}`,
          stage: Stage.staging,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '111111111111',
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
          serviceName: `gilmore-mot-service${Stage.prod}`,
          metricNamespace: `gilmore-mot-${Stage.prod}`,
          stage: Stage.prod,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '111111111111',
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
          serviceName: `gilmore-mot-service${Stage.develop}`,
          metricNamespace: `gilmore-mot-${Stage.develop}`,
          stage: Stage.develop,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '111111111111',
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
          serviceName: `gilmore-mot-service${stage}`,
          metricNamespace: `gilmore-mot-${stage}`,
          stage: stage,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_20_X,
        },
        env: {
          account: '111111111111',
          region: Region.london,
        },
      };
  }
};
