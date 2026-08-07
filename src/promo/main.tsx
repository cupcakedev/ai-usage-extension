import { LOCALE } from './locale';
import { installRuntimeStub, loadMessages } from './runtime';

installRuntimeStub(await loadMessages(LOCALE));

const { renderPromo } = await import('./render');

renderPromo();
