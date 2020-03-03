import React from 'react';

import { ViewBlog } from './ViewBlog';
import { newBlogId } from '../types';
import { useRouter } from 'next/router';

const Component = () => {
  const router = useRouter();
  const { blogId } = router.query;
  return blogId
    ? <ViewBlog id={newBlogId(blogId as string)} />
    : null;
};

export default Component
