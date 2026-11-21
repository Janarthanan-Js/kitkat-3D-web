import { VIDEO_DIR } from './config.js';

export async function sceneSource(file) {
  return `${VIDEO_DIR}/${file}`;
}
