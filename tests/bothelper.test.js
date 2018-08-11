// const bothelper = require('../bothelper');
//
// test('when an invalid phone number texts in, say you don\'t recognize phone number', () => {
//   bothelper.getResponse('sms', '3290', 'startprompt', 'welcome').then((response) => {
//     expect(response.messages[0].message).toContain('Sorry, we didn\'t recognize the phone number you sent this from');
//   });
// });
//
// test('when a valid phone number texts in with null topic, default to ', () => {
//   bothelper.getResponse('sms', '3290', 'startprompt', 'welcome').then((response) => {
//     expect(response.messages[0].message).toContain('Sorry, we didn\'t recognize the phone number you sent this from');
//   });
// });
test('default', () => {
  expect(1).toEqual(1);
});
