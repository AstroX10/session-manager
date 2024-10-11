import { Sequelize, DataTypes } from 'sequelize';
import url from 'url';
const isPostgres = process.env.DATABASE_URL !== undefined;

let sequelize;

if (isPostgres) {
 const dbUrl = new url.URL(process.env.DATABASE_URL);

 sequelize = new Sequelize(dbUrl.href, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
   ssl: {
    require: true,
    rejectUnauthorized: false,
   },
  },
 });
} else {
 sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.db',
  logging: false,
 });
}

export const User = sequelize.define('User', {
 userId: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true,
 },
 accessKey: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
 },
});

export const File = sequelize.define('File', {
 filename: {
  type: DataTypes.STRING,
  allowNull: false,
 },
 path: {
  type: DataTypes.STRING,
  allowNull: false,
 },
});

File.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(File, { foreignKey: 'userId' });

sequelize.sync();

export default sequelize;
