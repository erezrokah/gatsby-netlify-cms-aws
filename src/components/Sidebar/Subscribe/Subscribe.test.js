// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Subscribe from './Subscribe';

const setup = () => {
  const utils = render(<Subscribe />);
  const input = utils.container.querySelector('#email');
  const form = utils.container.querySelector('#mailchimpForm');
  return {
    input,
    form,
    ...utils,
  };
};

jest.mock('jsonp');
jest.useFakeTimers();
// jest.mock('semantic-ui-react/dist/es/modules/Transition/Transition.js');

afterEach(cleanup);

describe('Subscribe', () => {
  const endpoint =
    'https://domain.us3.list-manage.com/subscribe/post?u=aaaaaaa&amp;id=bbbbb';

  beforeEach(() => {
    process.env.GATSBY_MAILCHIMP_ENDPOINT = endpoint;
    jest.clearAllMocks();
  });

  it('renders correctly no endpoint', () => {
    process.env.GATSBY_MAILCHIMP_ENDPOINT = '';
    act(() => {
      const tree = renderer.create(<Subscribe />);
      expect(tree.toJSON()).toMatchSnapshot();
    });
  });

  it('renders correctly with endpoint', () => {
    act(() => {
      const tree = renderer.create(<Subscribe />);
      expect(tree.toJSON()).toMatchSnapshot();
    });
  });

  test('Should update email with value', () => {
    const { input, container } = setup();
    act(() => {
      fireEvent.change(input, { target: { value: 'admin@test.com' } });
    });
    expect(container.firstChild).toMatchSnapshot();
  });

  test('Should subscribe to email', () => {
    const jsonp = require('jsonp');

    jsonp.mockImplementation((url, params, callback) => {
      callback(null, { status: 'success', message: 'message' });
    });

    const { input, form, container } = setup();
    const email = 'admin@test.com';

    fireEvent.change(input, { target: { value: email } });
    fireEvent.submit(form);

    expect(jsonp).toHaveBeenCalledTimes(1);
    expect(jsonp).toHaveBeenCalledWith(
      endpoint.replace('/post?', '/post-json?') +
        `&EMAIL=${encodeURIComponent(email)}`,
      { param: 'c', timeout: 3500 },
      expect.any(Function),
    );

    expect(container.firstChild).toMatchSnapshot();
    jest.advanceTimersByTime(4000);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('Should handle jsonp error', () => {
    const jsonp = require('jsonp');

    jsonp.mockImplementation((url, params, callback) => {
      callback('Unknown error', null);
    });

    const { input, form, container } = setup();
    const email = 'admin@test.com';
    fireEvent.change(input, { target: { value: email } });
    fireEvent.submit(form);

    expect(jsonp).toHaveBeenCalledTimes(1);

    expect(container.firstChild).toMatchSnapshot();
    jest.advanceTimersByTime(4000);
    expect(container.firstChild).toMatchSnapshot();
  });
});
