import { Sequelize } from 'sequelize-typescript';

/**
 * SEQUELIZE variable is stored in a file named
 * 'constants' so it can be easily reused anywhere
 * without being subject to human error.
 */
// import { SEQUELIZE } from '../utils/constants';
// import { User } from '../user/user.entity';

export const databaseProviders = [
  {
    provide: Sequelize,
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'adrenaline',
        password: process.env.DB_PASSWORD || 'burger',
        database: process.env.DB_NAME || 'collabbeats',
        logging: false, // Disable logging
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });

      // Test the connection
      try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
      }

      /**
       * Add Models Here
       * ===============
       * You can add the models to
       * Sequelize later on.
       */
      //   sequelize.addModels([User]);

      await sequelize.sync();
      return sequelize;
    },
  },
];
