import { registry } from '@polkadot/react-api';
import { Button$Sizes } from '@polkadot/react-components/Button/types';
import { GenericAccountId } from '@polkadot/types';
import { AccountId } from '@polkadot/types/interfaces';
import { newLogger, notDef } from '@subsocial/utils';
import React, { useEffect, useState } from 'react';

import { TX_BUTTON_SIZE } from '../../config/Size.config';
import { isMyAddress, useMyAddress } from './MyAccountContext';
import { useSubsocialApi } from './SubsocialApiContext';
import TxButton from './TxButton';
import { Loading } from './utils';

const log = newLogger('FollowAccountButton')

type FollowAccountButtonProps = {
  address: string | AccountId
  size?: Button$Sizes
  className?: string
}

function FollowAccountButton (props: FollowAccountButtonProps) {
  const { address, size = TX_BUTTON_SIZE, className = '' } = props;
  const myAddress = useMyAddress()
  const accountId = new GenericAccountId(registry, address);
  const { substrate } = useSubsocialApi()

  const [ isFollow, setIsFollow ] = useState<boolean>();

  useEffect(() => {
    if (!myAddress) return;

    let isSubscribe = true;
    const load = async () => {
      const _isFollow = await (substrate.isAccountFollower(myAddress, address))
      isSubscribe && setIsFollow(_isFollow);
    };
    load().catch(err => log.error('Failed to check isFollow:', err));

    return () => { isSubscribe = false; };
  }, [ myAddress ]);

  if (!myAddress || isMyAddress(address)) return null;

  const buildTxParams = () => {
    return [ accountId ];
  };

  return <span className={className}>{notDef(isFollow)
    ? <Loading />
    : <TxButton
      className="DfFollowAccountButton"
      size={size}
      isBasic={isFollow}
      label={isFollow
        ? 'Unfollow'
        : 'Follow'}
      params={buildTxParams()}
      tx={isFollow
        ? `social.unfollowAccount`
        : `social.followAccount`}
      onSuccess={() => setIsFollow(!isFollow)}
      withSpinner
    />
  }</span>
}

export default FollowAccountButton;
