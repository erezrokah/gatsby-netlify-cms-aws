// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { useStaticQuery, StaticQuery } from 'gatsby';
import Author from './Author';
import imageSharp from '../../../../jest/__fixtures__/image-sharp';
import type { RenderCallback } from '../../../types';

describe('Author', () => {
  beforeEach(() => {
    StaticQuery.mockImplementationOnce(
      ({ render }: RenderCallback) => render(imageSharp),
      useStaticQuery.mockReturnValue(imageSharp),
    );
  });

  const props = {
    author: {
      name: 'test',
      bio: 'test',
    },
    isIndex: false,
  };

  it('renders correctly', () => {
    const tree = renderer.create(<Author {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
