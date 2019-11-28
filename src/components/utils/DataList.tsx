import React, { useState, useEffect } from 'react';
import { List, Empty } from 'antd';
import Router, { useRouter } from 'next/router';
import { isEmpty } from 'lodash';
import Section from './Section';
import { DEFAULT_CURENT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, MAX_PAGE_SIZE } from '../../config/ListData.config';
import { MutedSpan } from './MutedText';

type Props = {
  className?: string,
  dataSource: any[],
  renderItem: (item: any, index: number) => JSX.Element,
  title?: React.ReactNode,
  noDataDesc?: React.ReactNode | string,
  noDataExt?: React.ReactNode
};

export default (props: Props) => {
  const { dataSource,renderItem, className, title, noDataDesc = 'no data', noDataExt } = props;
  const total = dataSource.length;

  const router = useRouter();
  const routerQuery = router.query;

  const [ currentPage, setCurrentPage ] = useState(DEFAULT_CURENT_PAGE);
  const [ pageSize, setPageSize ] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (isEmpty(routerQuery)) {
      setPageSize(DEFAULT_PAGE_SIZE);
      setCurrentPage(DEFAULT_CURENT_PAGE);

      routerQuery.size = DEFAULT_PAGE_SIZE.toString();
      routerQuery.page = DEFAULT_CURENT_PAGE.toString();

      Router.push({
        pathname: router.pathname,
        query: routerQuery
      }).catch(console.log);
    } else {
      const page = parseInt(routerQuery.page as string, 10);
      const _pageSize = parseInt(routerQuery.size as string, 10);

      setCurrentPage(page > 0 ? page : DEFAULT_PAGE_SIZE);
      setPageSize(_pageSize > 0 && _pageSize < MAX_PAGE_SIZE ? _pageSize : DEFAULT_PAGE_SIZE);
    }
  }, [false]);

  const itemsSelect = PAGE_SIZE_OPTIONS.map(x => x.toString());
  const isEmptyData = dataSource.length === 0;
  const hidePaggination = isEmptyData || dataSource.length <= pageSize;

  const RenderList = () => (
    <List
      className={'DfDataList ' + className}
      itemLayout='vertical'
      size='large'
      pagination={!hidePaggination && {
        current: currentPage,
        defaultCurrent: DEFAULT_CURENT_PAGE,
        onChange: page => {
          setCurrentPage(page);
          routerQuery.page = page.toString();

          Router.push({
            pathname: router.pathname,
            query: routerQuery
          }).catch(console.log);
        },
        pageSize: pageSize,
        showSizeChanger: total > 0,
        onShowSizeChange: (_,size: number) => {
          setPageSize(size);
          routerQuery.size = size.toString();

          Router.push({
            pathname: router.pathname,
            query: routerQuery
          }).catch(console.log);
        },
        pageSizeOptions: itemsSelect
      }}
      dataSource={dataSource}
      renderItem={(item,index) => (
        <List.Item
          key={index}
        >
          {renderItem(item,index)}
        </List.Item>
      )}
    />
  );

  return <Section title={<div className='DfTitle--List'>{title}</div>}>
    {isEmptyData ? <DataEmpty description={noDataDesc}>{noDataExt}</DataEmpty> : <RenderList/>}
  </Section>;
};

type EmptyProps = {
  description?: React.ReactNode | string,
  children?: React.ReactNode
}

export const DataEmpty = (props: EmptyProps) => (
  <Empty
    description={
      <MutedSpan>
        {props.description}
      </MutedSpan>
    }
  >
    {props.children}
  </Empty>
);