import { renderToString } from 'react-dom/server';
import Landing from '../src/pages/Landing';

export function render() { return renderToString(<Landing />); }
