import './styles/main.css';
import { ShowroomApplication } from './core/ShowroomApplication';

const container = document.querySelector<HTMLElement>('#app');

if (!container) {
  throw new Error('Application container was not found.');
}

const application = new ShowroomApplication(container);
application.start();

window.addEventListener('beforeunload', () => application.dispose(), { once: true });
