import app from './app';
import { config } from './config/env';
import logger from './utils/logger.utils';

const PORT = config.port || 8000;

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});