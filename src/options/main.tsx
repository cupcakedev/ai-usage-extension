import { createRoot } from 'react-dom/client';
import { msg } from '../shared/i18n';
import { OptionsApp } from './OptionsApp';
import './styles.css';

// The static <title> in options.html cannot go through chrome.i18n, so localize it here.
document.title = msg('optionsTitle');

createRoot(document.getElementById('root')!).render(<OptionsApp />);
