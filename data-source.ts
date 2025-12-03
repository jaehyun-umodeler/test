import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';

import typeormConfig from './src/configs/typeorm.config';

export default new DataSource(typeormConfig() as DataSourceOptions);
