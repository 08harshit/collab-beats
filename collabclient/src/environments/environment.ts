export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  spotify: {
    clientId: '8dfee658cf304fe1b8212fac460b8cbe',
    clientSecret: 'cd747c32ede149dfa0b8ddfe58ada4b1',
    state: 'burger',
    redirectUri: 'http://127.0.0.1:4200/callback',
    scope: 'user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state user-read-currently-playing'
  }
};
