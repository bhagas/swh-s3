const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('2020_lp2b_salatiga', 'root', 'sawunggaling26a', {
    host: 'localhost',
    dialect: 'mysql'
});

//   try {
//     await sequelize.authenticate();
//     console.log('Sequelize berhsail tersambung');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }

module.exports = sequelize;