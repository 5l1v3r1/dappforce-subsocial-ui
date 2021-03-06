import React, { useEffect, useState } from 'react';
import { Loader } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { INFINITE_SCROLL_PAGE_SIZE } from '../../config/ListData.config';
import { Activity } from '@subsocial/types/offchain';
import { getNotifications } from '../utils/OffchainUtils';
import NoData from '../utils/EmptyList';
import NotAuthorized from '../utils/NotAuthorized';
import { HeadMeta } from '../utils/HeadMeta';
import Section from '../utils/Section';
import { useMyAddress } from '../utils/MyAccountContext';
import { Notifications } from './Notification';
import { Loading } from '../utils/utils';

export const MyNotifications = () => {
  const myAddress = useMyAddress()

  const [ items, setItems ] = useState<Activity[]>([]);
  const [ offset, setOffset ] = useState(0);
  const [ hasNextPage, setHasNextPage ] = useState(true);
  const [ loaded, setLoaded ] = useState(false);

  useEffect(() => {
    if (!myAddress) return;
    setLoaded(false)
    getNextPage(0).catch(err => new Error(err)).finally(() => setLoaded(true));

    // TODO fix 'Mark all notifications as read' when user's session key implemented:
    // clearNotifications(myAddress)
  }, [ myAddress ]);

  if (!myAddress) return <NotAuthorized />;

  const getNextPage = async (actualOffset: number = offset) => {
    const isFirstPage = actualOffset === 0;
    const data = await getNotifications(myAddress, actualOffset, INFINITE_SCROLL_PAGE_SIZE);
    if (data.length < INFINITE_SCROLL_PAGE_SIZE) setHasNextPage(false);
    setItems(isFirstPage ? data : items.concat(data));
    setOffset(actualOffset + INFINITE_SCROLL_PAGE_SIZE);
  };

  const totalCount = (items && items.length) || 0;

  const Content = () => {
    if (!loaded) {
      return <Loading />
    }

    return totalCount === 0
      ? <NoData description='No notifications for you' />
      : renderInfiniteScroll()
  }

  const renderInfiniteScroll = () =>
    <InfiniteScroll
      dataLength={totalCount}
      next={getNextPage}
      hasMore={hasNextPage}
      // endMessage={<MutedDiv className='DfEndMessage'>You have read all notifications</MutedDiv>}
      loader={<Loader active inline='centered' />}
    >
      <Notifications activities={items} />
    </InfiniteScroll>

  return <>
    <HeadMeta title='My Notifications' />
    <Section title={`My Notifications (${totalCount})`}>
      <Content />
    </Section>
  </>
}

export default MyNotifications
