import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('Storage unavailable');return env.DB;}
