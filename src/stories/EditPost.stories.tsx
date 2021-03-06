import React from 'react';
import { InnerEditPost } from '../components/posts/EditPost';
import { mockBlogId } from './mocks/BlogMocks';
import { mockPostJson, mockPostStruct, mockPostValidation } from './mocks/PostMocks';

export default {
  title: 'Posts | Edit'
}

export const _NewPost = () =>
  <InnerEditPost {...mockPostValidation} blogId={mockBlogId} />

export const _EditPost = () =>
  <InnerEditPost {...mockPostValidation} blogId={mockBlogId} struct={mockPostStruct} json={mockPostJson} />
