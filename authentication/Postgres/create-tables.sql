-- Создание таблицы User
CREATE TABLE users (
                       id SERIAL NOT NULL,
                       login TEXT NOT NULL,
                       password TEXT NOT NULL,
                       CONSTRAINT User_pkey PRIMARY KEY (id)
);

-- Создание таблицы Role
CREATE TABLE roles (
                       id SERIAL NOT NULL,
                       role TEXT NOT NULL,
                       CONSTRAINT Role_pkey PRIMARY KEY (id)
);

-- Создание таблицы UserRoles
CREATE TABLE UserRoles (
                           userId INTEGER NOT NULL,
                           roleId INTEGER NOT NULL,
                           CONSTRAINT UserRoles_pkey PRIMARY KEY (userId, roleId)
);

ALTER TABLE UserRoles
    ADD CONSTRAINT fk_userroles_users FOREIGN KEY (userId) REFERENCES users(id);

ALTER TABLE UserRoles
    ADD CONSTRAINT fk_userroles_roles FOREIGN KEY (roleId) REFERENCES roles(id);