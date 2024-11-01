#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { getEnvironmentConfig } from '../app-config';
import { CustomerApiStatelessStack } from '../stateless/stateless';
import { Stage } from '../types';
import { getStage } from '../utils';

const stage = getStage(process.env.STAGE as Stage) as Stage;
const appConfig = getEnvironmentConfig(stage);

const app = new cdk.App();
new CustomerApiStatelessStack(app, 'CustomerApiStatelessStack', {
  env: appConfig.env,
  stateless: appConfig.stateless,
  shared: appConfig.shared,
});