/* eslint-disable no-mixed-operators */
import BN from 'bn.js'
import { Options as QueryOptions } from '@polkadot/react-api/hoc/types'
import queryString from 'query-string'

export const ZERO = new BN(0)
export const ONE = new BN(1)

// Substrate/Polkadot API utils
// --------------------------------------

/** Example of apiQuery: 'query.councilElection.round' */
export function queryToProp (
  apiQuery: string,
  paramNameOrOpts?: string | QueryOptions
): [ string, QueryOptions ] {
  let paramName: string | undefined;
  let propName: string | undefined;

  if (typeof paramNameOrOpts === 'string') {
    paramName = paramNameOrOpts;
  } else if (paramNameOrOpts) {
    paramName = paramNameOrOpts.paramName;
    propName = paramNameOrOpts.propName;
  }

  // If prop name is still undefined, derive it from the name of storage item:
  if (!propName) {
    propName = apiQuery.split('.').slice(-1)[0];
  }

  return [ apiQuery, { paramName, propName } ];
}

export const socialQueryToProp = (storageItem: string, paramNameOrOpts?: string | QueryOptions) => {
  return queryToProp(`query.social.${storageItem}`, paramNameOrOpts)
}

// Parse URLs
// --------------------------------------

export function getUrlParam (location: Location, paramName: string, deflt?: string): string | undefined {
  const params = queryString.parse(location.search);
  return params[paramName] ? params[paramName] as string : deflt;
}

// Next.js utils
// --------------------------------------

export function isServerSide (): boolean {
  return typeof window === 'undefined'
}

export function isClientSide (): boolean {
  return !isServerSide()
}

export const isHomePage = (): boolean =>
  isClientSide() && window.location.pathname === '/'
