const SITE_URL: string =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://truckdriverjobs.co';

export default SITE_URL;