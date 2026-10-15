import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import Landing from '../src/pages/Landing';
import '../src/index.css';
import './measurement.js';

hydrateRoot(document.getElementById('root'), <Landing />);
