// @flow
import getIcon from './get-icon';
import { ICONS } from '../constants';

test('getIcon', () => {
  expect(getIcon('twitter')).toBe(ICONS.TWITTER);
  expect(getIcon('github')).toBe(ICONS.GITHUB);
  expect(getIcon('vkontakte')).toBe(ICONS.VKONTAKTE);
  expect(getIcon('telegram')).toEqual(ICONS.TELEGRAM);
  expect(getIcon('email')).toEqual(ICONS.EMAIL);
  expect(getIcon('rss')).toEqual(ICONS.RSS);
  expect(getIcon('unknown')).toEqual({});
});
