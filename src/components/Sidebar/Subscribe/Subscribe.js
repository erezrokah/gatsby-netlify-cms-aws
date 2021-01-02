// @flow
import React, { useState } from 'react';
import jsonp from 'jsonp';
import { Form, Message, Transition } from 'semantic-ui-react';
import styles from './Subscribe.module.scss';

// semantic-ui-less imports
import 'semantic-ui-less/definitions/elements/button.less';
import 'semantic-ui-less/definitions/elements/input.less';
import 'semantic-ui-less/definitions/collections/form.less';
import 'semantic-ui-less/definitions/collections/message.less';
import 'semantic-ui-less/definitions/modules/transition.less';

const jsonpAsync = async (url) => {
  return new Promise((resolve, reject) =>
    jsonp(url, { param: 'c', timeout: 3500 }, (err, data) => {
      if (err) reject(err);
      if (data) resolve(data);
    }),
  );
};

const Subscribe = () => {
  const endpoint = (process.env.GATSBY_MAILCHIMP_ENDPOINT || '').replace(
    '/post?',
    '/post-json?',
  );

  const [state, setState] = useState({
    email: '',
    status: '',
    message: '',
    messageVisible: false,
  });

  const onValueChange = (event) => {
    setState({ ...state, email: event.target.value });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setState({ ...state, status: 'sending', message: '' });

    let newState = state;
    try {
      const emailEncoded = encodeURIComponent(state.email);
      const queryParams = `&EMAIL=${emailEncoded}`;
      const url = `${endpoint}${queryParams}`;

      const { result, msg } = await jsonpAsync(url);

      newState = {
        email: '',
        status: result,
        message: msg,
        messageVisible: true,
      };
      setState(newState);
    } catch (e) {
      newState = {
        ...state,
        status: 'error',
        message: 'Unknown error',
        messageVisible: true,
      };
      setState(newState);
    }

    setTimeout(() => setState({ ...newState, messageVisible: false }), 3000);
  };

  return endpoint ? (
    <div className={styles['subscribe']}>
      <Form
        onSubmit={onSubmit}
        size="mini"
        loading={state.status === 'sending'}
        id="mailchimpForm"
      >
        <Form.Group unstackable>
          <Form.Input
            width={10}
            placeholder="Email"
            name="email"
            id="email"
            type="email"
            aria-label="email"
            required
            onChange={onValueChange}
            value={state.email}
          />
          <Form.Button content="Subscribe" size="mini" secondary />
        </Form.Group>
        <Transition
          visible={state.messageVisible}
          animation="fade"
          duration={1000}
        >
          <Message
            error={state.status === 'error'}
            success={state.status === 'success'}
            content={state.message}
          />
        </Transition>
      </Form>
    </div>
  ) : null;
};

export default Subscribe;
