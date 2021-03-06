import axios from 'axios';

import { api as polkadotApi } from '@polkadot/react-api';
import { Api } from '@subsocial/api/substrateConnect'
import { getEnv } from './utils';
import { ApiPromise } from '@polkadot/api';
import { Activity } from '@subsocial/types/offchain';
// import { SubsocialIpfsApi } from '@subsocial/api/ipfs';
import { newLogger } from '@subsocial/utils';
import { SubsocialApi } from '@subsocial/api/fullApi';

const log = newLogger('SubsocialConnect')

export const offchainUrl = getEnv('OFFCHAIN_URL') || 'http://localhost:3001';
export const ipfsUrl = getEnv('IPFS_URL') || '/ip4/127.0.0.1/tcp/8080';
export const substrateUrl = getEnv('SUBSTRATE_URL') || 'ws://127.0.0.1:9944';

export const ipfs = {} as any

export const getNewsFeed = async (myAddress: string, offset: number, limit: number): Promise<Activity[]> => {
  const res = await axios.get(`${offchainUrl}/offchain/feed/${myAddress}?offset=${offset}&limit=${limit}`);
  const { data } = res;
  return data;
};

export const getNotifications = async (myAddress: string, offset: number, limit: number): Promise<Activity[]> => {
  const res = await axios.get(`${offchainUrl}/offchain/notifications/${myAddress}?offset=${offset}&limit=${limit}`);
  const { data } = res;
  return data;
};

let subsocial: SubsocialApi | undefined = undefined;

export const getSubsocialApi = async () => {
  if (!subsocial) {
    const api = await getApi()
    subsocial = new SubsocialApi({ substrateApi: api, ipfsApi: ipfsUrl, offchainUrl })
  }
  return subsocial
}

export let api: ApiPromise

export const getApi = async () => {
  if (polkadotApi) {
    log.debug('Get Substrate API: @polkadot api')
    return polkadotApi.isReady
  } else {
    if (!api) {
      log.debug('Get Substrate API: DfApi.setup()')
      api = await Api.connect(substrateUrl)
    }
    return api
  }
}
